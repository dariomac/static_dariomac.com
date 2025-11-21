#!/usr/bin/env node

import Database from 'better-sqlite3';
import fs from 'fs';

const externalDbPath = '/tmp/external-links.db';

console.log('🧪 Testing External Database Sync\n');

// Check if external database exists
if (!fs.existsSync(externalDbPath)) {
  console.log('❌ External database not found at:', externalDbPath);
  process.exit(1);
}

// Open external database
const db = new Database(externalDbPath);

// Get all links
const links = db.prepare('SELECT id, url, created_at, expires_at FROM links ORDER BY created_at DESC').all();

console.log(`📊 Found ${links.length} links in external database:\n`);

links.forEach(link => {
  console.log(`ID: ${link.id}`);
  console.log(`URL: ${link.url}`);
  console.log(`Created: ${new Date(link.created_at).toISOString()}`);
  if (link.expires_at) {
    console.log(`Expires: ${new Date(link.expires_at).toISOString()}`);
  } else {
    console.log(`Expires: Never`);
  }
  console.log('');
});

db.close();

console.log('✅ External database is working correctly!\n');
