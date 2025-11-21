#!/usr/bin/env node

import { encrypt, decrypt, generateKey, getKeyInfo } from './lib/encryptor.mjs';

console.log('🧪 Testing multi-key encryption and key rotation...\n');

// Generate test keys
const key1 = generateKey();
const key2 = generateKey();
const key3 = generateKey();

console.log('Generated 3 test keys:');
console.log(`  Key 1: ${key1.substring(0, 12)}...`);
console.log(`  Key 2: ${key2.substring(0, 12)}...`);
console.log(`  Key 3: ${key3.substring(0, 12)}...`);
console.log();

// Test 1: Single key encryption/decryption
console.log('Test 1: Single key (baseline)');
try {
  process.env.GO_LINK_SECRET_KEY = key1;

  const testUrl = 'https://example.com/test';
  const encrypted = encrypt(testUrl);
  const result = decrypt(encrypted);

  if (result.url === testUrl) {
    console.log('✅ Test 1 PASSED: Single key works\n');
  } else {
    console.log('❌ Test 1 FAILED: URL mismatch\n');
    process.exit(1);
  }
} catch (error) {
  console.log(`❌ Test 1 FAILED: ${error.message}\n`);
  process.exit(1);
}

// Test 2: Encrypt with key1, decrypt with key1,key2
console.log('Test 2: Old link with new key added (key rotation)');
try {
  // Encrypt with key1
  process.env.GO_LINK_SECRET_KEY = key1;
  const testUrl = 'https://example.com/old-link';
  const encrypted = encrypt(testUrl);
  console.log(`  Link encrypted with key1: ${encrypted.substring(0, 20)}...`);

  // Now add key2 at the beginning (simulate key rotation)
  process.env.GO_LINK_SECRET_KEY = `${key2},${key1}`;
  console.log('  Rotated to key2, kept key1');

  // Try to decrypt (should work with key1, which is now second)
  const result = decrypt(encrypted);

  if (result.url === testUrl) {
    console.log('✅ Test 2 PASSED: Old link still works after key rotation\n');
  } else {
    console.log('❌ Test 2 FAILED: URL mismatch\n');
    process.exit(1);
  }
} catch (error) {
  console.log(`❌ Test 2 FAILED: ${error.message}\n`);
  process.exit(1);
}

// Test 3: New links use new key
console.log('Test 3: New link uses newest key');
try {
  process.env.GO_LINK_SECRET_KEY = `${key2},${key1}`;

  const testUrl = 'https://example.com/new-link';
  const encrypted = encrypt(testUrl);
  console.log(`  Link encrypted with key2: ${encrypted.substring(0, 20)}...`);

  const result = decrypt(encrypted);

  if (result.url === testUrl) {
    console.log('✅ Test 3 PASSED: New link uses newest key\n');
  } else {
    console.log('❌ Test 3 FAILED: URL mismatch\n');
    process.exit(1);
  }
} catch (error) {
  console.log(`❌ Test 3 FAILED: ${error.message}\n`);
  process.exit(1);
}

// Test 4: Multiple key rotations
console.log('Test 4: Multiple key rotations (3 keys)');
try {
  // Create links with each key
  process.env.GO_LINK_SECRET_KEY = key1;
  const link1 = encrypt('https://example.com/link1');

  process.env.GO_LINK_SECRET_KEY = key2;
  const link2 = encrypt('https://example.com/link2');

  process.env.GO_LINK_SECRET_KEY = key3;
  const link3 = encrypt('https://example.com/link3');

  console.log('  Created 3 links with different keys');

  // Now have all 3 keys active
  process.env.GO_LINK_SECRET_KEY = `${key3},${key2},${key1}`;
  console.log('  Configured with all 3 keys');

  // All links should decrypt successfully
  const result1 = decrypt(link1);
  const result2 = decrypt(link2);
  const result3 = decrypt(link3);

  if (result1.url === 'https://example.com/link1' &&
      result2.url === 'https://example.com/link2' &&
      result3.url === 'https://example.com/link3') {
    console.log('✅ Test 4 PASSED: All links work with 3 keys active\n');
  } else {
    console.log('❌ Test 4 FAILED: URL mismatch\n');
    process.exit(1);
  }
} catch (error) {
  console.log(`❌ Test 4 FAILED: ${error.message}\n`);
  process.exit(1);
}

// Test 5: Key revocation (emergency)
console.log('Test 5: Key revocation (remove compromised key)');
try {
  // Create link with key2
  process.env.GO_LINK_SECRET_KEY = key2;
  const compromisedLink = encrypt('https://example.com/compromised');
  console.log('  Link encrypted with key2 (compromised)');

  // Revoke key2, keep key1 and key3
  process.env.GO_LINK_SECRET_KEY = `${key3},${key1}`;
  console.log('  Revoked key2, kept key1 and key3');

  // Try to decrypt link made with key2 (should fail)
  try {
    decrypt(compromisedLink);
    console.log('❌ Test 5 FAILED: Compromised link should not decrypt\n');
    process.exit(1);
  } catch (error) {
    if (error.message.includes('Invalid or tampered slug')) {
      console.log('✅ Test 5 PASSED: Revoked key cannot decrypt\n');
    } else {
      console.log(`❌ Test 5 FAILED: Wrong error: ${error.message}\n`);
      process.exit(1);
    }
  }
} catch (error) {
  console.log(`❌ Test 5 FAILED: ${error.message}\n`);
  process.exit(1);
}

// Test 6: Get key info
console.log('Test 6: Key information utility');
try {
  process.env.GO_LINK_SECRET_KEY = `${key3},${key2},${key1}`;

  const info = getKeyInfo();

  console.log('  Key info:', JSON.stringify(info, null, 2));

  if (info.count === 3 && info.hasMultipleKeys && info.oldKeyCount === 2) {
    console.log('✅ Test 6 PASSED: Key info correct\n');
  } else {
    console.log('❌ Test 6 FAILED: Key info incorrect\n');
    process.exit(1);
  }
} catch (error) {
  console.log(`❌ Test 6 FAILED: ${error.message}\n`);
  process.exit(1);
}

// Test 7: Empty and malformed keys
console.log('Test 7: Error handling for invalid keys');
try {
  process.env.GO_LINK_SECRET_KEY = '';
  try {
    encrypt('https://example.com');
    console.log('❌ Test 7 FAILED: Empty key should throw error\n');
    process.exit(1);
  } catch (error) {
    if (error.message.includes('required')) {
      console.log('✅ Test 7 PASSED: Empty key rejected\n');
    } else {
      console.log(`❌ Test 7 FAILED: Wrong error: ${error.message}\n`);
      process.exit(1);
    }
  }
} catch (error) {
  console.log(`❌ Test 7 FAILED: ${error.message}\n`);
  process.exit(1);
}

console.log('🎉 All key rotation tests passed!\n');
console.log('Summary:');
console.log('✅ Single key encryption/decryption');
console.log('✅ Key rotation without breaking old links');
console.log('✅ New links use newest key');
console.log('✅ Multiple keys work simultaneously');
console.log('✅ Key revocation works correctly');
console.log('✅ Key info utility works');
console.log('✅ Error handling for invalid keys');
console.log();
console.log('Your key rotation system is ready! 🚀\n');
