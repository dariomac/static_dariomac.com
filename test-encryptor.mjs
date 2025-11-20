#!/usr/bin/env node

import { encrypt, decrypt } from './lib/encryptor.mjs';

console.log('🧪 Testing encryption/decryption...\n');

// Set a test key
process.env.GO_LINK_SECRET_KEY = '8tPfNkjNJjM2rIbPND6z+NYr0PITpDde2+tUcSWesMw=';

// Test 1: Basic encryption/decryption
console.log('Test 1: Basic encryption/decryption');
const testUrl = 'https://example.com/blog/test-post';
try {
  const encrypted = encrypt(testUrl);
  console.log(`✓ Encrypted: ${encrypted.substring(0, 30)}...`);

  const decrypted = decrypt(encrypted);
  console.log(`✓ Decrypted: ${decrypted}`);

  if (decrypted === testUrl) {
    console.log('✅ Test 1 PASSED: URL matches\n');
  } else {
    console.log('❌ Test 1 FAILED: URL mismatch\n');
    process.exit(1);
  }
} catch (error) {
  console.log(`❌ Test 1 FAILED: ${error.message}\n`);
  process.exit(1);
}

// Test 2: Multiple encryptions produce different slugs (IV randomization)
console.log('Test 2: IV randomization');
try {
  const encrypted1 = encrypt(testUrl);
  const encrypted2 = encrypt(testUrl);

  if (encrypted1 !== encrypted2) {
    console.log('✅ Test 2 PASSED: Different IVs produce different slugs\n');
  } else {
    console.log('❌ Test 2 FAILED: Same slug generated twice (IV not random)\n');
    process.exit(1);
  }
} catch (error) {
  console.log(`❌ Test 2 FAILED: ${error.message}\n`);
  process.exit(1);
}

// Test 3: Tamper detection
console.log('Test 3: Tamper detection');
try {
  const encrypted = encrypt(testUrl);

  // Tamper with the slug by changing a character
  const tampered = encrypted.substring(0, encrypted.length - 5) + 'XXXXX';

  try {
    decrypt(tampered);
    console.log('❌ Test 3 FAILED: Tampered slug was not detected\n');
    process.exit(1);
  } catch (error) {
    if (error.message.includes('Invalid or tampered')) {
      console.log('✅ Test 3 PASSED: Tampering detected\n');
    } else {
      console.log(`❌ Test 3 FAILED: Wrong error: ${error.message}\n`);
      process.exit(1);
    }
  }
} catch (error) {
  console.log(`❌ Test 3 FAILED: ${error.message}\n`);
  process.exit(1);
}

// Test 4: Long URLs
console.log('Test 4: Long URL encryption');
const longUrl = 'https://example.com/blog/very-long-post-title-with-many-words-and-parameters?utm_source=twitter&utm_medium=social&utm_campaign=2024-q1&ref=dariomac&track=enabled';
try {
  const encrypted = encrypt(longUrl);
  const decrypted = decrypt(encrypted);

  if (decrypted === longUrl) {
    console.log('✅ Test 4 PASSED: Long URL handled correctly\n');
  } else {
    console.log('❌ Test 4 FAILED: Long URL mismatch\n');
    process.exit(1);
  }
} catch (error) {
  console.log(`❌ Test 4 FAILED: ${error.message}\n`);
  process.exit(1);
}

// Test 5: Invalid URL rejection
console.log('Test 5: Invalid URL rejection');
try {
  encrypt('not-a-valid-url');
  console.log('❌ Test 5 FAILED: Invalid URL was not rejected\n');
  process.exit(1);
} catch (error) {
  if (error.message.includes('Invalid URL')) {
    console.log('✅ Test 5 PASSED: Invalid URL rejected\n');
  } else {
    console.log(`❌ Test 5 FAILED: Wrong error: ${error.message}\n`);
    process.exit(1);
  }
}

// Test 6: Special characters in URLs
console.log('Test 6: Special characters in URLs');
const specialUrl = 'https://example.com/búsqueda/artículo?query=test&foo=bar#section-título';
try {
  const encrypted = encrypt(specialUrl);
  const decrypted = decrypt(encrypted);

  if (decrypted === specialUrl) {
    console.log('✅ Test 6 PASSED: Special characters handled correctly\n');
  } else {
    console.log('❌ Test 6 FAILED: Special characters corrupted\n');
    process.exit(1);
  }
} catch (error) {
  console.log(`❌ Test 6 FAILED: ${error.message}\n`);
  process.exit(1);
}

console.log('🎉 All tests passed!\n');
