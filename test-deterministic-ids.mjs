#!/usr/bin/env node

import crypto from 'crypto';

const BASE62_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const ID_LENGTH = 10;

function generateIdFromUrl(url, length = ID_LENGTH) {
  const hash = crypto.createHash('sha256').update(url).digest();
  let id = '';
  let num = BigInt('0x' + hash.toString('hex'));

  while (id.length < length && num > 0n) {
    const remainder = Number(num % 62n);
    id = BASE62_CHARS[remainder] + id;
    num = num / 62n;
  }

  while (id.length < length) {
    id = BASE62_CHARS[0] + id;
  }

  return id.substring(0, length);
}

console.log('🧪 Testing Deterministic ID Generation\n');

const testUrls = [
  'https://example.com/deterministic-test',
  'https://example.com/deterministic-test',  // Same URL
  'https://example.com/deterministic-test-2',
  'https://github.com/example-user',
  'https://github.com/example-user',  // Same URL
];

console.log('Generating IDs for test URLs:\n');

testUrls.forEach((url, index) => {
  const id = generateIdFromUrl(url);
  console.log(`${index + 1}. ${url}`);
  console.log(`   ID: ${id}\n`);
});

console.log('✅ Notice: Same URLs produce the same ID!');
