# Go Links - Encrypted URL Redirector

A privacy-preserving URL shortener and tracker for sharing blog posts and external content through your own domain.

## Overview

The Go Links service allows you to create trackable short links like `https://dariomac.com/go/abc123...` that redirect to any URL. All redirects are tracked by your domain's analytics, and the destination URLs are encrypted to ensure integrity and avoid maintaining a database.

## Features

- ✅ **No Database Required** - URLs are encrypted in the slug itself
- ✅ **Tamper-Proof** - Uses AES-256-GCM authenticated encryption
- ✅ **Analytics Tracking** - All `/go/*` hits are tracked by your analytics
- ✅ **URL Integrity** - Automatically detects if links have been tampered with
- ✅ **Simple CLI** - Easy-to-use command-line tool for generating links

## How It Works

1. **Encryption**: The destination URL is encrypted using AES-256-GCM
2. **Encoding**: The encrypted data (IV + ciphertext + auth tag) is base64url-encoded
3. **Slug Creation**: The encoded string becomes the slug in `/go/:slug`
4. **Decryption**: When accessed, the server decrypts and verifies the slug
5. **Redirect**: If valid, redirects (302) to the destination URL
6. **Tracking**: Your analytics capture the `/go/:slug` hit before redirect

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

Decrypts and redirects to the destination URL.

- **Response**: 302 redirect to destination
- **Error Response**: 400 if slug is invalid/tampered

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
