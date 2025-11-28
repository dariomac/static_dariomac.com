/**
 * Open Graph tag fetcher and cache
 * Fetches OG tags from destination URLs and caches them
 */

// In-memory cache with TTL
const cache = new Map();
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours
const FETCH_TIMEOUT = 5000; // 5 seconds

/**
 * Fetch Open Graph tags from a URL
 * @param {string} url - The URL to fetch OG tags from
 * @returns {Promise<Object>} Object with OG tags
 */
export async function fetchOGTags(url) {
  // Check cache first
  const cached = cache.get(url);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    console.log(`[OG Cache] Hit for ${url}`);
    return cached.data;
  }

  console.log(`[OG Fetch] Fetching tags for ${url}`);

  try {
    // Fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DariomacBot/1.0; +https://dariomac.com)'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const ogTags = parseOGTags(html, url);

    // Cache the result
    cache.set(url, {
      timestamp: Date.now(),
      data: ogTags
    });

    console.log(`[OG Fetch] Found ${Object.keys(ogTags).length} tags`);

    return ogTags;
  } catch (error) {
    console.error(`[OG Fetch] Error fetching ${url}: ${error.message}`);

    // Return fallback tags
    const baseUrl = getBaseUrl(url);
    return {
      'og:url': url,
      'og:type': 'website',
      'favicon': `${baseUrl}/favicon.ico`
    };
  }
}

/**
 * Parse Open Graph tags from HTML
 * @param {string} html - HTML content
 * @param {string} baseUrl - Base URL for resolving relative paths
 * @returns {Object} Object with OG tags
 */
function parseOGTags(html, baseUrl) {
  const ogTags = {};

  // Match all meta tags with property="og:*" or name="og:*"
  // Also match Twitter cards and other social meta tags
  const metaRegex = /<meta\s+(?:[^>]*?\s+)?(?:property|name)=["']([^"']+)["'][^>]*?\s+content=["']([^"']*?)["'][^>]*?>/gi;
  const metaRegexAlt = /<meta\s+(?:[^>]*?\s+)?content=["']([^"']*?)["'][^>]*?\s+(?:property|name)=["']([^"']+)["'][^>]*?>/gi;

  let match;

  // Match property="..." content="..."
  while ((match = metaRegex.exec(html)) !== null) {
    const property = match[1];
    const content = match[2];

    if (property.startsWith('og:') || property.startsWith('twitter:') || property === 'description') {
      ogTags[property] = decodeHTMLEntities(content);
    }
  }

  // Match content="..." property="..." (reversed order)
  while ((match = metaRegexAlt.exec(html)) !== null) {
    const content = match[1];
    const property = match[2];

    if (property.startsWith('og:') || property.startsWith('twitter:') || property === 'description') {
      ogTags[property] = decodeHTMLEntities(content);
    }
  }

  // Also extract title if not present
  if (!ogTags['og:title']) {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      ogTags['og:title'] = decodeHTMLEntities(titleMatch[1]);
    }
  }

  // Also extract meta description if not present
  if (!ogTags['og:description'] && !ogTags['description']) {
    const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
    if (descMatch) {
      ogTags['og:description'] = decodeHTMLEntities(descMatch[1]);
    }
  }

  // Extract favicon
  ogTags['favicon'] = extractFavicon(html, baseUrl);

  return ogTags;
}

/**
 * Decode HTML entities in strings
 * @param {string} str - String with HTML entities
 * @returns {string} Decoded string
 */
function decodeHTMLEntities(str) {
  if (!str) return str;

  return str
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/**
 * Extract favicon URL from HTML
 * Looks for various favicon link tags and returns absolute URL
 * @param {string} html - HTML content
 * @param {string} baseUrl - Base URL for resolving relative paths
 * @returns {string} Absolute favicon URL
 */
function extractFavicon(html, baseUrl) {
  // Try to find various favicon formats in order of preference
  const faviconPatterns = [
    // <link rel="icon" type="image/png" href="/favicon.png">
    /<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["'][^>]*>/i,
    // <link href="/favicon.ico" rel="icon">
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:shortcut )?icon["'][^>]*>/i,
    // <link rel="icon" class="js-site-favicon" type="image/svg+xml" href="https://github.githubassets.com/favicons/favicon.svg" data-base-href="https://github.githubassets.com/favicons/favicon">
    /<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+type=["']image\/svg\+xml["'][^>]+href=["']([^"']+)["'][^>]*>/i,
    // Apple touch icon as fallback
    /<link[^>]+rel=["']apple-touch-icon["'][^>]+href=["']([^"']+)["'][^>]*>/i,
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']apple-touch-icon["'][^>]*>/i,
  ];

  for (const pattern of faviconPatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const faviconPath = match[1];
      return resolveUrl(faviconPath, baseUrl);
    }
  }

  // Fallback to /favicon.ico
  const base = getBaseUrl(baseUrl);
  return `${base}/favicon.ico`;
}

/**
 * Get base URL (protocol + domain) from a full URL
 * @param {string} url - Full URL
 * @returns {string} Base URL
 */
function getBaseUrl(url) {
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.hostname}${urlObj.port ? ':' + urlObj.port : ''}`;
  } catch {
    return url;
  }
}

/**
 * Resolve relative URL to absolute URL
 * @param {string} path - Relative or absolute path
 * @param {string} baseUrl - Base URL for resolution
 * @returns {string} Absolute URL
 */
function resolveUrl(path, baseUrl) {
  try {
    // If path is already absolute, return it
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }

    // If path starts with //, it's protocol-relative
    if (path.startsWith('//')) {
      const urlObj = new URL(baseUrl);
      return `${urlObj.protocol}${path}`;
    }

    // Resolve relative path
    return new URL(path, baseUrl).href;
  } catch {
    // If URL parsing fails, return path as-is
    return path;
  }
}

/**
 * Clear expired cache entries
 */
export function clearExpiredCache() {
  const now = Date.now();
  let cleared = 0;

  for (const [url, entry] of cache.entries()) {
    if ((now - entry.timestamp) >= CACHE_TTL) {
      cache.delete(url);
      cleared++;
    }
  }

  if (cleared > 0) {
    console.log(`[OG Cache] Cleared ${cleared} expired entries`);
  }

  return cleared;
}

/**
 * Get cache statistics
 * @returns {Object} Cache stats
 */
export function getCacheStats() {
  return {
    size: cache.size,
    entries: Array.from(cache.keys())
  };
}

// Clear expired cache every hour
setInterval(clearExpiredCache, 1000 * 60 * 60);
