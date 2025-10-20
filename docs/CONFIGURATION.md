# Dev Launcher Configuration Reference

## Configuration Files

### apps.local.js
Your personal app configurations (gitignored).

```javascript
export const USER_APPS = [
  {
    // Required fields
    id: 'unique-app-id',           // Unique identifier
    name: 'App Display Name',       // Shown in the UI
    path: '~/projects/my-app',      // Project directory
    command: 'npm',                 // Command to execute
    args: ['run', 'dev'],           // Command arguments
    
    // Optional fields
    description: 'Short description', // UI tooltip
    preferredPort: 3000,             // Preferred port
    maxPort: 3010,                   // Port range upper bound
    autoOpenBrowser: true,           // Auto-open browser
    type: 'nextjs'                   // App type category
  }
];
```

### .env
Environment variables and settings.

```env
# Path Configuration
DEV_ROOT=~/projects
BACKEND_HOST=127.0.0.1
BACKEND_PORT=4500

# Application Defaults
NEXTJS_DEFAULT_PORT=3000
VITE_DEFAULT_PORT=5173
PYTHON_DEFAULT_PORT=8000
STATIC_DEFAULT_PORT=4000

# Port Management
MAX_PORT_ATTEMPTS=10
PREFERRED_PORT_RANGE_START=3000
PREFERRED_PORT_RANGE_END=3500

# Browser & Terminal
BROWSER_APP=Google Chrome
TERMINAL_APP=Terminal.app

# UI Settings
AUTO_REFRESH_INTERVAL=2000

# Feature Toggles
ENABLE_PROJECT_DISCOVERY=true
ENABLE_AUTO_BROWSER_OPEN=true
ENABLE_TERMINAL_OPEN=true

# Logging
LOG_LEVEL=info
```

## Field Reference

### Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | string | Unique identifier for the app | `my-nextjs-app` |
| `name` | string | Display name in the UI | `My Next.js Project` |
| `path` | string | Project directory path | `~/projects/my-app` |
| `command` | string | Command to execute | `npm` |
| `args` | array | Arguments for the command | `['run', 'dev']` |

### Optional Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `description` | string | `''` | Short description/hint |
| `preferredPort` | number | `null` | Preferred port for the app |
| `maxPort` | number | `null` | Maximum port to try |
| `autoOpenBrowser` | boolean | `true` | Auto-open browser when started |
| `type` | string | `custom` | App category for organization |

## Path Resolution

The launcher supports multiple path formats:

### Tilde Expansion
```javascript
path: '~/projects/my-app'
// Becomes: /Users/yourname/projects/my-app
```

### Environment Variables
```javascript
// In .env:
DEV_ROOT=/Users/yourname/development

// In configuration:
path: '${DEV_ROOT}/my-app'
// Becomes: /Users/yourname/development/my-app
```

### Absolute Paths
```javascript
path: '/Volumes/Storage/Development/my-app'
```

### Relative Paths
```javascript
path: '../projects/my-app'
// Resolved from dev-launcher/backend/
```

## App Types

Commonly used app type identifiers:

| Type | Description | Typical Port |
|------|-------------|--------------|
| `nextjs` | Next.js application | 3000 |
| `vite` | Vite frontend app | 5173 |
| `cra` | Create React App | 3000 |
| `python` | Python web app | 8000 |
| `python-cli` | Python CLI tool | `null` |
| `static` | Static HTML server | 4000 |
| `docker` | Dockerized application | varies |
| `custom` | Custom/Other | varies |

## Port Management

### Preferred Port Strategy
1. Try `preferredPort` first
2. If busy, try next port in range
3. Continue until `maxPort` is reached
4. If all ports busy, throw error

### Port Ranges
```javascript
// Example: Port 3000-3010 (11 attempts)
preferredPort: 3000,
maxPort: 3010

// Example: Fixed port (only 3000)
preferredPort: 3000,
maxPort: 3000

// Example: No web interface (CLI tool)
preferredPort: null,
maxPort: null
```

## Environment Variables

### Development Paths
- `DEV_ROOT`: Base directory for projects
- `BACKEND_HOST`: Server bind address
- `BACKEND_PORT`: Server port

### Browser & Terminal
- `BROWSER_APP`: Browser application name
- `TERMINAL_APP`: Terminal application name

### Feature Control
- `ENABLE_AUTO_BROWSER_OPEN`: Enable/disable browser auto-open
- `ENABLE_TERMINAL_OPEN`: Enable/disable Terminal opening
- `ENABLE_PROJECT_DISCOVERY`: Enable project scanning
- `LOG_LEVEL`: Logging verbosity

## Validation

The launcher validates configurations automatically:

### Required Fields Check
All required fields must be present and non-empty.

### Directory Existence
Project directories should exist (warns if not).

### Port Range Validation
- Ports must be 1024-65535
- `maxPort` must be >= `preferredPort`

### Command Sanity
Commands should be executable on the system.

## API Integration

### Loading Configurations
```javascript
import { loadAppConfigurations } from './config-utils.js';
const apps = await loadAppConfigurations();
```

### Validation
```javascript
import { validateApp } from './config-utils.js';
const result = validateApp(app);
if (!result.valid) {
  console.error('Configuration errors:', result.errors);
}
```

### Path Resolution
```javascript
import { resolvePath } from './config-utils.js';
const absolutePath = resolvePath('~/projects/my-app');
```

## Best Practices

### Organize by Type
Use the `type` field to group similar apps:
```javascript
type: 'nextjs'    // For Next.js apps
type: 'python'    // For Python web apps
type: 'cli'       // For command-line tools
```

### Environment Variables
For portable configurations, use environment variables instead of hardcoded paths:
```javascript
// Instead of this:
path: '/Users/yourname/projects/my-app'

// Use this (with DEV_ROOT in .env):
path: '${DEV_ROOT}/my-app'
```

### Descriptions
Add helpful descriptions for better UX:
```javascript
description: 'E-commerce platform with TypeScript and Stripe'
```

### Port Planning
Choose non-conflicting port ranges:
```javascript
// Next.js apps: 3000-3010
// Python APIs: 8000-8010  
// Static sites: 4000-4010
// CLI tools: null (no ports)
```

## Migration Examples

### From Hardcoded
```javascript
// Old (hardcoded)
{ id: 'app1', path: '/Volumes/Storage/Development/app1' }

// New (portable)
{ id: 'app1', path: '${DEV_ROOT}/app1' }
```

### Adding Type Information
```javascript
// Before
{ id: 'my-app', command: 'npm', args: ['run', 'dev'] }

// After  
{ id: 'my-app', type: 'nextjs', command: 'npm', args: ['run', 'dev'] }
```

### CLI Tool Configuration
```javascript
// Web app
{ id: 'web-api', preferredPort: 8000, autoOpenBrowser: true }

// CLI tool
{ id: 'cli-tool', preferredPort: null, autoOpenBrowser: false }
```
