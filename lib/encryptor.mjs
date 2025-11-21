import crypto from 'crypto';

/**
 * Encryption utility for URL shortener with key rotation and expiration support
 * Uses AES-256-GCM for authenticated encryption
 * Supports multiple keys and time-based link expiration
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
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
 * Get the current (active) encryption key for new encryptions
 * @returns {Buffer} 32-byte encryption key
 */
function getEncryptionKey() {
  const keys = getAllEncryptionKeys();
  return keys[0].key; // Always use the first (newest) key for encryption
}

/**
 * Encrypt a URL into a URL-safe slug with generation date
 * @param {string} url - The URL to encrypt
 * @returns {string} Base64url-encoded encrypted slug
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

  // Create payload with generation date
  const payload = JSON.stringify({
    link: url,
    genDate: new Date().toISOString()
  });

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(payload, 'utf8'),
    cipher.final()
  ]);

  const authTag = cipher.getAuthTag();

  // Combine: IV + encrypted data + auth tag
  const combined = Buffer.concat([iv, encrypted, authTag]);

  // Convert to base64url (URL-safe)
  return combined.toString('base64url');
}

/**
 * Decrypt a slug back to the original URL with metadata
 * Tries all available keys (supports key rotation)
 * Handles both old format (plain URL) and new format (JSON with genDate)
 *
 * @param {string} slug - The encrypted slug
 * @returns {Object} Decryption result with url, genDate, and expiration info
 * @throws {Error} If decryption fails with all keys or link is expired
 */
export function decrypt(slug) {
  if (!slug || typeof slug !== 'string') {
    throw new Error('Slug must be a non-empty string');
  }

  const keyConfigs = getAllEncryptionKeys();
  const errors = [];

  // Try each key in order (newest to oldest)
  for (let i = 0; i < keyConfigs.length; i++) {
    const { key, expires } = keyConfigs[i];

    try {
      const combined = Buffer.from(slug, 'base64url');

      // Extract components
      const iv = combined.subarray(0, IV_LENGTH);
      const authTag = combined.subarray(combined.length - AUTH_TAG_LENGTH);
      const encrypted = combined.subarray(IV_LENGTH, combined.length - AUTH_TAG_LENGTH);

      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);

      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]);

      const decryptedText = decrypted.toString('utf8');

      // Try to parse as JSON (new format with genDate)
      let url, genDate;
      try {
        const payload = JSON.parse(decryptedText);
        if (payload.link && payload.genDate) {
          // New format: JSON with link and genDate
          url = payload.link;
          genDate = new Date(payload.genDate);
        } else {
          // Invalid JSON structure, treat as plain URL
          url = decryptedText;
          genDate = null;
        }
      } catch {
        // Not JSON, must be old format (plain URL)
        url = decryptedText;
        genDate = null;
      }

      // Check expiration if key has expiration date AND link has generation date
      if (expires && genDate) {
        if (genDate > expires) {
          console.log(`[Encryptor] Link expired: genDate ${genDate.toISOString()} > key expires ${expires.toISOString()}`);
          // Link successfully decrypted but is expired - return 410 immediately
          throw new Error('Link has expired');
        }
      }

      // Success! Log which key was used (helpful for monitoring)
      if (i > 0) {
        console.log(`[Encryptor] Decrypted with key #${i + 1} (older key)`);
      }

      return {
        url,
        genDate,
        keyIndex: i,
        keyExpires: expires,
        isExpired: false
      };
    } catch (error) {
      // If this is an expiration error (link successfully decrypted but expired), throw immediately
      if (error.message === 'Link has expired') {
        throw error;
      }
      // This key didn't work, try the next one
      errors.push(`Key #${i + 1}: ${error.message}`);
      continue;
    }
  }

  // None of the keys worked
  console.error(`[Encryptor] Failed to decrypt with ${keyConfigs.length} key(s)`);
  throw new Error('Invalid or tampered slug - decryption failed with all available keys');
}

/**
 * Generate a new encryption key
 * @returns {string} Base64-encoded 256-bit key
 */
export function generateKey() {
  return crypto.randomBytes(KEY_LENGTH).toString('base64');
}

/**
 * Get information about loaded encryption keys
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
