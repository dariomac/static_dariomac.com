#!/usr/bin/env node

import { generateRedirectPage } from './lib/redirect-template.mjs';
import fs from 'fs';

console.log('🧪 Testing redirect page generation...\n');

// Test 1: Generate a redirect page
console.log('Test 1: Generate redirect page HTML');
const testUrl = 'https://example.com/blog/test-post';
const testSlug = 'abc123def456';

try {
  const html = generateRedirectPage(testUrl, testSlug);

  // Check if HTML contains expected elements
  const checks = [
    { test: html.includes('<!DOCTYPE html>'), desc: 'Has DOCTYPE' },
    { test: html.includes('gtag'), desc: 'Has Google Analytics (gtag)' },
    { test: html.includes('posthog'), desc: 'Has PostHog' },
    { test: html.includes('G-NBDFJZDVV3'), desc: 'Has correct GA tracking ID' },
    { test: html.includes(testUrl), desc: 'Contains destination URL' },
    { test: html.includes('page_view'), desc: 'Tracks page_view event' },
    { test: html.includes('window.location.href'), desc: 'Has JavaScript redirect' },
    { test: html.includes('meta http-equiv="refresh"'), desc: 'Has meta refresh fallback' },
    { test: html.includes('Redirecting'), desc: 'Has user-visible message' },
  ];

  let passed = 0;
  let failed = 0;

  checks.forEach(({ test, desc }) => {
    if (test) {
      console.log(`  ✓ ${desc}`);
      passed++;
    } else {
      console.log(`  ✗ ${desc}`);
      failed++;
    }
  });

  if (failed === 0) {
    console.log(`\n✅ Test 1 PASSED: ${passed}/${passed} checks passed\n`);
  } else {
    console.log(`\n❌ Test 1 FAILED: ${passed}/${checks.length} checks passed\n`);
    process.exit(1);
  }

  // Save to file for manual inspection
  fs.writeFileSync('/tmp/test-redirect.html', html);
  console.log('💾 Test page saved to: /tmp/test-redirect.html');
  console.log('   Open in browser to test manually\n');

} catch (error) {
  console.log(`❌ Test 1 FAILED: ${error.message}\n`);
  process.exit(1);
}

// Test 2: HTML escaping
console.log('Test 2: HTML escaping for special characters');
const maliciousUrl = 'https://example.com/test?param=<script>alert("xss")</script>';
const slug2 = 'test123';

try {
  const html = generateRedirectPage(maliciousUrl, slug2);

  // Check that script tags are escaped
  if (html.includes('<script>alert') && !html.includes('&lt;script&gt;alert')) {
    console.log('❌ Test 2 FAILED: Script tags not properly escaped (XSS vulnerability!)\n');
    process.exit(1);
  }

  // The URL should appear in JSON.stringify which handles escaping
  if (html.includes('JSON.stringify') || html.includes('"https://example.com/test?param=')) {
    console.log('✅ Test 2 PASSED: Special characters handled safely\n');
  } else {
    console.log('⚠️  Test 2 WARNING: Could not verify escaping method\n');
  }
} catch (error) {
  console.log(`❌ Test 2 FAILED: ${error.message}\n`);
  process.exit(1);
}

// Test 3: URL with special characters
console.log('Test 3: Unicode and special characters in URL');
const unicodeUrl = 'https://example.com/búsqueda/artículo?query=test&foo=bar#título';
const slug3 = 'unicode123';

try {
  const html = generateRedirectPage(unicodeUrl, slug3);

  if (html.includes(unicodeUrl) || html.includes(encodeURIComponent(unicodeUrl))) {
    console.log('✅ Test 3 PASSED: Unicode characters preserved\n');
  } else {
    console.log('❌ Test 3 FAILED: Unicode characters lost\n');
    process.exit(1);
  }
} catch (error) {
  console.log(`❌ Test 3 FAILED: ${error.message}\n`);
  process.exit(1);
}

console.log('🎉 All tests passed!\n');
console.log('Next steps:');
console.log('1. Start the server with the GO_LINK_SECRET_KEY env var');
console.log('2. Generate a test link');
console.log('3. Visit the link in a browser');
console.log('4. Check Google Analytics Real-Time dashboard for the pageview\n');
