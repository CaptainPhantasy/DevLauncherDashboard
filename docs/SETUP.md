# Dev Launcher Setup Guide

Welcome to Dev Launcher - a web-based application launcher for your development projects!

## Quick Start

### Step 1: Installation

```bash
# Clone or download the Dev Launcher
cd dev-launcher

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies  
cd ../frontend && npm install

# Run the setup wizard
cd ../backend && npm run setup
```

### Step 2: Configure Your Projects

Edit `backend/apps.local.js` to add your own projects:

```javascript
export const USER_APPS = [
  {
    id: 'my-app',
    name: 'My Next.js Project',
    description: 'Full-stack application',
    path: '~/projects/my-app',  // Supports ~ for home directory
    command: 'npm',
    args: ['run', 'dev'],
    preferredPort: 3000,
    maxPort: 3010,
    autoOpenBrowser: true,
    type: 'nextjs'
  },
  // Add more apps...
];
```

### Step 3: Launch the Dev Launcher

```bash
# Method 1: Use the simple startup script
./start.sh

# Method 2: Manual startup
# Terminal 1 - Backend:
cd backend && npm start

# Terminal 2 - Frontend:  
cd frontend && npm run dev
```

### Step 4: Use Your Launcher

Open http://localhost:4501 in your browser to see all your configured apps!

## Configuration Options

### Path Formats

- **Tilde**: `~/projects/my-app` → expands to home directory
- **Absolute**: `/Users/yourname/projects/my-app`
- **Environment**: `${DEV_ROOT}/my-app` → uses env variable
- **Relative**: `../my-app` → relative to dev-launcher directory

### App Types

Dev Launcher supports different application types:

```javascript
// Next.js Application
{
  id: 'next-app',
  command: 'npm',
  args: ['run', 'dev'],
  preferredPort: 3000,
  type: 'nextjs'
}

// Vite Application  
{
  id: 'vite-app',
  command: 'npm',
  args: ['run', 'dev'],
  preferredPort: 5173,
  type: 'vite'
}

// Create React App
{
  id: 'cra-app',
  command: 'npm',
  args: ['start'],
  preferredPort: 3001,
  type: 'cra'
}

// Python/CLI Tool (no browser)
{
  id: 'python-script',
  command: 'python',
  args: ['script.py'],
  preferredPort: null,
  autoOpenBrowser: false,
  type: 'python-cli'
}

// Docker Application
{
  id: 'docker-app',
  command: 'docker-compose',
  args: ['up'],
  preferredPort: 5000,
  type: 'docker'
}
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# Development directory
DEV_ROOT=~/projects

# Browser and terminal preferences
BROWSER_APP=Google Chrome
TERMINAL_APP=Terminal.app

# Port allocation
MAX_PORT_ATTEMPTS=10
PREFERRED_PORT_RANGE_START=3000
PREFERRED_PORT_RANGE_END=3500

# Features
ENABLE_AUTO_BROWSER_OPEN=true
ENABLE_TERMINAL_OPEN=true
```

## Advanced Features

### Clickable Paths
Click any app's folder path to open a new Terminal window at that location.

### Port Management
- Auto-detects available ports
- Resolves conflicts automatically
- Shows assigned ports in the UI

### Process Management
- Start/stop apps with one click
- Monitor running status
- Clean shutdown on exit

### Configuration Validation
```bash
# Validate your configuration
cd backend && npm run validate
```

## Troubleshooting

### Common Issues

**"Directory does not exist" error**
- Check that the path in your configuration exists
- Use absolute paths or ensure relative paths are correct
- Run `ls -la` to verify directory access

**Port already in use**
- Dev Launcher automatically finds available ports
- Check what's running: `lsof -i :3000`
- Kill conflicting processes: `kill -9 <PID>`

**Setup command not found**
- Ensure you're in the backend directory
- Check Node.js version: `node --version` (requires 18+)
- Reinstall dependencies: `npm install`

**Browser won't auto-open**
- Check BROWSER_APP setting in .env
- Ensure Chrome is installed and accessible
- Try manually opening: `open http://localhost:<port>`

### Getting Help

1. Check the console output for error messages
2. Validate your configuration: `npm run validate`
3. Restart the backend after making changes
4. Review the example configurations in `apps-template.js`

## Migration from Old Version

If you're upgrading from the hardcoded version:

1. Your apps are automatically preserved in `apps.local.js`
2. Update paths to use `~` or environment variables
3. Add project types and descriptions for better organization
4. Consider using environment variables for portable configurations

## Next Steps

- Add all your development projects to `apps.local.js`
- Customize the UI preferences in `.env`
- Explore the API endpoints for automation
- Consider creating multiple configuration files for different workspaces
