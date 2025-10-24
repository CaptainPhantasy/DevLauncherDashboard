# Desktop Icon Setup

## Quick Start

A **Dev-Launcher.app** has been created on your Desktop! 🚀

Simply **double-click** the icon to launch the Dev Launcher.

## What It Does

When you double-click the app:
1. Opens Terminal
2. Navigates to the dev-launcher directory
3. Runs the startup script
4. Automatically cleans up port conflicts
5. Starts both backend and frontend servers

## Recreating the Icon

If you need to recreate the desktop icon:

```bash
cd /Volumes/Storage/Development/dev-launcher
./create-desktop-icon.sh
```

## Customizing the Icon

Want to use a custom icon image?

1. Find or create your icon image (PNG, JPG, or ICNS format)
2. Right-click **Dev-Launcher.app** → **Get Info** (or press Cmd+I)
3. In the Info window, click the small icon in the top-left corner
4. Drag your custom icon image onto it
5. The icon will update immediately!

### Recommended Icon Sources

- **SF Symbols**: macOS built-in icon library (free)
- **Icons8**: https://icons8.com
- **Flaticon**: https://flaticon.com
- **Create your own** using Preview or image editor

## Moving the App

You can move **Dev-Launcher.app** to:
- Your Applications folder (`~/Applications`)
- Keep it on the Desktop
- Add to Dock for quick access

## Adding to Dock

1. Drag **Dev-Launcher.app** to your Dock
2. Or: Right-click the running app in Dock → Options → Keep in Dock

## Troubleshooting

### App won't open
```bash
# Make sure start.sh is executable
chmod +x /Volumes/Storage/Development/dev-launcher/start.sh
```

### Wrong directory path
If you move the dev-launcher folder, recreate the app:
```bash
cd /path/to/new/location/dev-launcher
./create-desktop-icon.sh
```

### Terminal doesn't open
The app uses macOS Terminal. If you prefer iTerm2:
1. Edit the app: Right-click → Show Package Contents
2. Navigate to Contents/Resources/Scripts/
3. Edit main.scpt to use iTerm2 instead

## Quick Access Shortcuts

### Keyboard Shortcut
1. System Preferences → Keyboard → Shortcuts
2. App Shortcuts → Add (+)
3. Choose Dev-Launcher.app
4. Set your preferred shortcut

### Spotlight
Just type "Dev Launcher" in Spotlight (Cmd+Space) to launch!

## What Gets Launched

When you start the launcher:
- **Frontend**: http://localhost:4501
- **Backend**: http://localhost:4500
- **Port Cleanup**: Automatic on startup

All your configured apps (11 total) will be available in the dashboard.

---

**Tip**: You can create multiple launcher icons with different names if you want quick access to specific projects!
