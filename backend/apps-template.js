/**
 * Example App Configurations Template
 * 
 * Copy this file to apps.local.js and customize with your own projects.
 * This file shows examples of different app types you can configure.
 */

export const TEMPLATE_APPS = [
  // Next.js Application
  {
    id: 'my-nextjs-app',
    name: 'My Next.js Project',
    description: 'Full-stack Next.js application with TypeScript',
    path: '~/projects/my-nextjs-app', // Supports ~ for home directory
    command: 'npm',
    args: ['run', 'dev'],
    preferredPort: 3000,
    maxPort: 3010,
    autoOpenBrowser: true,
    type: 'nextjs'
  },

  // Vite Application
  {
    id: 'my-vite-app',
    name: 'My Vite Project',
    description: 'Modern frontend application with Vite',
    path: '~/projects/my-vite-app',
    command: 'npm',
    args: ['run', 'dev'],
    preferredPort: 5173,
    maxPort: 5180,
    autoOpenBrowser: true,
    type: 'vite'
  },

  // Create React App (CRA)
  {
    id: 'my-react-app',
    name: 'My React App',
    description: 'React application using Create React App',
    path: '~/projects/my-react-app',
    command: 'npm',
    args: ['start'],
    preferredPort: 3001,
    maxPort: 3010,
    autoOpenBrowser: true,
    type: 'cra'
  },

  // Python Backend Service
  {
    id: 'my-python-api',
    name: 'My Python API',
    description: 'FastAPI backend service',
    path: '~/projects/my-python-api',
    command: 'python',
    args: ['main.py'],
    preferredPort: 8000,
    maxPort: 8010,
    autoOpenBrowser: true,
    type: 'python'
  },

  // Python CLI Tool (no browser)
  {
    id: 'my-python-script',
    name: 'My Python Script',
    description: 'Command-line Python tool',
    path: '~/projects/my-python-script',
    command: 'python',
    args: ['script.py'],
    preferredPort: null, // No web interface
    maxPort: null,
    autoOpenBrowser: false, // Opens in Terminal
    type: 'python-cli'
  },

  // Static HTML/CSS/JS
  {
    id: 'my-static-site',
    name: 'My Static Site',
    description: 'Static HTML website',
    path: '~/projects/my-static-site',
    command: 'python',
    args: ['-m', 'http.server', '4000'],
    preferredPort: 4000,
    maxPort: 4010,
    autoOpenBrowser: true,
    type: 'static'
  },

  // Docker-based Application
  {
    id: 'my-docker-app',
    name: 'My Docker App',
    description: 'Application running in Docker',
    path: '~/projects/my-docker-app',
    command: 'docker-compose',
    args: ['up'],
    preferredPort: 5000,
    maxPort: 5010,
    autoOpenBrowser: true,
    type: 'docker'
  },

  // Custom Shell Script
  {
    id: 'my-custom-app',
    name: 'My Custom Application',
    description: 'Launches with custom shell script',
    path: '~/projects/my-custom-app',
    command: './start.sh',
    args: [],
    preferredPort: 3002,
    maxPort: 3010,
    autoOpenBrowser: true,
    type: 'custom'
  }
];

/**
 * Configuration Schema
 * 
 * Required fields: id, name, path, command, args
 * Optional: description, preferredPort, maxPort, autoOpenBrowser, type
 * 
 * Field descriptions:
 * - id: Unique identifier (used in URLs)
 * - name: Display name in the UI
 * - description: Short description of what the app does
 * - path: Absolute or relative path to the project directory
 *   Supports: ~/projects/app, /absolute/path, ./relative/path
 * - command: Command to execute (npm, python, docker-compose, etc.)
 * - args: Array of arguments to pass to the command
 * - preferredPort: Preferred port to run on (null for CLI apps)
 * - maxPort: Maximum port to try if preferred is busy
 * - autoOpenBrowser: Whether to auto-open browser (false for CLI apps)
 * - type: App type category for organization (nextjs, vite, python, etc.)
 */
