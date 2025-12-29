#!/bin/bash
set -e

# Configuration
APP_NAME="Cluttered"
VERSION=$(node -p "require('./package.json').version")
RELEASE_DIR="release"
MAS_DIR="$RELEASE_DIR/mas-universal"
PKG_NAME="$APP_NAME-$VERSION-universal.pkg"

# Certificates (update these with your own)
APP_CERT="3rd Party Mac Developer Application: Matteo Giardino (X745HT6K4R)"
INSTALLER_CERT="3rd Party Mac Developer Installer: Matteo Giardino (X745HT6K4R)"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}=======================================${NC}"
echo -e "${YELLOW}  Building $APP_NAME v$VERSION for Mac App Store${NC}"
echo -e "${YELLOW}=======================================${NC}"

# Step 1: Clean previous builds
echo -e "\n${GREEN}[1/5] Cleaning previous builds...${NC}"
sudo rm -rf "$MAS_DIR" "$RELEASE_DIR/mas-universal-x64-temp" "$RELEASE_DIR/mas-universal-arm64-temp" 2>/dev/null || true

# Step 2: Build the app
echo -e "\n${GREEN}[2/5] Building app (vite + tsc)...${NC}"
pnpm run build

# Step 3: Package with electron-builder (app only)
echo -e "\n${GREEN}[3/5] Packaging universal app with electron-builder...${NC}"
echo -e "${YELLOW}    (pkg signing error is expected - we handle it manually)${NC}"

# Set Python for node-gyp (macOS with Python 3.12+ needs this)
export npm_config_python=/opt/homebrew/opt/python@3.11/bin/python3.11

# Run electron-builder - it will fail on pkg signing but app will be created
npx electron-builder --mac mas --universal 2>&1 || true

# Check if app was created
if [ ! -d "$MAS_DIR/$APP_NAME.app" ]; then
    echo -e "${RED}Error: App was not created. Check electron-builder output above.${NC}"
    exit 1
fi

echo -e "${GREEN}    App created successfully${NC}"

# Step 4: Verify app signature
echo -e "\n${GREEN}[4/5] Verifying app signature...${NC}"
APP_AUTHORITY=$(codesign -dvv "$MAS_DIR/$APP_NAME.app" 2>&1 | grep "Authority=" | head -1)
echo -e "    $APP_AUTHORITY"

if [[ "$APP_AUTHORITY" != *"3rd Party Mac Developer Application"* ]]; then
    echo -e "${RED}Error: App is not signed with correct certificate${NC}"
    exit 1
fi

# Verify it's universal
ARCHS=$(file "$MAS_DIR/$APP_NAME.app/Contents/MacOS/$APP_NAME" | grep -o "universal binary with 2 architectures" || true)
if [ -z "$ARCHS" ]; then
    echo -e "${RED}Error: App is not a universal binary${NC}"
    exit 1
fi
echo -e "    Universal binary: x86_64 + arm64"

# Step 5: Create and sign pkg manually with productbuild
echo -e "\n${GREEN}[5/5] Creating signed pkg with productbuild...${NC}"
productbuild \
    --component "$MAS_DIR/$APP_NAME.app" /Applications \
    --sign "$INSTALLER_CERT" \
    "$MAS_DIR/$PKG_NAME"

# Verify pkg signature
echo -e "\n${YELLOW}Verifying pkg signature...${NC}"
pkgutil --check-signature "$MAS_DIR/$PKG_NAME" | head -8

# Get file size
SIZE=$(du -h "$MAS_DIR/$PKG_NAME" | cut -f1)

# Done
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  Build complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\nPackage: ${YELLOW}$MAS_DIR/$PKG_NAME${NC} ($SIZE)"
echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "1. Open Transporter app"
echo -e "2. Drag and drop the .pkg file"
echo -e "3. Click Deliver"
echo -e "\nOr use command line:"
echo -e "xcrun altool --upload-app -f \"$MAS_DIR/$PKG_NAME\" -t macos -u YOUR_APPLE_ID -p APP_SPECIFIC_PASSWORD"