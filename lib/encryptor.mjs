import crypto from 'crypto';

/**
 * Signing utility for URL shortener with key rotation and expiration support
 * Uses HMAC-SHA256 (truncated to 128 bits) for tamper-proof but visible links
 * Supports multiple keys and time-based link expiration
 */

const KEY_LENGTH = 32; // 256 bits

/**
 * Parse key configuration from environment
 * Supports both legacy comma-separated format and new JSON format with expiration
 *
 * Format 1 (Legacy): "key1,key2,key3"
 * Format 2 (JSON): '[{"key":"abc...="},{"key":"xyz...=","expires":"2025-12-31T23:59:59Z"}]'
 *
 * @returns {Array<{key: Buffer, expires: Date|null}>} Array of key objects
 */
function getAllEncryptionKeys() {
  const keysEnv = process.env.GO_LINK_SECRET_KEY || process.env.GO_LINK_SECRET_KEYS;

  if (!keysEnv || keysEnv.trim().length === 0) {
    throw new Error(
      'GO_LINK_SECRET_KEY or GO_LINK_SECRET_KEYS environment variable is required. ' +
      'Generate one with: node generate-go-link.mjs --generate-key'
    );
  }

  let keyConfigs = [];

  // Try to parse as JSON first (new format)
  if (keysEnv.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(keysEnv);
      if (!Array.isArray(parsed)) {
        throw new Error('GO_LINK_SECRET_KEYS JSON must be an array');
      }

      keyConfigs = parsed.map((config, i) => {
        if (!config.key) {
          throw new Error(`Key configuration #${i + 1} missing 'key' property`);
        }

        const keyBuffer = Buffer.from(config.key, 'base64');
        if (keyBuffer.length !== KEY_LENGTH) {
          throw new Error(
            `Key #${i + 1} must be ${KEY_LENGTH} bytes (${KEY_LENGTH * 8} bits). ` +
            `Current key is ${keyBuffer.length} bytes.`
          );
        }

        return {
          key: keyBuffer,
          expires: config.expires ? new Date(config.expires) : null
        };
      });
    } catch (error) {
      throw new Error(`Failed to parse GO_LINK_SECRET_KEYS JSON: ${error.message}`);
    }
  } else {
    // Legacy comma-separated format
    const keyStrings = keysEnv.split(',').map(k => k.trim()).filter(k => k.length > 0);

    if (keyStrings.length === 0) {
      throw new Error('GO_LINK_SECRET_KEY cannot be empty');
    }

    keyConfigs = keyStrings.map((keyString, i) => {
      const keyBuffer = Buffer.from(keyString, 'base64');

      if (keyBuffer.length !== KEY_LENGTH) {
        throw new Error(
          `Key #${i + 1} must be ${KEY_LENGTH} bytes (${KEY_LENGTH * 8} bits). ` +
          `Current key is ${keyBuffer.length} bytes.`
        );
      }

      return {
        key: keyBuffer,
        expires: null // Legacy keys have no expiration
      };
    });
  }

  if (keyConfigs.length === 0) {
    throw new Error('At least one encryption key is required');
  }

  return keyConfigs;
}

/**
 * Get the current (active) signing key for new links
 * @returns {Buffer} 32-byte HMAC key
 */
function getEncryptionKey() {
  const keys = getAllEncryptionKeys();
  return keys[0].key; // Always use the first (newest) key for signing
}

/**
 * Sign a URL into a URL-safe slug with generation date
 * Uses HMAC-SHA256 for tamper-proof but visible links (shorter than encryption)
 * @param {string} url - The URL to sign
 * @returns {string} Base64url payload + HMAC signature
 */
export function encrypt(url) {
  if (!url || typeof url !== 'string') {
    throw new Error('URL must be a non-empty string');
  }

  // Validate URL format
  try {
    new URL(url);
  } catch (error) {
    throw new Error(`Invalid URL: ${error.message}`);
  }

  // Create payload with generation date using shorter keys for smaller slugs
  // Format: {"l":"url","d":timestamp_ms}
  const payload = JSON.stringify({
    l: url,
    d: Date.now()
  });

  // Encode payload to base64url (visible but tamper-proof)
  const encodedPayload = Buffer.from(payload, 'utf8').toString('base64url');

  // Sign with HMAC-SHA256 using the first (newest) key
  // Truncate to 128 bits (16 bytes) for shorter slugs while maintaining strong security
  const key = getEncryptionKey();
  const hmac = crypto.createHmac('sha256', key);
  hmac.update(encodedPayload);
  const fullSignature = hmac.digest();
  const truncatedSignature = fullSignature.subarray(0, 16).toString('base64url'); // 128 bits = 22 chars

  // Format: payload.signature (truncated)
  // This allows easy separation and verification
  return `${encodedPayload}.${truncatedSignature}`;
}

/**
 * Verify a signed slug and return the original URL with metadata
 * Format: base64url(payload).hmac_signature (HMAC-SHA256, visible but tamper-proof)
 *
 * @param {string} slug - The signed slug (payload.signature)
 * @returns {Object} Verification result with url, genDate, and expiration info
 * @throws {Error} If verification fails with all keys or link is expired
 */
export function decrypt(slug) {
  if (!slug || typeof slug !== 'string') {
    throw new Error('Slug must be a non-empty string');
  }

  // Expect format: payload.signature
  if (!slug.includes('.')) {
    throw new Error('Invalid slug format - expected signed format (payload.signature)');
  }

  const keyConfigs = getAllEncryptionKeys();
  const errors = [];

  // Parse signed format: payload.signature
  const lastDotIndex = slug.lastIndexOf('.');
  const encodedPayload = slug.substring(0, lastDotIndex);
  const providedSignature = slug.substring(lastDotIndex + 1);

  // Try each key to verify signature
  for (let i = 0; i < keyConfigs.length; i++) {
    const { key, expires } = keyConfigs[i];

    try {
      // Verify HMAC signature (supports both truncated and full signatures)
      const hmac = crypto.createHmac('sha256', key);
      hmac.update(encodedPayload);
      const fullSignature = hmac.digest();

      let isValid = false;

      // Truncated format: 128 bits (16 bytes) = ~22 chars in base64url
      if (providedSignature.length <= 22) {
        const expectedTruncated = fullSignature.subarray(0, 16).toString('base64url');
        isValid = (expectedTruncated === providedSignature);
      }
      // Full format: 256 bits (32 bytes) = ~43 chars in base64url
      else {
        const expectedFull = fullSignature.toString('base64url');
        isValid = (expectedFull === providedSignature);
      }

      if (!isValid) {
        throw new Error('Invalid signature');
      }

      // Signature valid! Decode payload
      const payloadText = Buffer.from(encodedPayload, 'base64url').toString('utf8');
      const payload = JSON.parse(payloadText);

      let url, genDate;
      // Current format: {"l":"url","d":timestamp}
      if (payload.l !== undefined && payload.d !== undefined) {
        url = payload.l;
        genDate = new Date(payload.d);
      } else {
        throw new Error('Invalid payload structure');
      }

      // Check expiration if key has expiration date AND link has generation date
      if (expires && genDate) {
        if (genDate > expires) {
          console.log(`[Encryptor] Link expired: genDate ${genDate.toISOString()} > key expires ${expires.toISOString()}`);
          throw new Error('Link has expired');
        }
      }

      // Success! Log which key was used
      if (i > 0) {
        console.log(`[Encryptor] Verified with key #${i + 1} (older key)`);
      }

      return {
        url,
        genDate,
        keyIndex: i,
        keyExpires: expires,
        isExpired: false
      };
    } catch (error) {
      // If this is an expiration error, throw immediately
      if (error.message === 'Link has expired') {
        throw error;
      }
      errors.push(`Key #${i + 1}: ${error.message}`);
      continue;
    }
  }

  // None of the keys worked
  console.error(`[Encryptor] Failed to verify signature with ${keyConfigs.length} key(s)`);
  throw new Error('Invalid or tampered slug - verification failed with all available keys');
}

/**
 * Generate a new HMAC signing key
 * @returns {string} Base64-encoded 256-bit key
 */
export function generateKey() {
  return crypto.randomBytes(KEY_LENGTH).toString('base64');
}

/**
 * Get information about loaded signing keys
 * Useful for monitoring and debugging
 * @returns {Object} Key information
 */
export function getKeyInfo() {
  try {
    const keys = getAllEncryptionKeys();
    return {
      count: keys.length,
      hasMultipleKeys: keys.length > 1,
      activeKeyPreview: keys[0].key.toString('base64').substring(0, 8) + '...',
      oldKeyCount: keys.length - 1,
      keysWithExpiration: keys.filter(k => k.expires !== null).length,
      expirationDates: keys.map((k, i) => ({
        keyIndex: i + 1,
        expires: k.expires ? k.expires.toISOString() : 'never'
      }))
    };
  } catch (error) {
    return {
      error: error.message,
      count: 0
    };
  }
}
