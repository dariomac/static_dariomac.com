
import { fetchOGTags } from './lib/og-fetcher.mjs';

const url = 'https://hugopalma.work/journal/me-claude-vs-jspdf-the-saga';

console.log(`Fetching OG tags from ${url}...`);

try {
  const ogTags = await fetchOGTags(url);
  console.log('Fetched tags:', ogTags);

  const image = ogTags['og:image'];
  if (image && !image.startsWith('http')) {
    console.log(`\n❌ FAIL: og:image is relative: ${image}`);
  } else if (image) {
    console.log(`\n✅ PASS: og:image is absolute: ${image}`);
  } else {
    console.log('\n⚠️  WARNING: No og:image found');
  }

} catch (error) {
  console.error('Error:', error);
}
