import crypto from 'crypto';

/**
 * Encryption utility for URL shortener
 * Uses AES-256-GCM for authenticated encryption
 * Ensures integrity and prevents tampering
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const KEY_LENGTH = 32; // 256 bits

/**
 * Get encryption key from environment or generate one
 * @returns {Buffer} 32-byte encryption key
 */
function getEncryptionKey() {
  const key = process.env.GO_LINK_SECRET_KEY;

  if (!key) {
    throw new Error(
      'GO_LINK_SECRET_KEY environment variable is required. ' +
      'Generate one with: node -p "crypto.randomBytes(32).toString(\'base64\')"'
    );
  }

  const keyBuffer = Buffer.from(key, 'base64');

  if (keyBuffer.length !== KEY_LENGTH) {
    throw new Error(
      `GO_LINK_SECRET_KEY must be ${KEY_LENGTH} bytes (${KEY_LENGTH * 8} bits). ` +
      `Current key is ${keyBuffer.length} bytes. ` +
      'Generate a new one with: node -p "crypto.randomBytes(32).toString(\'base64\')"'
    );
  }

  return keyBuffer;
}

/**
 * Encrypt a URL into a URL-safe slug
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

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(url, 'utf8'),
    cipher.final()
  ]);

  const authTag = cipher.getAuthTag();

  // Combine: IV + encrypted data + auth tag
  const combined = Buffer.concat([iv, encrypted, authTag]);

  // Convert to base64url (URL-safe)
  return combined.toString('base64url');
}

/**
 * Decrypt a slug back to the original URL
 * @param {string} slug - The encrypted slug
 * @returns {string} The original URL
 * @throws {Error} If decryption fails or data is tampered
 */
export function decrypt(slug) {
  if (!slug || typeof slug !== 'string') {
    throw new Error('Slug must be a non-empty string');
  }

  try {
    const key = getEncryptionKey();
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

    return decrypted.toString('utf8');
  } catch (error) {
    // GCM will throw if auth tag verification fails (tampering detected)
    throw new Error('Invalid or tampered slug');
  }
}

/**
 * Generate a new encryption key
 * @returns {string} Base64-encoded 256-bit key
 */
export function generateKey() {
  return crypto.randomBytes(KEY_LENGTH).toString('base64');
}
