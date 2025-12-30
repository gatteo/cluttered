#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Usage
usage() {
    echo -e "${YELLOW}Usage:${NC} $0 <patch|minor|major> [--skip-mas]"
    echo ""
    echo "  patch   - Bump patch version (1.0.0 → 1.0.1)"
    echo "  minor   - Bump minor version (1.0.0 → 1.1.0)"
    echo "  major   - Bump major version (1.0.0 → 2.0.0)"
    echo ""
    echo "Options:"
    echo "  --skip-mas  - Skip Mac App Store build"
    echo ""
    echo "Example:"
    echo "  $0 patch"
    echo "  $0 minor --skip-mas"
    exit 1
}

# Parse arguments
VERSION_TYPE=""
SKIP_MAS=false

for arg in "$@"; do
    case $arg in
        patch|minor|major)
            VERSION_TYPE=$arg
            ;;
        --skip-mas)
            SKIP_MAS=true
            ;;
        -h|--help)
            usage
            ;;
        *)
            echo -e "${RED}Unknown argument: $arg${NC}"
            usage
            ;;
    esac
done

if [ -z "$VERSION_TYPE" ]; then
    usage
fi

# Pre-flight checks
echo -e "${YELLOW}=======================================${NC}"
echo -e "${YELLOW}  Cluttered Release Script${NC}"
echo -e "${YELLOW}=======================================${NC}"

echo -e "\n${BLUE}[Pre-flight checks]${NC}"

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${RED}✗ Uncommitted changes detected. Please commit or stash them first.${NC}"
    git status --short
    exit 1
fi
echo -e "${GREEN}✓ Working directory clean${NC}"

# Check gh auth
if ! gh auth status >/dev/null 2>&1; then
    echo -e "${RED}✗ Not authenticated with GitHub CLI.${NC}"
    echo -e "  Run: ${YELLOW}unset GITHUB_TOKEN && gh auth login${NC}"
    exit 1
fi
echo -e "${GREEN}✓ GitHub CLI authenticated${NC}"

# Check notarization credentials
if ! xcrun notarytool history --keychain-profile "ClutteredNotarize" >/dev/null 2>&1; then
    echo -e "${RED}✗ Notarization credentials not found in keychain.${NC}"
    echo -e "  Run: ${YELLOW}xcrun notarytool store-credentials \"ClutteredNotarize\" ...${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Notarization credentials found${NC}"

# Get current and new version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "\n${BLUE}Current version:${NC} $CURRENT_VERSION"
echo -e "${BLUE}Version bump:${NC} $VERSION_TYPE"

# Confirm
echo -e "\n${YELLOW}This will:${NC}"
echo "  1. Bump version ($VERSION_TYPE)"
echo "  2. Build signed + notarized DMG"
if [ "$SKIP_MAS" = false ]; then
    echo "  3. Build Mac App Store pkg"
fi
echo "  4. Push to GitHub with tag"
echo "  5. Create GitHub release with changelog"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Aborted.${NC}"
    exit 1
fi

# Step 1: Bump version
echo -e "\n${GREEN}[1/5] Bumping version...${NC}"
pnpm version $VERSION_TYPE --no-git-tag-version
NEW_VERSION=$(node -p "require('./package.json').version")
NEW_TAG="v$NEW_VERSION"
echo -e "  New version: ${YELLOW}$NEW_VERSION${NC}"

# Step 2: Build DMG
echo -e "\n${GREEN}[2/5] Building signed + notarized DMG...${NC}"
./scripts/build-dmg.sh

DMG_PATH="release/Cluttered-$NEW_VERSION-universal.dmg"
if [ ! -f "$DMG_PATH" ]; then
    echo -e "${RED}Error: DMG not found at $DMG_PATH${NC}"
    exit 1
fi

# Step 3: Build MAS (optional)
if [ "$SKIP_MAS" = false ]; then
    echo -e "\n${GREEN}[3/5] Building Mac App Store pkg...${NC}"
    ./scripts/build-mas.sh
    MAS_PKG="release/mas-universal/Cluttered-$NEW_VERSION-universal.pkg"
else
    echo -e "\n${GREEN}[3/5] Skipping Mac App Store build${NC}"
fi

# Step 4: Commit, tag, and push
echo -e "\n${GREEN}[4/5] Committing and pushing to GitHub...${NC}"

# Generate changelog for commit
PREV_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
CHANGELOG=""
if [ -n "$PREV_TAG" ]; then
    # Try direct ancestry first
    CHANGELOG=$(git log "${PREV_TAG}..HEAD" --pretty=format:"- %s" --no-merges 2>/dev/null | grep -v "chore: release" | head -20 || true)

    # If empty (possibly due to history rewrite), use merge-base
    if [ -z "$CHANGELOG" ]; then
        MERGE_BASE=$(git merge-base "$PREV_TAG" HEAD 2>/dev/null || echo "")
        if [ -n "$MERGE_BASE" ]; then
            CHANGELOG=$(git log "${MERGE_BASE}..HEAD" --pretty=format:"- %s" --no-merges 2>/dev/null | grep -v "chore: release" | head -20 || true)
        fi
    fi
fi

# Fallback if still empty
if [ -z "$CHANGELOG" ]; then
    CHANGELOG="- Initial release"
fi

git add -A
git commit -m "chore: release v$NEW_VERSION

$CHANGELOG"

git tag -a "$NEW_TAG" -m "Release $NEW_TAG"
git push origin main --tags

# Step 5: Create GitHub release
echo -e "\n${GREEN}[5/5] Creating GitHub release...${NC}"

RELEASE_NOTES="## What's Changed

$CHANGELOG

## Downloads

| File | Description |
|------|-------------|
| **Cluttered-${NEW_VERSION}-universal.dmg** | Signed + notarized for macOS (Intel + Apple Silicon) |

## Installation

1. Download the DMG
2. Open and drag Cluttered to Applications
3. Launch from Applications folder"

if [ -n "$PREV_TAG" ]; then
    RELEASE_NOTES="$RELEASE_NOTES

**Full Changelog**: https://github.com/gatteo/cluttered/compare/${PREV_TAG}...${NEW_TAG}"
fi

gh release create "$NEW_TAG" \
    --title "Cluttered $NEW_TAG" \
    --notes "$RELEASE_NOTES" \
    "$DMG_PATH"

RELEASE_URL=$(gh release view "$NEW_TAG" --json url -q '.url')

# Done
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  Release $NEW_TAG complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\n${YELLOW}GitHub Release:${NC} $RELEASE_URL"
echo -e "${YELLOW}DMG:${NC} $DMG_PATH"

if [ "$SKIP_MAS" = false ] && [ -f "$MAS_PKG" ]; then
    echo -e "\n${YELLOW}Mac App Store:${NC}"
    echo -e "  1. Open Transporter"
    echo -e "  2. Upload: $MAS_PKG"
    echo -e "  3. Submit in App Store Connect"
fi

echo -e "\n${GREEN}Done!${NC}"
