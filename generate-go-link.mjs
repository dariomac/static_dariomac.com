#!/usr/bin/env node

import 'dotenv/config';
import { encrypt, generateKey } from './lib/encryptor.mjs';

const args = process.argv.slice(2);

// Check if we're generating a new key
if (args[0] === '--generate-key') {
  console.log('\n🔑 Generated encryption key (add this to your .env file):');
  console.log(`\nGO_LINK_SECRET_KEY=${generateKey()}\n`);
  process.exit(0);
}

// Check if URL is provided
if (args.length === 0) {
  console.error('\n❌ Error: No URL provided\n');
  console.log('Usage:');
  console.log('  node generate-go-link.mjs <url>');
  console.log('  node generate-go-link.mjs --generate-key\n');
  console.log('Examples:');
  console.log('  node generate-go-link.mjs https://example.com/blog/my-post');
  console.log('  node generate-go-link.mjs --generate-key\n');
  process.exit(1);
}

const url = args[0];

// Validate that GO_LINK_SECRET_KEY is set
if (!process.env.GO_LINK_SECRET_KEY) {
  console.error('\n❌ Error: GO_LINK_SECRET_KEY environment variable is not set\n');
  console.log('Steps to fix:');
  console.log('1. Generate a key: node generate-go-link.mjs --generate-key');
  console.log('2. Add it to your .env file');
  console.log('3. Load the .env file: source .env (or use dotenv)\n');
  process.exit(1);
}

try {
  const slug = encrypt(url);
  const domain = process.env.GO_LINK_DOMAIN || 'dariomac.com';
  const protocol = process.env.GO_LINK_PROTOCOL || 'https';
  const fullUrl = `${protocol}://${domain}/go/${slug}`;

  console.log('\n✅ Encrypted link generated successfully!\n');
  console.log(`Original URL: ${url}`);
  console.log(`Slug:         ${slug}`);
  console.log(`Full link:    ${fullUrl}\n`);
  console.log('📋 Copy this link to share:\n');
  console.log(`   ${fullUrl}\n`);
} catch (error) {
  console.error(`\n❌ Error: ${error.message}\n`);
  process.exit(1);
}
