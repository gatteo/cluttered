#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Get version info
VERSION=$(node -p "require('./package.json').version")
TAG="v$VERSION"
DMG_PATH="release/Cluttered-$VERSION-universal.dmg"

echo -e "${YELLOW}=======================================${NC}"
echo -e "${YELLOW}  Creating GitHub Release $TAG${NC}"
echo -e "${YELLOW}=======================================${NC}"

# Check if tag exists
if ! git rev-parse "$TAG" >/dev/null 2>&1; then
    echo -e "${RED}Error: Tag $TAG does not exist.${NC}"
    echo -e "Run 'pnpm version patch/minor/major' first to create the tag."
    exit 1
fi

# Check if DMG exists
if [ ! -f "$DMG_PATH" ]; then
    echo -e "${RED}Error: DMG not found at $DMG_PATH${NC}"
    echo -e "Run 'pnpm run package:dmg' first to build the DMG."
    exit 1
fi

# Check gh auth
if ! gh auth status >/dev/null 2>&1; then
    echo -e "${RED}Error: Not authenticated with GitHub CLI.${NC}"
    echo -e "Run 'gh auth login' first."
    exit 1
fi

# Get previous tag
PREV_TAG=$(git describe --tags --abbrev=0 "$TAG^" 2>/dev/null || echo "")

# Generate changelog
echo -e "\n${GREEN}[1/3] Generating changelog...${NC}"
if [ -n "$PREV_TAG" ]; then
    CHANGELOG=$(git log "${PREV_TAG}..${TAG}" --pretty=format:"- %s" --no-merges | grep -v "Generated with \[Claude Code\]" || true)
    COMPARE_URL="https://github.com/gatteo/cluttered/compare/${PREV_TAG}...${TAG}"
else
    CHANGELOG=$(git log "$TAG" --pretty=format:"- %s" --no-merges | head -20)
    COMPARE_URL=""
fi

# Build release notes
RELEASE_NOTES="## What's Changed

$CHANGELOG

## Downloads

- **Cluttered-${VERSION}-universal.dmg** - Signed and notarized for macOS (Intel + Apple Silicon)

## Installation

1. Download the DMG
2. Open and drag Cluttered to Applications
3. Launch from Applications folder"

if [ -n "$COMPARE_URL" ]; then
    RELEASE_NOTES="$RELEASE_NOTES

**Full Changelog**: $COMPARE_URL"
fi

# Show preview
echo -e "\n${YELLOW}Release Notes Preview:${NC}"
echo "----------------------------------------"
echo "$RELEASE_NOTES"
echo "----------------------------------------"

# Confirm
echo -e "\n${YELLOW}Ready to create release $TAG with DMG?${NC}"
read -p "Press Enter to continue or Ctrl+C to cancel..."

# Create release
echo -e "\n${GREEN}[2/3] Creating GitHub release...${NC}"
gh release create "$TAG" \
    --title "Cluttered $TAG" \
    --notes "$RELEASE_NOTES" \
    "$DMG_PATH"

# Get release URL
RELEASE_URL=$(gh release view "$TAG" --json url -q '.url')

echo -e "\n${GREEN}[3/3] Done!${NC}"
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  Release $TAG created successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\nRelease URL: ${YELLOW}$RELEASE_URL${NC}"
