#!/bin/bash

# Set custom icon for Dev-Launcher.app
# Usage: ./set-icon.sh /path/to/icon-image.png

if [ -z "$1" ]; then
    echo "Usage: ./set-icon.sh /path/to/icon-image.png"
    echo ""
    echo "Or drag your icon image here and press Enter:"
    read ICON_PATH
else
    ICON_PATH="$1"
fi

# Remove quotes if dragged
ICON_PATH="${ICON_PATH//\'/}"
ICON_PATH="${ICON_PATH// /\\ }"

APP_PATH=~/Desktop/Dev-Launcher.app

if [ ! -f "$ICON_PATH" ]; then
    echo "❌ Icon file not found: $ICON_PATH"
    exit 1
fi

if [ ! -d "$APP_PATH" ]; then
    echo "❌ App not found: $APP_PATH"
    exit 1
fi

echo "🎨 Setting icon for Dev-Launcher.app..."

# Method 1: Using sips and iconutil (best quality)
# Create temporary iconset
ICONSET="/tmp/DevLauncher.iconset"
mkdir -p "$ICONSET"

# Generate different sizes
sips -z 16 16     "$ICON_PATH" --out "${ICONSET}/icon_16x16.png" 2>/dev/null
sips -z 32 32     "$ICON_PATH" --out "${ICONSET}/icon_16x16@2x.png" 2>/dev/null
sips -z 32 32     "$ICON_PATH" --out "${ICONSET}/icon_32x32.png" 2>/dev/null
sips -z 64 64     "$ICON_PATH" --out "${ICONSET}/icon_32x32@2x.png" 2>/dev/null
sips -z 128 128   "$ICON_PATH" --out "${ICONSET}/icon_128x128.png" 2>/dev/null
sips -z 256 256   "$ICON_PATH" --out "${ICONSET}/icon_128x128@2x.png" 2>/dev/null
sips -z 256 256   "$ICON_PATH" --out "${ICONSET}/icon_256x256.png" 2>/dev/null
sips -z 512 512   "$ICON_PATH" --out "${ICONSET}/icon_256x256@2x.png" 2>/dev/null
sips -z 512 512   "$ICON_PATH" --out "${ICONSET}/icon_512x512.png" 2>/dev/null
sips -z 1024 1024 "$ICON_PATH" --out "${ICONSET}/icon_512x512@2x.png" 2>/dev/null

# Convert to icns
iconutil -c icns "$ICONSET" -o /tmp/DevLauncher.icns 2>/dev/null

# Copy to app
mkdir -p "$APP_PATH/Contents/Resources"
cp /tmp/DevLauncher.icns "$APP_PATH/Contents/Resources/applet.icns"

# Clean up
rm -rf "$ICONSET" /tmp/DevLauncher.icns

# Update Finder
touch "$APP_PATH"
killall Finder 2>/dev/null

echo "✅ Icon updated successfully!"
echo "📍 If you don't see the change immediately, log out and back in."
