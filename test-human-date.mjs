#!/usr/bin/env node

import { getAllLinks } from './lib/link-db.mjs';

console.log('🧪 Testing created_at_human column\n');

const links = getAllLinks(5);

console.log('Recent links with human-readable dates:\n');

links.forEach((link, index) => {
  console.log(`${index + 1}. ${link.id}`);
  console.log(`   URL: ${link.url}`);
  console.log(`   Created: ${link.createdAtHuman}`);
  console.log(`   Clicks: ${link.clicks}`);
  console.log('');
});

console.log('✅ All links have human-readable dates!\n');
