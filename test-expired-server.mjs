#!/usr/bin/env node

import { addLink } from './lib/link-db.mjs';
import { deleteLinks } from './lib/test-helpers.mjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'data/links.db');

console.log('\n🧪 Adding expired test link for server testing...');

// Add an expired link for testing server 410 response
const pastDate = new Date(Date.now() - 86400000); // Yesterday
const link = addLink('https://example.com/expired-test', pastDate);

console.log(`\n✅ Added expired test link: ${link.id}`);
console.log(`   Test URL: http://localhost:7007/go/${link.id}`);
console.log(`\n📝 After testing, run: node -e "import('./lib/test-helpers.mjs').then(m => m.deleteLinks(['${link.id}'], '${DB_PATH}'))"`);
console.log(`   Or press Ctrl+C and this script will clean up automatically.\n`);

// Clean up on exit
process.on('SIGINT', () => {
  console.log('\n\n🧹 Cleaning up test link...');
  deleteLinks([link.id], DB_PATH);
  console.log('✅ Test link removed\n');
  process.exit(0);
});

// Keep process running until user presses Ctrl+C
process.stdin.resume();
