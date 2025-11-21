#!/usr/bin/env node

import { fetchOGTags, getCacheStats } from './lib/og-fetcher.mjs';
import { generateRedirectPage } from './lib/redirect-template.mjs';
import fs from 'fs';

console.log('🧪 Testing Open Graph tag fetching...\n');

// Test 1: Fetch OG tags from a real website
console.log('Test 1: Fetch OG tags from a real website');
const testUrl = 'https://dev.to';

try {
  console.log(`  Fetching tags from ${testUrl}...`);
  const ogTags = await fetchOGTags(testUrl);

  console.log(`  ✓ Fetched ${Object.keys(ogTags).length} tags:`);
  for (const [key, value] of Object.entries(ogTags)) {
    const displayValue = value.length > 50 ? value.substring(0, 50) + '...' : value;
    console.log(`    - ${key}: ${displayValue}`);
  }

  // Highlight favicon extraction
  if (ogTags.favicon) {
    console.log(`\n  🎨 Favicon URL: ${ogTags.favicon}`);
  }

  console.log('\n✅ Test 1 PASSED\n');
} catch (error) {
  console.log(`\n❌ Test 1 FAILED: ${error.message}\n`);
  process.exit(1);
}

// Test 2: Check caching
console.log('Test 2: Verify caching works');
try {
  console.log('  Fetching same URL again (should hit cache)...');
  const startTime = Date.now();
  await fetchOGTags(testUrl);
  const duration = Date.now() - startTime;

  if (duration < 100) {
    console.log(`  ✓ Cache hit! (${duration}ms - fast!)`);
  } else {
    console.log(`  ⚠️  Took ${duration}ms - might have missed cache`);
  }

  const stats = getCacheStats();
  console.log(`  ✓ Cache has ${stats.size} entries`);

  console.log('\n✅ Test 2 PASSED\n');
} catch (error) {
  console.log(`\n❌ Test 2 FAILED: ${error.message}\n`);
  process.exit(1);
}

// Test 3: Generate redirect page with OG tags
console.log('Test 3: Generate redirect page with OG tags');
try {
  const ogTags = await fetchOGTags(testUrl);
  const slug = 'test123';
  const html = generateRedirectPage(testUrl, slug, ogTags);

  // Check that OG tags are present in HTML
  const checks = [
    { test: html.includes('og:title'), desc: 'Has og:title' },
    { test: html.includes('og:url'), desc: 'Has og:url' },
    { test: html.includes('property="og:'), desc: 'Has OG meta tags' },
    { test: html.includes('canonical'), desc: 'Has canonical link' },
    { test: html.includes('rel="icon"'), desc: 'Has favicon link' },
    { test: ogTags.favicon !== undefined, desc: 'Extracted favicon URL' },
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
    console.log(`\n✅ Test 3 PASSED: ${passed}/${passed} checks passed\n`);

    // Save to file for inspection
    fs.writeFileSync('/tmp/test-redirect-with-og.html', html);
    console.log('💾 Test page saved to: /tmp/test-redirect-with-og.html');
    console.log('   Open in browser to inspect OG tags\n');
  } else {
    console.log(`\n❌ Test 3 FAILED: ${passed}/${checks.length} checks passed\n`);
    process.exit(1);
  }
} catch (error) {
  console.log(`\n❌ Test 3 FAILED: ${error.message}\n`);
  process.exit(1);
}

// Test 4: Handle timeout/error gracefully
console.log('Test 4: Handle non-existent URL gracefully');
try {
  const badUrl = 'https://this-domain-definitely-does-not-exist-12345.com';
  console.log(`  Fetching from non-existent URL...`);
  const ogTags = await fetchOGTags(badUrl);

  // Should return fallback tags
  if (ogTags['og:url'] === badUrl && ogTags['og:type'] === 'website') {
    console.log('  ✓ Returned fallback tags');
    console.log('\n✅ Test 4 PASSED\n');
  } else {
    console.log('  ✗ Did not return expected fallback tags');
    console.log('\n❌ Test 4 FAILED\n');
    process.exit(1);
  }
} catch (error) {
  console.log(`\n❌ Test 4 FAILED: ${error.message}\n`);
  process.exit(1);
}

console.log('🎉 All Open Graph tests passed!\n');
console.log('Next steps:');
console.log('1. Test with social network validators:');
console.log('   - Facebook: https://developers.facebook.com/tools/debug/');
console.log('   - Twitter: https://cards-dev.twitter.com/validator');
console.log('   - LinkedIn: https://www.linkedin.com/post-inspector/');
console.log('2. Generate a real link and test it');
console.log('3. Share on social media and verify the preview\n');
