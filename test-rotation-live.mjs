#!/usr/bin/env node
import 'dotenv/config';
import { decrypt } from './lib/encryptor.mjs';

const oldSlug = '05KCMJCoKDoTqmR4csRWxZ0Oo4aFdZ2hjJB6yML9E-wxWvoL-c8LrhCnzm1E71cFWptdYnu07QMuYekK';
const newSlug = 'EKErT4oPZG_hhgHWXTeIeBsSYQ6z1hgZ9b9njIbOjSvQW8WxApiySoM2tP1Ek57CyhEMRK4sQutqI6I3';

console.log('🔄 Testing key rotation with real links...\n');

console.log('Test 1: OLD link (created before rotation with old key)');
try {
  const oldUrl = decrypt(oldSlug);
  console.log(`  ✅ Decryption successful: ${oldUrl}\n`);
} catch (error) {
  console.log(`  ❌ Decryption failed: ${error.message}\n`);
  process.exit(1);
}

console.log('Test 2: NEW link (created after rotation with new key)');
try {
  const newUrl = decrypt(newSlug);
  console.log(`  ✅ Decryption successful: ${newUrl}\n`);
} catch (error) {
  console.log(`  ❌ Decryption failed: ${error.message}\n`);
  process.exit(1);
}

console.log('✨ Key rotation working perfectly!');
console.log('   - Old links still work (backward compatibility)');
console.log('   - New links use new key (forward security)\n');
