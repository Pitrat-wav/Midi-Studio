#!/bin/bash

# Get the root directory of the project
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Load environment variables from .env file if it exists in the root
if [ -f "$ROOT_DIR/.env" ]; then
    set -a
    # shellcheck source=/dev/null
    source "$ROOT_DIR/.env"
    set +a
fi

# Check if required variables are set
if [ -z "$DRIVE_PATH" ]; then
    echo "❌ Error: DRIVE_PATH is not set."
    echo "Please create a .env file in the root directory and set the DRIVE_PATH variable."
    echo "You can use .env.example as a template."
    exit 1
fi

# Move to root directory to ensure relative paths work correctly
cd "$ROOT_DIR" || exit 1

DATE=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$DATE] Starting sync to Google Drive..."

# Create directory if it doesn't exist
if [ ! -d "$DRIVE_PATH" ]; then
    echo "Creating directory: $DRIVE_PATH"
    mkdir -p "$DRIVE_PATH"
fi

# Copy main documentation files
cp README.md "$DRIVE_PATH/"
cp CHANGELOG.md "$DRIVE_PATH/"
cp PROJECT_CONTEXT.md "$DRIVE_PATH/"

# Copy agent skills and workflows
# Using rsync for better directory handling if available, otherwise cp -r
if command -v rsync &> /dev/null; then
    rsync -av --delete .agent "$DRIVE_PATH/"
else
    cp -r .agent "$DRIVE_PATH/"
fi

# Copy Brain Artifacts (Plans, Walkthroughs)
if [ -n "$BRAIN_PATH" ] && [ -d "$BRAIN_PATH" ]; then
    ARTIFACTS_DEST="$DRIVE_PATH/Project Artifacts"
    echo "Syncing artifacts from Brain..."
    mkdir -p "$ARTIFACTS_DEST"
    # Copy markdown files
    cp "$BRAIN_PATH"/*.md "$ARTIFACTS_DEST/" 2>/dev/null || true
    # Copy images if they exist
    cp "$BRAIN_PATH"/*.png "$ARTIFACTS_DEST/" 2>/dev/null || true
else
    if [ -n "$BRAIN_PATH" ]; then
        echo "⚠️ Warning: BRAIN_PATH is set but directory does not exist: $BRAIN_PATH"
    else
        echo "ℹ️ Info: BRAIN_PATH not set, skipping Brain Artifacts sync."
    fi
fi

echo "✅ Sync complete!"
echo "📍 Location: $DRIVE_PATH"
