#!/bin/bash

# Path to Google Drive (Russian localization "Мой диск")
DRIVE_PATH="/Users/sahruh/Library/CloudStorage/GoogleDrive-rayandistorov@gmail.com/Мой диск/Telegram Midi Studio Docs"
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
BRAIN_PATH="/Users/sahruh/.gemini/antigravity/brain/68fb4235-e1f4-4431-b50a-a2b945109c8e"
ARTIFACTS_DEST="$DRIVE_PATH/Project Artifacts"

if [ -d "$BRAIN_PATH" ]; then
    echo "Syncing artifacts from Brain..."
    mkdir -p "$ARTIFACTS_DEST"
    cp "$BRAIN_PATH"/*.md "$ARTIFACTS_DEST/"
    # Copy images if they exist
    cp "$BRAIN_PATH"/*.png "$ARTIFACTS_DEST/" 2>/dev/null || true
fi

echo "✅ Sync complete!"
echo "📍 Location: $DRIVE_PATH"
