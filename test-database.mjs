#!/usr/bin/env node

import { addLink, getLink, incrementClicks, getAllLinks, deleteExpiredLinks } from './lib/link-db.mjs';

console.log('🧪 Testing Database Functions\n');

// Test 1: Add a link
console.log('1. Adding a test link...');
const link1 = addLink('https://example.com/test');
console.log(`✓ Added link: ${link1.id} -> ${link1.url}`);

// Test 2: Get the link
console.log('\n2. Retrieving the link...');
const retrieved = getLink(link1.id);
console.log(`✓ Retrieved: ${retrieved.url}`);
console.log(`  - Clicks: ${retrieved.clicks}`);
console.log(`  - Expired: ${retrieved.isExpired}`);

// Test 3: Increment clicks
console.log('\n3. Incrementing clicks...');
incrementClicks(link1.id);
incrementClicks(link1.id);
const afterClicks = getLink(link1.id);
console.log(`✓ Clicks after increment: ${afterClicks.clicks}`);

// Test 4: Add link with future expiration
console.log('\n4. Adding link with future expiration...');
const futureDate = new Date(Date.now() + 86400000); // Tomorrow
const link2 = addLink('https://example.com/future', futureDate);
console.log(`✓ Added: ${link2.id} (expires: ${new Date(link2.expiresAt).toISOString()})`);

// Test 5: Add link with past expiration (manually for testing)
console.log('\n5. Adding link with past expiration (for testing)...');
const pastDate = new Date(Date.now() - 86400000); // Yesterday
const link3 = addLink('https://example.com/expired', pastDate);
const expiredLink = getLink(link3.id);
console.log(`✓ Added: ${link3.id} (expired: ${expiredLink.isExpired})`);

// Test 6: Get all links
console.log('\n6. Getting all links...');
const allLinks = getAllLinks(10);
console.log(`✓ Found ${allLinks.length} links:`);
allLinks.forEach(link => {
  console.log(`   - ${link.id}: ${link.url} (clicks: ${link.clicks}, expired: ${link.isExpired})`);
});

// Test 7: Delete expired links
console.log('\n7. Deleting expired links...');
const deleted = deleteExpiredLinks();
console.log(`✓ Deleted ${deleted} expired link(s)`);

console.log('\n✅ All tests completed!\n');
