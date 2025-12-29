# Releasing Cluttered

## Quick Release (One Command)

```bash
# Patch release (1.0.0 → 1.0.1) - bug fixes
npm run publish:patch

# Minor release (1.0.0 → 1.1.0) - new features
npm run publish:minor

# Major release (1.0.0 → 2.0.0) - breaking changes
npm run publish:major
```

This single command will:
1. ✓ Bump version in package.json
2. ✓ Build signed + notarized DMG
3. ✓ Build Mac App Store pkg
4. ✓ Commit, tag, and push to GitHub
5. ✓ Create GitHub release with auto-generated changelog
6. → Prompt you to upload to App Store Connect

To skip the Mac App Store build:
```bash
./scripts/publish.sh patch --skip-mas
```

---

## Prerequisites (One-Time Setup)

### 1. Apple Developer Certificates

Install these certificates in Keychain:
- `3rd Party Mac Developer Application` (for Mac App Store)
- `3rd Party Mac Developer Installer` (for Mac App Store)
- `Developer ID Application` (for direct distribution)

Verify with:
```bash
security find-identity -v -p codesigning
```

### 2. Provisioning Profile

Download from Apple Developer Portal and place at:
```
build/embedded.provisionprofile
```

### 3. Notarization Credentials

Store in Keychain (one-time):
```bash
xcrun notarytool store-credentials "ClutteredNotarize" \
  --apple-id "YOUR_APPLE_ID" \
  --team-id "YOUR_TEAM_ID" \
  --password "APP_SPECIFIC_PASSWORD"
```

Get app-specific password at: https://appleid.apple.com

### 4. GitHub CLI

```bash
gh auth login
```

---

## Manual Release Steps

If you prefer to do it step by step:

### 1. Bump Version
```bash
npm version patch  # or minor/major
```

### 2. Build Artifacts
```bash
npm run package:dmg  # For GitHub/direct distribution
npm run package:mas  # For Mac App Store
```

### 3. Push to GitHub
```bash
git push origin main --tags
```

### 4. Create GitHub Release
```bash
npm run release
```

### 5. Upload to App Store
1. Open **Transporter** app
2. Drag `release/mas-universal/Cluttered-x.x.x-universal.pkg`
3. Click **Deliver**
4. Go to [App Store Connect](https://appstoreconnect.apple.com)
5. Submit for review

---

## Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run publish:patch` | Full release (patch version) |
| `npm run publish:minor` | Full release (minor version) |
| `npm run publish:major` | Full release (major version) |
| `npm run package:dmg` | Build signed + notarized DMG only |
| `npm run package:mas` | Build Mac App Store pkg only |
| `npm run release` | Create GitHub release (after building) |

---

## Troubleshooting

### "Not authenticated with GitHub CLI"
```bash
unset GITHUB_TOKEN && gh auth login
```

### "Notarization credentials not found"
```bash
xcrun notarytool store-credentials "ClutteredNotarize" \
  --apple-id "your@email.com" \
  --team-id "XXXXXXXXXX" \
  --password "xxxx-xxxx-xxxx-xxxx"
```

### "Code signing failed"
Check certificates are installed:
```bash
security find-identity -v -p codesigning
```

### Build fails with Python error
```bash
export npm_config_python=/opt/homebrew/opt/python@3.11/bin/python3.11
```
