import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'links.db');

// Base62 alphabet (a-z, A-Z, 0-9) for short IDs
const BASE62_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const ID_LENGTH = 10; // 62^10 = 839 quadrillion combinations

/**
 * Initialize SQLite database
 * @param {string} dbPath - Optional custom database path
 */
function initDatabase(dbPath = DB_PATH) {
  const db = new Database(dbPath);

  // Create links table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS links (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER,
      clicks INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_expires ON links(expires_at);
    CREATE INDEX IF NOT EXISTS idx_created ON links(created_at DESC);
  `);

  return db;
}

/**
 * Generate a deterministic Base62 ID from a URL using SHA-256 hash
 * Same URL always produces the same ID
 * @param {string} url - The URL to generate an ID from
 * @param {number} length - Length of the ID (default 10)
 * @returns {string} Base62 ID derived from URL hash
 */
function generateIdFromUrl(url, length = ID_LENGTH) {
  // Create SHA-256 hash of the URL
  const hash = crypto.createHash('sha256').update(url).digest();

  // Convert hash bytes to Base62
  let id = '';
  let num = BigInt('0x' + hash.toString('hex'));

  // Convert to Base62
  while (id.length < length && num > 0n) {
    const remainder = Number(num % 62n);
    id = BASE62_CHARS[remainder] + id;
    num = num / 62n;
  }

  // Pad with first character if needed (extremely rare)
  while (id.length < length) {
    id = BASE62_CHARS[0] + id;
  }

  // Take first 'length' characters
  return id.substring(0, length);
}

/**
 * Add a new link to the database
 * @param {string} url - The URL to shorten
 * @param {Date|number|null} expiresAt - Optional expiration date
 * @param {string|string[]|null} dbPath - Optional database path(s). Can be a single path or array of paths
 * @returns {Object} Link object with id and url
 */
export function addLink(url, expiresAt = null, dbPath = null) {
  // Validate URL
  try {
    new URL(url);
  } catch (error) {
    throw new Error(`Invalid URL: ${error.message}`);
  }

  // Generate deterministic ID from URL
  const id = generateIdFromUrl(url);
  const createdAt = Date.now();
  const expiresAtTimestamp = expiresAt ?
    (typeof expiresAt === 'number' ? expiresAt : expiresAt.getTime()) :
    null;

  // Determine which databases to use
  const dbPaths = dbPath
    ? (Array.isArray(dbPath) ? dbPath : [dbPath])
    : [];

  // Always include the default local database first
  const allDbPaths = [DB_PATH, ...dbPaths.filter(p => p !== DB_PATH)];

  // Insert into all databases
  for (let i = 0; i < allDbPaths.length; i++) {
    const db = initDatabase(allDbPaths[i]);
    try {
      // Try to insert, if it already exists (PRIMARY KEY constraint), it will throw
      // We catch it and provide a better error message
      db.prepare(`
        INSERT INTO links (id, url, created_at, expires_at)
        VALUES (?, ?, ?, ?)
      `).run(id, url, createdAt, expiresAtTimestamp);
    } catch (error) {
      db.close();
      if (error.code === 'SQLITE_CONSTRAINT_PRIMARYKEY' || error.message.includes('UNIQUE constraint failed')) {
        throw new Error(`This URL already exists in the database with ID: ${id}`);
      }
      throw error;
    } finally {
      if (db.open) {
        db.close();
      }
    }
  }

  return {
    id,
    url,
    createdAt,
    expiresAt: expiresAtTimestamp
  };
}

/**
 * Get a link by ID
 * @param {string} id - The link ID
 * @returns {Object|null} Link object or null if not found
 */
export function getLink(id) {
  const db = initDatabase();

  const link = db.prepare(`
    SELECT id, url, created_at, expires_at, clicks
    FROM links
    WHERE id = ?
  `).get(id);

  db.close();

  if (!link) {
    return null;
  }

  return {
    id: link.id,
    url: link.url,
    createdAt: link.created_at,
    expiresAt: link.expires_at,
    clicks: link.clicks,
    isExpired: link.expires_at && Date.now() > link.expires_at
  };
}

/**
 * Increment click counter for a link
 * @param {string} id - The link ID
 */
export function incrementClicks(id) {
  const db = initDatabase();

  db.prepare(`
    UPDATE links
    SET clicks = clicks + 1
    WHERE id = ?
  `).run(id);

  db.close();
}

/**
 * Get all links (for admin/debugging)
 * @param {number} limit - Maximum number of links to return
 * @returns {Array} Array of link objects
 */
export function getAllLinks(limit = 100) {
  const db = initDatabase();

  const links = db.prepare(`
    SELECT id, url, created_at, expires_at, clicks
    FROM links
    ORDER BY created_at DESC
    LIMIT ?
  `).all(limit);

  db.close();

  return links.map(link => ({
    id: link.id,
    url: link.url,
    createdAt: link.created_at,
    expiresAt: link.expires_at,
    clicks: link.clicks,
    isExpired: link.expires_at && Date.now() > link.expires_at
  }));
}

/**
 * Delete expired links (cleanup)
 * @returns {number} Number of deleted links
 */
export function deleteExpiredLinks() {
  const db = initDatabase();

  const result = db.prepare(`
    DELETE FROM links
    WHERE expires_at IS NOT NULL AND expires_at < ?
  `).run(Date.now());

  db.close();

  return result.changes;
}
