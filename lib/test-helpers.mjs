import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Create a temporary test database
 * @returns {string} Path to test database
 */
export function createTestDatabase() {
  const testDbPath = path.join(__dirname, '..', 'test-temp.db');

  // Remove if it already exists
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  return testDbPath;
}

/**
 * Clean up test database
 * @param {string} testDbPath - Path to test database
 */
export function cleanupTestDatabase(testDbPath) {
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
}

/**
 * Delete specific links from the database by their IDs
 * @param {string[]} ids - Array of link IDs to delete
 * @param {string} dbPath - Database path
 */
export function deleteLinks(ids, dbPath) {
  const db = new Database(dbPath);

  const deleteStmt = db.prepare('DELETE FROM links WHERE id = ?');

  for (const id of ids) {
    deleteStmt.run(id);
  }

  db.close();
}
