#!/usr/bin/env node

import { addLink } from './lib/link-db.mjs';

// Add an expired link for testing server 410 response
const pastDate = new Date(Date.now() - 86400000); // Yesterday
const link = addLink('https://example.com/expired-test', pastDate);

console.log(`\n✅ Added expired test link: ${link.id}`);
console.log(`Test URL: http://localhost:7007/go/${link.id}\n`);
