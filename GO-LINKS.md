# Go Links - Encrypted URL Redirector

A privacy-preserving URL shortener and tracker for sharing blog posts and external content through your own domain.

## Overview

The Go Links service allows you to create trackable short links like `https://dariomac.com/go/abc123...` that redirect to any URL. All redirects are tracked by your domain's analytics, and the destination URLs are encrypted to ensure integrity and avoid maintaining a database.

## Features

- ✅ **No Database Required** - URLs are encrypted in the slug itself
- ✅ **Tamper-Proof** - Uses AES-256-GCM authenticated encryption
- ✅ **Full Analytics Tracking** - Google Analytics 4 & PostHog track every click
- ✅ **Social Media Previews** - Automatically fetches and mirrors Open Graph tags
- ✅ **OG Tag Caching** - 24-hour cache for fast performance
- ✅ **URL Integrity** - Automatically detects if links have been tampered with
- ✅ **Fast Redirects** - Sub-second redirect with analytics firing (100-500ms)
- ✅ **Fallback Support** - Works even without JavaScript (meta refresh)
- ✅ **Simple CLI** - Easy-to-use command-line tool for generating links

## How It Works

1. **Encryption**: The destination URL is encrypted using AES-256-GCM
2. **Encoding**: The encrypted data (IV + ciphertext + auth tag) is base64url-encoded
3. **Slug Creation**: The encoded string becomes the slug in `/go/:slug`
4. **User Clicks**: When a user or bot clicks the link, they hit `/go/:slug` on your server
5. **Decryption**: The server decrypts and verifies the slug
6. **OG Tag Fetching**: Server fetches Open Graph tags from the destination (cached for 24h)
7. **Page Generation**: Server returns HTML with mirrored OG tags, GA, and PostHog
8. **Social Crawlers**: Social network bots see the correct preview (title, image, description)
9. **Analytics Fire**: GA and PostHog track the pageview event with destination metadata
10. **Redirect**: After ~100-500ms, JavaScript redirects to the destination URL
11. **Result**: You get full analytics + proper social media previews

## Setup

### 1. Generate an Encryption Key

```bash
node generate-go-link.mjs --generate-key
```

This will output something like:
```
🔑 Generated encryption key (add this to your .env file):

GO_LINK_SECRET_KEY=base64encodedkey...
```

### 2. Create .env File

Copy `.env.example` to `.env` and add your key:

```bash
cp .env.example .env
```

Edit `.env` and add the generated key:
```
GO_LINK_SECRET_KEY=your_generated_key_here
```

### 3. Load Environment Variables

Make sure your server loads the `.env` file. You can:

- Use `dotenv` package: Install and import in `server.mjs`
- Load manually: `source .env` before starting the server
- Use PM2 env config: Add to `ecosystem.config.cjs`

## Usage

### Generate a Go Link

```bash
node generate-go-link.mjs "https://example.com/blog/my-awesome-post"
```

Output:
```
✅ Encrypted link generated successfully!

Original URL: https://example.com/blog/my-awesome-post
Slug:         VGhpc0lzQW5FeGFtcGxl...
Full link:    https://dariomac.com/go/VGhpc0lzQW5FeGFtcGxl...

📋 Copy this link to share:

   https://dariomac.com/go/VGhpc0lzQW5FeGFtcGxl...
```

### Share the Link

Share the generated `https://dariomac.com/go/...` link on social media, emails, or anywhere you want to track clicks.

### View Analytics

All clicks on `/go/*` URLs will appear in your analytics dashboard as page views for the `/go/:slug` path.

## Security Considerations

### Encryption Details

- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Size**: 256 bits (32 bytes)
- **IV Size**: 128 bits (16 bytes, randomly generated per encryption)
- **Auth Tag**: 128 bits (16 bytes, for integrity verification)

### Why AES-GCM?

1. **Authenticated Encryption**: Provides both confidentiality and integrity
2. **Tamper Detection**: Automatically fails if data is modified
3. **No Database Needed**: URL is self-contained in the slug
4. **Industry Standard**: Widely trusted and audited

### Key Management

- **Keep Your Key Secret**: Never commit `.env` to git
- **Rotate Regularly**: Change keys periodically for best security
- **Backup**: Store your key securely; losing it means existing links break
- **Environment-Specific**: Use different keys for dev/staging/production

### Important Notes

- If you change the encryption key, all existing `/go/` links will stop working
- Links are tamper-proof but not secret (don't encrypt sensitive URLs)
- Consider the key your "master password" for the redirect service

## Troubleshooting

### "GO_LINK_SECRET_KEY environment variable is required"

Make sure:
1. You've created a `.env` file with the key
2. The server is loading environment variables
3. You're using the correct key format (base64)

### "Invalid or tampered slug"

This happens when:
1. The slug was manually edited/truncated
2. The encryption key changed
3. The URL was corrupted during sharing

### Links not working in production

Check that:
1. Environment variables are loaded in production (PM2 config)
2. The same encryption key is used in all environments
3. The `/go/:slug` route is not blocked by other middleware

### Social media not showing preview

If social networks aren't showing the correct preview:

1. **Wait for cache**: Social networks cache OG tags for hours/days. Clear the cache using their debugging tools.
2. **Check OG tags**: Visit your `/go/` link and view source. Make sure OG tags are present.
3. **Destination site issues**: If the destination site has no OG tags or is blocking bots, we can't fetch them.
4. **Timeout**: If the destination site is very slow (>5s), the fetch will timeout and use fallback tags.
5. **Force refresh**: Use the social network's validator/debugger to force a refresh of the preview.

### OG tags not appearing

Check server logs for:
- `[OG Fetch] Fetching tags for...` - Should appear on first request
- `[OG Cache] Hit for...` - Should appear on subsequent requests
- `[OG Fetch] Error fetching...` - Indicates a problem fetching the destination

Common causes:
- Destination site is blocking your server's IP or user agent
- Destination site requires authentication
- Destination site has no OG tags (will use fallback tags)
- Network issues or timeouts

## API Reference

### Encryption Module (`lib/encryptor.mjs`)

#### `encrypt(url)`
Encrypts a URL into a URL-safe slug.
- **Params**: `url` (string) - The URL to encrypt
- **Returns**: Base64url-encoded slug
- **Throws**: Error if URL is invalid

#### `decrypt(slug)`
Decrypts a slug back to the original URL.
- **Params**: `slug` (string) - The encrypted slug
- **Returns**: Original URL string
- **Throws**: Error if slug is invalid or tampered

#### `generateKey()`
Generates a new 256-bit encryption key.
- **Returns**: Base64-encoded key string

### Server Route (`server.mjs`)

```
GET /go/:slug
```

Decrypts the slug and serves an intermediate HTML page with analytics tracking.

- **Response**: HTML page with analytics + JavaScript redirect
- **Redirect Timing**: 100-500ms delay to allow analytics to fire
- **Fallback**: Meta refresh tag for browsers without JavaScript
- **Error Response**: 400 if slug is invalid/tampered

## User Experience

When someone clicks a `/go/` link:

1. **Fast Redirect**: Users see a brief "Redirecting..." page (0.1-0.5 seconds)
2. **Smooth Transition**: The page has a clean loading spinner
3. **Fallback Support**: Works even if JavaScript is disabled (via meta refresh)
4. **Mobile Friendly**: Responsive design works on all devices

The redirect is fast enough that users barely notice, but slow enough for analytics to fire reliably. Modern browsers with `sendBeacon` support redirect in ~100ms, while older browsers wait ~500ms.

### Customizing the Redirect Page

You can customize the redirect page styling, timing, or messages by editing `lib/redirect-template.mjs`:

- **Delay**: Change the `setTimeout` values (100ms or 500ms)
- **Styling**: Edit the CSS in the `<style>` block
- **Message**: Change the "Redirecting..." text
- **Branding**: Add your logo or brand colors

## Testing Social Media Previews

Before sharing your links on social networks, test that the Open Graph tags are working correctly:

### 1. Facebook/Meta Sharing Debugger
```
https://developers.facebook.com/tools/debug/
```
Enter your `/go/` link and click "Debug". You should see:
- The destination page's title, description, and image
- No errors or warnings

### 2. Twitter Card Validator
```
https://cards-dev.twitter.com/validator
```
Enter your `/go/` link to preview how it will look as a Twitter card.

### 3. LinkedIn Post Inspector
```
https://www.linkedin.com/post-inspector/
```
Test how your link will appear when shared on LinkedIn.

### 4. Manual Testing

You can also test locally by viewing the HTML source:

```bash
# Generate a test link
node generate-go-link.mjs "https://dev.to/some-article"

# Start the server
npm run dev

# Visit http://localhost:7007/go/[slug] in your browser
# View source (Cmd+U or Ctrl+U) to see the OG tags
```

Look for these tags in the `<head>`:
- `<meta property="og:title" content="...">`
- `<meta property="og:description" content="...">`
- `<meta property="og:image" content="...">`
- `<meta property="og:url" content="...">`

## Examples

### Sharing a Blog Post

```bash
# Generate link for external blog post
node generate-go-link.mjs "https://dev.to/author/awesome-post"

# Share on Twitter
# "Check out my latest post: https://dariomac.com/go/xyz123..."
```

### Tracking Campaign Links

```bash
# Create trackable links for different campaigns
node generate-go-link.mjs "https://partner.com/article?utm_source=dariomac&utm_campaign=week1"
node generate-go-link.mjs "https://partner.com/article?utm_source=dariomac&utm_campaign=week2"
```

### Adding to npm Scripts

You can add this to `package.json`:

```json
"scripts": {
  "go:generate": "node generate-go-link.mjs",
  "go:key": "node generate-go-link.mjs --generate-key"
}
```

Then use:
```bash
npm run go:key
npm run go:generate "https://example.com/post"
```

## License

Part of the dariomac.com static site project.
