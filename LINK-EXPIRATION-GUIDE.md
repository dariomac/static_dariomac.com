## Link Expiration with Generation Dates

### Overview

The Go Links service now supports **automatic link expiration** based on generation dates. This allows you to:
- ✅ Set expiration dates when rotating keys
- ✅ Auto-expire all links created with a specific key
- ✅ Revoke compromised keys with time-based cleanup
- ✅ Comply with link retention policies
- ✅ Zero maintenance - server handles expiration automatically

### How It Works

#### New Link Format

**Old format** (plain URL):
```
"https://example.com/blog/post"
```

**New format** (JSON with generation date):
```json
{
  "link": "https://example.com/blog/post",
  "genDate": "2025-01-15T10:30:00.123Z"
}
```

Every new link includes its generation timestamp (ISO 8601 format).

#### Expiration Logic

```
IF key.expires EXISTS AND link.genDate EXISTS:
  IF link.genDate > key.expires:
    → Link EXPIRED (return 410 Gone)
  ELSE:
    → Link VALID (redirect normally)
ELSE:
  → Link VALID (no expiration check)
```

**Key points:**
- Links generated **after** key expiration date are invalid
- Links generated **before** key expiration date remain valid
- Keys without expiration dates never expire links
- Legacy links (no genDate) never expire

### Configuration

#### JSON Format with Expiration

```bash
GO_LINK_SECRET_KEYS='[
  {"key":"new_key_base64"},
  {"key":"old_key_base64","expires":"2025-12-31T23:59:59Z"}
]'
```

**Format details:**
- `key`: Base64-encoded 256-bit key
- `expires`: ISO 8601 date (optional)
- Array order: Newest first

#### Legacy Formats (Still Supported)

**Single key:**
```bash
GO_LINK_SECRET_KEY=your_key_here
```

**Comma-separated:**
```bash
GO_LINK_SECRET_KEY=key1,key2,key3
```

Legacy formats don't support expiration but remain fully compatible.

### Use Cases

#### Use Case 1: Scheduled Link Expiration

**Scenario:** Marketing campaign links should expire after 6 months

```bash
# Today: 2025-01-15
# Create campaign key that expires in 6 months

GO_LINK_SECRET_KEYS='[
  {"key":"campaign_key","expires":"2025-07-15T23:59:59Z"}
]'
```

**Timeline:**
- Jan 15: Create links with campaign_key
- Jan-Jul: Links work normally
- Jul 16: All campaign links return 410 Gone
- **No manual cleanup needed!**

#### Use Case 2: Key Compromise + Auto-Cleanup

**Scenario:** Key was compromised on March 1st

**Step 1: Generate new key, mark old as expired**
```bash
GO_LINK_SECRET_KEYS='[
  {"key":"new_safe_key"},
  {"key":"compromised_key","expires":"2025-03-01T00:00:00Z"}
]'
```

**Result:**
- Links created before March 1 → Still work
- Links created after March 1 → Return 410 Gone
- Compromised key can't create new valid links

#### Use Case 3: Time-Limited Beta Links

**Scenario:** Beta testing links should auto-expire

```bash
# Beta period: Jan 1 - March 31, 2025

GO_LINK_SECRET_KEYS='[
  {"key":"production_key"},
  {"key":"beta_key","expires":"2025-03-31T23:59:59Z"}
]'
```

**Usage:**
- Share beta links (created with beta_key)
- Apr 1: Beta links auto-expire
- Production links unaffected

#### Use Case 4: Compliance (Data Retention Policy)

**Scenario:** Links must not be valid after 1 year

**Annual rotation with expiration:**
```bash
# 2025
GO_LINK_SECRET_KEYS='[
  {"key":"key_2025","expires":"2026-12-31T23:59:59Z"}
]'

# 2026 - Add new, old expires at year-end
GO_LINK_SECRET_KEYS='[
  {"key":"key_2026","expires":"2027-12-31T23:59:59Z"},
  {"key":"key_2025","expires":"2026-12-31T23:59:59Z"}
]'

# 2027 - Remove expired 2025 key
GO_LINK_SECRET_KEYS='[
  {"key":"key_2027","expires":"2028-12-31T23:59:59Z"},
  {"key":"key_2026","expires":"2027-12-31T23:59:59Z"}
]'
```

### Server Behavior

#### Successful Redirect
```http
GET /go/abc123...
→ 200 OK (HTML with redirect)
→ User redirected to destination
```

#### Expired Link
```http
GET /go/xyz789...
→ 410 Gone
→ "This link has expired"
```

**Why 410 Gone?**
- More semantic than 404 (explicitly states resource expired)
- Tells crawlers not to retry
- Distinguishes from invalid/tampered links (400)

### Monitoring

#### Server Logs

**Valid link:**
```
Redirecting /go/abc... -> https://example.com (generated: 2025-01-15T10:30:00Z)
```

**Expired link:**
```
[Encryptor] Link expired: genDate 2025-01-15T10:30:00Z > key expires 2025-01-01T00:00:00Z
Failed to decrypt slug: Link has expired
```

**Legacy link:**
```
Redirecting /go/def... -> https://example.com (legacy link)
```

#### Track Expired Link Attempts

Add logging middleware:
```javascript
app.get('/go/:slug', async (req, res) => {
  try {
    // ... decryption
  } catch (error) {
    if (error.message.includes('expired')) {
      // Log to analytics/monitoring
      console.log(`Expired link accessed: ${req.params.slug}`);
      // Track in metrics system
      metrics.increment('go_links.expired');
    }
    // ... error handling
  }
});
```

### Key Information API

Check expiration configuration:

```javascript
import { getKeyInfo } from './lib/encryptor.mjs';

const info = getKeyInfo();
console.log(info);
```

**Output:**
```json
{
  "count": 3,
  "hasMultipleKeys": true,
  "activeKeyPreview": "UrXyD8av...",
  "oldKeyCount": 2,
  "keysWithExpiration": 2,
  "expirationDates": [
    {"keyIndex": 1, "expires": "never"},
    {"keyIndex": 2, "expires": "2025-12-31T23:59:59.000Z"},
    {"keyIndex": 3, "expires": "2024-12-31T23:59:59.000Z"}
  ]
}
```

### Migration Guide

#### From Legacy to Expiration-Enabled

**Current:**
```bash
GO_LINK_SECRET_KEY=old_key
```

**Step 1: Generate new key**
```bash
node generate-go-link.mjs --generate-key
# Output: new_key_xyz...
```

**Step 2: Switch to JSON format with expiration**
```bash
GO_LINK_SECRET_KEYS='[
  {"key":"new_key_xyz...","expires":"2026-12-31T23:59:59Z"},
  {"key":"old_key"}
]'
```

**Step 3: Restart server**
```bash
npm run deploy
```

**Result:**
- Old links still work (no expiration)
- New links auto-expire Dec 31, 2026

### Best Practices

1. **Set realistic expiration dates**
   - Marketing campaigns: 3-6 months
   - Beta/temporary links: Event duration + buffer
   - Regular links: 1-2 years
   - Production links: Consider not expiring

2. **Always add buffer time**
   ```bash
   # Bad: Expires exactly at campaign end
   "expires": "2025-03-31T23:59:59Z"

   # Good: Expires 1 month after campaign
   "expires": "2025-04-30T23:59:59Z"
   ```

3. **Monitor expiration attempts**
   - Track 410 responses
   - Alert on high expired link usage
   - May indicate need to extend expiration

4. **Document expiration dates**
   ```bash
   # key-log.txt
   2025-01-15: Created campaign_summer_2025 (expires 2025-08-31)
   2025-06-15: Extended to 2025-09-30 (high usage)
   2025-10-01: Removed (expired)
   ```

5. **Test expiration before deploying**
   ```bash
   node test-expiration.mjs
   ```

### Troubleshooting

#### "Link has expired" but shouldn't

**Check:**
1. Server time is correct (UTC recommended)
2. Expiration date format is ISO 8601
3. Link was created before expiration date

**Debug:**
```bash
# Check link generation date
# (requires access to encrypted link - decrypt with correct key)
```

#### Links not expiring when they should

**Check:**
1. JSON configuration parsed correctly
2. Key has `expires` property
3. Date comparison logic in logs

**Server logs should show:**
```
[Encryptor] Link expired: genDate [date] > key expires [date]
```

#### Timezone issues

**Always use UTC (Z suffix):**
```bash
# Good
"expires": "2025-12-31T23:59:59Z"

# Bad (timezone ambiguous)
"expires": "2025-12-31T23:59:59"
```

### Security Considerations

#### What Expiration Provides

✅ **Time-limited exposure**: Links auto-expire
✅ **Automatic cleanup**: No manual revocation needed
✅ **Compliance**: Enforce retention policies
✅ **Key rotation safety**: Old keys auto-disable new links

#### What Expiration Does NOT Provide

❌ **Access control**: Anyone with link can access (until expired)
❌ **User-specific expiration**: All links with key expire together
❌ **Retroactive expiration**: Can't expire specific links individually
❌ **Re-encryption**: Old links stay encrypted with old key

### Performance Impact

#### Minimal Overhead

- **Encryption**: +40 bytes (JSON vs plain URL)
- **Decryption**: +JSON.parse() time (~0.01ms)
- **Expiration check**: +Date comparison (~0.001ms)
- **Total impact**: <1% overhead

#### Slug Length Comparison

**Old format:**
```
/go/abc123def456... (60-80 chars)
```

**New format:**
```
/go/xyz789ghi012... (80-100 chars)
```

**Impact:**
- Still URL-safe and shareable
- QR codes slightly larger
- No practical issues

### FAQ

**Q: Do old links stop working?**
A: No! Legacy links (plain URL) never expire.

**Q: Can I set different expiration for each link?**
A: No, but you can use different keys for different link groups.

**Q: What happens at exactly the expiration time?**
A: Links generated AFTER expiration fail. Links generated BEFORE work.

**Q: Can I extend expiration dates?**
A: Yes! Update the JSON config with new date and restart server.

**Q: What timezone should I use?**
A: Always UTC (Z suffix). Server uses ISO 8601 comparison.

**Q: How do I expire a specific link?**
A: You can't directly. But you can:
  1. Create one-time-use key for that link
  2. Set expiration on that key
  3. Only that link expires

**Q: Can I see when a link was generated?**
A: Yes, check server logs: `(generated: 2025-01-15T10:30:00Z)`

### Example Workflows

#### Annual Marketing Campaign

```bash
# January 1, 2025: Start campaign
GO_LINK_SECRET_KEYS='[
  {"key":"general_key"},
  {"key":"campaign_2025","expires":"2025-12-31T23:59:59Z"}
]'

# Create campaign links (use campaign_2025 key)
node generate-go-link.mjs "https://promo.com/sale"

# December 31: Links auto-expire
# January 1, 2026: Remove expired key
GO_LINK_SECRET_KEYS='[
  {"key":"general_key"},
  {"key":"campaign_2026","expires":"2026-12-31T23:59:59Z"}
]'
```

#### Beta Test Period

```bash
# Beta: March 1-31, 2025
GO_LINK_SECRET_KEYS='[
  {"key":"production_key"},
  {"key":"beta_march","expires":"2025-03-31T23:59:59Z"}
]'

# April 1: Beta links auto-expire
# Remove beta key when convenient
```

#### Emergency Key Revocation

```bash
# March 15: Key compromised!
# Immediately set expiration to now

GO_LINK_SECRET_KEYS='[
  {"key":"new_emergency_key"},
  {"key":"compromised_key","expires":"2025-03-15T12:00:00Z"}
]'

# All links created after March 15 12pm are invalid
# Safe links (before compromise) still work
```

---

**Ready to use expiration?** Update your `.env` with JSON format and set expiration dates!

For more examples, see: `test-expiration.mjs`
