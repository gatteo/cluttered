#!/bin/bash
set -e

# Configuration
APP_NAME="Cluttered"
VERSION=$(node -p "require('./package.json').version")
RELEASE_DIR="release"
DMG_NAME="$APP_NAME-$VERSION-universal.dmg"
KEYCHAIN_PROFILE="ClutteredNotarize"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}=======================================${NC}"
echo -e "${YELLOW}  Building $APP_NAME v$VERSION DMG${NC}"
echo -e "${YELLOW}  (Signed + Notarized for distribution)${NC}"
echo -e "${YELLOW}=======================================${NC}"

# Step 1: Clean previous builds
echo -e "\n${GREEN}[1/6] Cleaning previous builds...${NC}"
rm -rf "$RELEASE_DIR/mac-universal" "$RELEASE_DIR/mac-arm64" "$RELEASE_DIR/mac-x64" 2>/dev/null || true
rm -f "$RELEASE_DIR"/*.dmg "$RELEASE_DIR"/*.zip 2>/dev/null || true

# Step 2: Build the app
echo -e "\n${GREEN}[2/6] Building app (vite + tsc)...${NC}"
npm run build

# Step 3: Package with electron-builder
echo -e "\n${GREEN}[3/6] Packaging universal app with electron-builder...${NC}"
export npm_config_python=/opt/homebrew/opt/python@3.11/bin/python3.11
npx electron-builder --mac --universal --config.mac.target=dir

# Find the app
APP_PATH="$RELEASE_DIR/mac-universal/$APP_NAME.app"
if [ ! -d "$APP_PATH" ]; then
    APP_PATH="$RELEASE_DIR/mac-arm64/$APP_NAME.app"
fi
if [ ! -d "$APP_PATH" ]; then
    echo -e "${RED}Error: App was not created${NC}"
    exit 1
fi

echo -e "${GREEN}    App created: $APP_PATH${NC}"

# Step 4: Verify signature
echo -e "\n${GREEN}[4/6] Verifying code signature...${NC}"
codesign -dvv "$APP_PATH" 2>&1 | grep "Authority=" | head -1

# Step 5: Notarize
echo -e "\n${GREEN}[5/6] Notarizing app (this may take a few minutes)...${NC}"

# Create a zip for notarization
ZIP_PATH="/tmp/$APP_NAME-notarize.zip"
ditto -c -k --keepParent "$APP_PATH" "$ZIP_PATH"

# Submit for notarization
echo -e "    Submitting to Apple..."
xcrun notarytool submit "$ZIP_PATH" \
    --keychain-profile "$KEYCHAIN_PROFILE" \
    --wait

# Staple the ticket
echo -e "    Stapling notarization ticket..."
xcrun stapler staple "$APP_PATH"

# Clean up temp zip
rm -f "$ZIP_PATH"

# Step 6: Create DMG
echo -e "\n${GREEN}[6/6] Creating DMG...${NC}"
npx electron-builder --mac dmg --prepackaged "$APP_PATH"

# Rename to universal
if [ -f "$RELEASE_DIR/$APP_NAME-$VERSION-arm64.dmg" ]; then
    mv "$RELEASE_DIR/$APP_NAME-$VERSION-arm64.dmg" "$RELEASE_DIR/$DMG_NAME"
fi

# Get file size
SIZE=$(du -h "$RELEASE_DIR/$DMG_NAME" | cut -f1)

# Done
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  Build complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\nDMG: ${YELLOW}$RELEASE_DIR/$DMG_NAME${NC} ($SIZE)"
echo -e "\nThis DMG is:"
echo -e "  - Signed with Developer ID"
echo -e "  - Notarized by Apple"
echo -e "  - Universal (Intel + Apple Silicon)"
echo -e "\nYou can share this directly - no Gatekeeper warnings!"
