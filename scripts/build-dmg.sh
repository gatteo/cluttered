#!/bin/bash
set -e

# Configuration
APP_NAME="Cluttered"
VERSION=$(node -p "require('./package.json').version")
RELEASE_DIR="release"
KEYCHAIN_PROFILE="ClutteredNotarize"

# Architectures to build
ARCHS=("arm64" "x64" "universal")

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}=======================================${NC}"
echo -e "${YELLOW}  Building $APP_NAME v$VERSION DMGs${NC}"
echo -e "${YELLOW}  (Signed + Notarized for distribution)${NC}"
echo -e "${YELLOW}  Architectures: ${ARCHS[*]}${NC}"
echo -e "${YELLOW}=======================================${NC}"

# Step 1: Clean previous builds
echo -e "\n${GREEN}[1/5] Cleaning previous builds...${NC}"
rm -rf "$RELEASE_DIR/mac-universal" "$RELEASE_DIR/mac-arm64" "$RELEASE_DIR/mac" 2>/dev/null || true
rm -f "$RELEASE_DIR"/*.dmg "$RELEASE_DIR"/*.zip 2>/dev/null || true

# Step 2: Build the app
echo -e "\n${GREEN}[2/5] Building app (vite + tsc)...${NC}"
pnpm run build

# Set Python for native modules
export npm_config_python=/opt/homebrew/opt/python@3.11/bin/python3.11

# Step 3: Package all architectures
echo -e "\n${GREEN}[3/5] Packaging apps for all architectures...${NC}"

for ARCH in "${ARCHS[@]}"; do
    echo -e "\n${YELLOW}  Building $ARCH...${NC}"

    if [ "$ARCH" == "universal" ]; then
        npx electron-builder --mac --universal --config.mac.target=dir
        APP_DIR="mac-universal"
    elif [ "$ARCH" == "x64" ]; then
        npx electron-builder --mac --x64 --config.mac.target=dir
        APP_DIR="mac"  # electron-builder outputs x64 to 'mac', not 'mac-x64'
    else
        npx electron-builder --mac --$ARCH --config.mac.target=dir
        APP_DIR="mac-$ARCH"
    fi

    APP_PATH="$RELEASE_DIR/$APP_DIR/$APP_NAME.app"

    if [ ! -d "$APP_PATH" ]; then
        echo -e "${RED}Error: App was not created for $ARCH${NC}"
        exit 1
    fi

    echo -e "${GREEN}    ✓ $ARCH app created${NC}"
done

# Step 4: Notarize all apps
echo -e "\n${GREEN}[4/5] Notarizing apps (this may take several minutes)...${NC}"

for ARCH in "${ARCHS[@]}"; do
    if [ "$ARCH" == "universal" ]; then
        APP_DIR="mac-universal"
    elif [ "$ARCH" == "x64" ]; then
        APP_DIR="mac"
    else
        APP_DIR="mac-$ARCH"
    fi

    APP_PATH="$RELEASE_DIR/$APP_DIR/$APP_NAME.app"

    echo -e "\n${YELLOW}  Notarizing $ARCH...${NC}"

    # Verify signature
    echo -e "    Verifying code signature..."
    codesign -dvv "$APP_PATH" 2>&1 | grep "Authority=" | head -1

    # Create a zip for notarization
    ZIP_PATH="/tmp/$APP_NAME-$ARCH-notarize.zip"
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

    echo -e "${GREEN}    ✓ $ARCH notarized${NC}"
done

# Step 5: Create DMGs
echo -e "\n${GREEN}[5/5] Creating DMGs...${NC}"

for ARCH in "${ARCHS[@]}"; do
    if [ "$ARCH" == "universal" ]; then
        APP_DIR="mac-universal"
    elif [ "$ARCH" == "x64" ]; then
        APP_DIR="mac"
    else
        APP_DIR="mac-$ARCH"
    fi

    APP_PATH="$RELEASE_DIR/$APP_DIR/$APP_NAME.app"
    DMG_NAME="$APP_NAME-$VERSION-$ARCH.dmg"

    echo -e "\n${YELLOW}  Creating $ARCH DMG...${NC}"

    # Create DMG with specific name
    npx electron-builder --mac dmg --prepackaged "$APP_PATH" --config.artifactName="$DMG_NAME"

    # electron-builder may output with detected arch name, rename if needed
    if [ ! -f "$RELEASE_DIR/$DMG_NAME" ]; then
        # Find the most recent DMG and rename it
        LATEST_DMG=$(ls -t "$RELEASE_DIR"/*.dmg 2>/dev/null | head -1)
        if [ -n "$LATEST_DMG" ] && [ "$LATEST_DMG" != "$RELEASE_DIR/$DMG_NAME" ]; then
            mv "$LATEST_DMG" "$RELEASE_DIR/$DMG_NAME"
        fi
    fi

    if [ -f "$RELEASE_DIR/$DMG_NAME" ]; then
        SIZE=$(du -h "$RELEASE_DIR/$DMG_NAME" | cut -f1)
        echo -e "${GREEN}    ✓ $DMG_NAME ($SIZE)${NC}"
    fi
done

# Summary
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  Build complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\nDMGs created:"

TOTAL_SIZE=0
for ARCH in "${ARCHS[@]}"; do
    DMG_PATH="$RELEASE_DIR/$APP_NAME-$VERSION-$ARCH.dmg"
    if [ -f "$DMG_PATH" ]; then
        SIZE=$(du -h "$DMG_PATH" | cut -f1)
        echo -e "  ${YELLOW}$APP_NAME-$VERSION-$ARCH.dmg${NC} ($SIZE)"
    fi
done

echo -e "\nAll DMGs are:"
echo -e "  - Signed with Developer ID"
echo -e "  - Notarized by Apple"
echo -e "  - Ready for distribution"
echo -e "\n  arm64    = Apple Silicon (M1/M2/M3)"
echo -e "  x64      = Intel Macs"
echo -e "  universal = Both architectures (larger file)"
