/**
 * Default Built-in App Configurations
 * 
 * These provide examples for different app types.
 * Users should copy/move their apps to apps.local.js for customization.
 */

export const DEFAULT_APPS = [
  {
    id: 'example-nextjs',
    name: 'Example Next.js App',
    description: 'Next.js application with TypeScript',
    path: '~/projects/example-nextjs',
    command: 'npm',
    args: ['run', 'dev'],
    preferredPort: 3000,
    maxPort: 3010,
    autoOpenBrowser: true,
    type: 'nextjs'
  },
  {
    id: 'example-vite',
    name: 'Example Vite App',
    description: 'Modern frontend application with Vite',
    path: '~/projects/example-vite',
    command: 'npm',
    args: ['run', 'dev'],
    preferredPort: 5173,
    maxPort: 5180,
    autoOpenBrowser: true,
    type: 'vite'
  },
  {
    id: 'example-python',
    name: 'Example Python App',
    description: 'Python Flask/FastAPI application',
    path: '~/projects/example-python',
    command: 'python',
    args: ['app.py'],
    preferredPort: 8000,
    maxPort: 8010,
    autoOpenBrowser: true,
    type: 'python'
  }
];
