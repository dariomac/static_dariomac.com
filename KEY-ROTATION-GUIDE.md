# Key Rotation Guide for Go Links

## Overview

The Go Links service now supports **multi-key encryption** for zero-downtime key rotation. This allows you to rotate encryption keys without breaking existing shared links.

## The Problem

Without multi-key support:
- ❌ Rotating the encryption key breaks ALL existing links
- ❌ Users who clicked old links get errors
- ❌ Social media shares become broken links
- ❌ Can't revoke compromised keys without breaking everything

## The Solution

With multi-key support:
- ✅ Keep multiple keys active simultaneously
- ✅ Old links work with old keys
- ✅ New links use the newest key
- ✅ Revoke compromised keys without affecting others
- ✅ Zero downtime during rotation

## How It Works

### Configuration Format

```bash
# Single key (original behavior)
GO_LINK_SECRET_KEY=your_key_here

# Multiple keys (comma-separated, newest first)
GO_LINK_SECRET_KEY=key_new,key_old,key_older
```

### Encryption & Decryption Rules

| Operation | Behavior |
|-----------|----------|
| **Encrypt** | Always uses the **first key** (newest) |
| **Decrypt** | Tries each key in order until one succeeds |
| **Logging** | Logs when old keys are used for monitoring |

## Step-by-Step Rotation Guide

### Scenario 1: Regular Annual Rotation

**Current State:**
```bash
GO_LINK_SECRET_KEY=key_2024
```

**Step 1: Generate new key**
```bash
node generate-go-link.mjs --generate-key
# Output: e8kx...= (this is key_2025)
```

**Step 2: Add new key at the beginning, keep old**
```bash
GO_LINK_SECRET_KEY=e8kx...=,key_2024
```

**Step 3: Deploy and restart**
```bash
npm run deploy
# or restart PM2, etc.
```

**Results:**
- ✅ New links use `key_2025`
- ✅ Old links with `key_2024` still work
- ✅ Zero downtime

**Step 4: After 6-12 months, remove old key**
```bash
GO_LINK_SECRET_KEY=e8kx...=
```

### Scenario 2: Emergency Key Revocation

**Current State:**
```bash
GO_LINK_SECRET_KEY=key_new,key_old,key_compromised
```

**Problem:** `key_compromised` was leaked!

**Step 1: Remove compromised key immediately**
```bash
GO_LINK_SECRET_KEY=key_new,key_old
```

**Step 2: Deploy ASAP**
```bash
npm run deploy
```

**Results:**
- ✅ Links with `key_compromised` stop working immediately
- ✅ Links with `key_new` and `key_old` continue working
- ✅ Security breach contained

### Scenario 3: Gradual Phase-Out (Recommended)

**Year 1:**
```bash
GO_LINK_SECRET_KEY=key_2024
```

**Year 2: Add new, keep old**
```bash
GO_LINK_SECRET_KEY=key_2025,key_2024
```

**Year 3: Add new, keep 2 old**
```bash
GO_LINK_SECRET_KEY=key_2026,key_2025,key_2024
```

**Year 4: Remove oldest**
```bash
GO_LINK_SECRET_KEY=key_2027,key_2026,key_2025
```

This ensures links stay valid for 2-3 years.

## Monitoring Key Usage

### Server Logs

The server logs when old keys are used:

```
[Encryptor] Decrypted with key #2 (older key)
[Encryptor] Decrypted with key #3 (older key)
```

**What this means:**
- Key #1 = Current key (no log)
- Key #2 = First old key
- Key #3 = Second old key, etc.

### Interpretation

If you see many `key #2` logs:
- ✅ Old links are still actively used
- ⚠️ Don't remove that key yet
- 💡 Consider re-sharing those links

If you see few/no old key logs:
- ✅ Safe to remove old keys
- ✅ Most users are using new links

## Key Information Utility

Check loaded keys programmatically:

```javascript
import { getKeyInfo } from './lib/encryptor.mjs';

const info = getKeyInfo();
console.log(info);
// {
//   count: 3,
//   hasMultipleKeys: true,
//   activeKeyPreview: "e8kx...=",
//   oldKeyCount: 2
// }
```

## Best Practices

### 1. Keep 2-3 Keys Maximum
```bash
# Good: Current + 1-2 old keys
GO_LINK_SECRET_KEY=key_2025,key_2024

# Acceptable: Current + 2 old keys
GO_LINK_SECRET_KEY=key_2026,key_2025,key_2024

# Too many: Hard to manage
GO_LINK_SECRET_KEY=key_2027,key_2026,key_2025,key_2024,key_2023
```

### 2. Rotate Annually
- Set a calendar reminder
- Generate new key each January
- Add to the beginning, keep old

### 3. Phase Out Gradually
- Keep old keys for 6-12 months minimum
- Monitor logs before removing
- Remove oldest key when adding new one

### 4. Document Your Rotations

Create a log file:
```bash
# key-rotation-log.txt
2024-01-15: Initial key (key_2024)
2025-01-15: Rotated to key_2025, kept key_2024
2025-07-15: Removed key_2024 (6 months old, low usage)
2026-01-15: Rotated to key_2026, kept key_2025
```

### 5. Environment-Specific Keys

Use different keys per environment:

```bash
# .env.development
GO_LINK_SECRET_KEY=dev_key_2025,dev_key_2024

# .env.production (via PM2 or hosting platform)
GO_LINK_SECRET_KEY=prod_key_2025,prod_key_2024
```

### 6. Emergency Revocation Process

If a key is compromised:
1. ⚠️ Remove it immediately from all environments
2. 📝 Document which key was revoked and when
3. 📊 Monitor error logs for affected links
4. 📢 Optionally: Notify users to use new links
5. 🔄 Consider rotating remaining keys as precaution

## Security Considerations

### What Multi-Key Provides

✅ **Backward compatibility:** Old links work during rotation
✅ **Forward security:** New links use newest key
✅ **Selective revocation:** Remove specific compromised keys
✅ **Zero downtime:** No service interruption

### What Multi-Key Does NOT Provide

❌ **Link secrecy:** URLs are encrypted but not hidden
❌ **Access control:** Anyone with the link can use it
❌ **Audit trail:** No built-in logging of who clicked when
❌ **Automatic re-encryption:** Old links stay encrypted with old keys

### Important Notes

1. **Keys are not passwords:** They're for integrity, not secrecy
2. **Don't use for private URLs:** Anyone with link can access destination
3. **Compromised key impact:** Only links created with that specific key break
4. **Performance:** Minimal impact (tries keys sequentially, usually first succeeds)

## Testing Key Rotation

Run the test suite:

```bash
node test-key-rotation.mjs
```

Tests cover:
1. ✅ Single key encryption/decryption
2. ✅ Key rotation without breaking old links
3. ✅ New links use newest key
4. ✅ Multiple keys work simultaneously
5. ✅ Key revocation works correctly
6. ✅ Key info utility
7. ✅ Error handling

## Troubleshooting

### "Invalid or tampered slug - decryption failed with all available keys"

**Cause:** None of your active keys can decrypt the link

**Solutions:**
1. Check if you removed the key that encrypted this link
2. Add the old key back temporarily if needed
3. Verify the link wasn't truncated or modified
4. Check server logs for which keys were tried

### High CPU usage with many keys

**Cause:** Decryption tries each key sequentially

**Solution:**
- Keep only 2-3 keys maximum
- Remove unused old keys
- Most requests succeed on first try (current key)

### Lost old key, need to restore old links

**Problem:** You removed a key but users still need those links

**Solution:**
1. Find the old key in backups
2. Add it back to the end: `GO_LINK_SECRET_KEY=current,old_restored`
3. Don't use it for new links (it's not first)
4. Phase out gradually later

## FAQ

**Q: How many keys can I have?**
A: Technically unlimited, but 2-3 is recommended for performance and manageability.

**Q: Does decryption get slower with more keys?**
A: Slightly, but negligible. Tries keys in order, usually succeeds on first attempt.

**Q: Can I reorder keys?**
A: Yes, but new links will use the first key. Keep newest first.

**Q: What if I lose all keys?**
A: All encrypted links become unusable. **Backup your keys securely!**

**Q: Can I rotate keys without downtime?**
A: Yes! That's the whole point of multi-key support.

**Q: Should I rotate keys even if not compromised?**
A: Yes, annual rotation is a security best practice.

**Q: Can I use different keys for different link batches?**
A: No, all links use the current (first) key. But old links with old keys still work.

## Migration from Single-Key

If you're currently using a single key:

**Before:**
```bash
GO_LINK_SECRET_KEY=old_key
```

**After (with rotation):**
```bash
# Generate new key
node generate-go-link.mjs --generate-key

# Add new key, keep old
GO_LINK_SECRET_KEY=new_key,old_key
```

**That's it!** All existing links continue working.

---

**Ready to rotate?** Start with `node generate-go-link.mjs --generate-key` and update your `.env` file!
