#!/usr/bin/env node

import 'dotenv/config';
import { addLink } from './lib/link-db.mjs';

const args = process.argv.slice(2);

// Show usage if no arguments
if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log('\n📎 Add Go Link - Database-backed URL shortener\n');
  console.log('Usage:');
  console.log('  node add-go-link.mjs <url> [--expires <date>] [--external-db <path>]\n');
  console.log('Examples:');
  console.log('  node add-go-link.mjs https://example.com/blog/post');
  console.log('  node add-go-link.mjs https://example.com --expires 2025-12-31');
  console.log('  node add-go-link.mjs https://example.com --expires "2025-12-31 23:59:59"');
  console.log('  node add-go-link.mjs https://example.com --external-db /path/to/external.db\n');
  console.log('Options:');
  console.log('  --expires <date>       Set expiration date (ISO 8601 format)');
  console.log('  --external-db <path>   Also add to external database file');
  console.log('  -h, --help             Show this help message\n');
  process.exit(0);
}

const url = args[0];

// Parse optional expiration date
let expiresAt = null;
const expiresIndex = args.indexOf('--expires');
if (expiresIndex !== -1 && args[expiresIndex + 1]) {
  const expiresStr = args[expiresIndex + 1];
  try {
    expiresAt = new Date(expiresStr);
    if (isNaN(expiresAt.getTime())) {
      console.error(`\n❌ Error: Invalid expiration date: ${expiresStr}\n`);
      console.log('Expected format: YYYY-MM-DD or ISO 8601 date string\n');
      process.exit(1);
    }

    // Check if expiration is in the past
    if (expiresAt.getTime() <= Date.now()) {
      console.error('\n❌ Error: Expiration date must be in the future\n');
      process.exit(1);
    }
  } catch (error) {
    console.error(`\n❌ Error: Failed to parse expiration date: ${error.message}\n`);
    process.exit(1);
  }
}

// Parse optional external database path
let externalDbPath = null;
const externalDbIndex = args.indexOf('--external-db');
if (externalDbIndex !== -1 && args[externalDbIndex + 1]) {
  externalDbPath = args[externalDbIndex + 1];
}

// Validate URL
try {
  new URL(url);
} catch (error) {
  console.error(`\n❌ Error: Invalid URL: ${url}\n`);
  console.log('URL must include protocol (https:// or http://)\n');
  process.exit(1);
}

// Add link to database
try {
  const link = addLink(url, expiresAt, externalDbPath);

  const domain = process.env.GO_LINK_DOMAIN || 'dariomac.com';
  const protocol = process.env.GO_LINK_PROTOCOL || 'https';
  const fullUrl = `${protocol}://${domain}/go/${link.id}`;

  console.log('\n✅ Link added to database successfully!\n');
  console.log(`ID:           ${link.id}`);
  console.log(`URL:          ${url}`);
  console.log(`Created:      ${new Date(link.createdAt).toISOString()}`);

  if (link.expiresAt) {
    console.log(`Expires:      ${new Date(link.expiresAt).toISOString()}`);
  } else {
    console.log(`Expires:      Never`);
  }

  console.log(`Full link:    ${fullUrl}`);

  if (externalDbPath) {
    console.log(`\n🔗 Synced to:  Local database + ${externalDbPath}`);
  }

  console.log('\n📋 Copy this link to share:\n');
  console.log(`   ${fullUrl}\n`);
} catch (error) {
  console.error(`\n❌ Error: ${error.message}\n`);
  process.exit(1);
}
