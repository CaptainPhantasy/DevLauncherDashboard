#!/bin/bash

# Create Desktop Icon for Dev Launcher
echo "🚀 Creating Dev Launcher Desktop Icon..."

# Get the absolute path to the dev-launcher directory
DEV_LAUNCHER_PATH="$(cd "$(dirname "$0")" && pwd)"

# Create AppleScript
cat > /tmp/dev-launcher-script.applescript << EOF
tell application "Terminal"
    activate
    do script "cd '$DEV_LAUNCHER_PATH' && ./start.sh"
end tell
EOF

# Compile to application
osacompile -o ~/Desktop/Dev-Launcher.app /tmp/dev-launcher-script.applescript

# Make the start.sh executable
chmod +x "$DEV_LAUNCHER_PATH/start.sh"

# Apply custom icon if it exists
if [ -f "$DEV_LAUNCHER_PATH/Devlauncher.png" ]; then
    echo "🎨 Applying custom icon..."
    "$DEV_LAUNCHER_PATH/set-icon.sh" "$DEV_LAUNCHER_PATH/Devlauncher.png"
fi

echo "✅ Dev Launcher app created on your Desktop!"
echo ""
echo "📍 Location: ~/Desktop/Dev-Launcher.app"
echo "🎯 To customize the icon:"
echo "   1. Find an icon image (.png or .icns)"
echo "   2. Get Info on Dev-Launcher.app (Cmd+I)"
echo "   3. Drag the icon onto the small icon in the top-left"
echo ""
echo "🚀 Double-click Dev-Launcher.app to launch!"
