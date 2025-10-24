import express from 'express';
import cors from 'cors';
import { spawn, exec } from 'child_process';
import { createServer } from 'net';
import { APPS, refreshApps } from './apps.js';
import { getEnv, resolvePath, validateApp, setupUserConfiguration } from './config-utils.js';

const app = express();
const PORT = getEnv('BACKEND_PORT', '4500');

// Store running processes: { appId: { process, port, startTime } }
const runningApps = new Map();

// Middleware
app.use(cors());
app.use(express.json());

// Utility: Check if port is available
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port, getEnv('BACKEND_HOST', '127.0.0.1'));
  });
}

// Utility: Find available port in range
async function findAvailablePort(preferredPort, maxPort) {
  if (!preferredPort || !maxPort) return null;

  const maxAttempts = parseInt(getEnv('MAX_PORT_ATTEMPTS', '10'));
  const rangeStart = preferredPort;
  const rangeEnd = Math.min(maxPort, preferredPort + maxAttempts - 1);

  for (let port = rangeStart; port <= rangeEnd; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available ports in range ${rangeStart}-${rangeEnd}`);
}

// Utility: Kill process on port
function killPortProcess(port) {
  return new Promise((resolve) => {
    exec(`lsof -ti:${port} | xargs kill -9 2>/dev/null`, (error) => {
      if (error) {
        // No process found on port or already killed
        resolve(false);
      } else {
        console.log(`  ✓ Killed process on port ${port}`);
        resolve(true);
      }
    });
  });
}

// Utility: Kill processes in port range
async function killPortRange(startPort, endPort) {
  const killed = [];
  for (let port = startPort; port <= endPort; port++) {
    const wasKilled = await killPortProcess(port);
    if (wasKilled) {
      killed.push(port);
    }
  }
  return killed;
}

// Utility: Open browser
function openBrowser(url) {
  const browserApp = getEnv('BROWSER_APP', 'Google Chrome');
  exec(`open -a "${browserApp}" "${url}"`, (error) => {
    if (error) {
      console.error(`Failed to open browser: ${error.message}`);
    }
  });
}

// Utility: Get app status
function getAppStatus(appId) {
  const app = APPS.find(a => a.id === appId);
  if (!app) return null;

  const running = runningApps.get(appId);

  return {
    id: app.id,
    name: app.name,
    path: app.path,
    isRunning: !!running,
    port: running?.port || null,
    startTime: running?.startTime || null,
    preferredPort: app.preferredPort,
    type: app.type || 'custom',
    description: app.description || ''
  };
}

// API: Get all apps
app.get('/api/apps', (req, res) => {
  const apps = APPS.map(app => getAppStatus(app.id));
  res.json(apps);
});

// API: Get system status
app.get('/api/status', (req, res) => {
  const runningCount = runningApps.size;
  const apps = APPS.map(app => getAppStatus(app.id));

  res.json({
    runningCount,
    totalApps: APPS.length,
    apps
  });
});

// API: Refresh configurations
app.post('/api/config/refresh', async (req, res) => {
  try {
    await refreshApps();
    const apps = APPS.map(app => getAppStatus(app.id));
    res.json({ 
      message: 'Configuration refreshed successfully', 
      apps: apps,
      total: APPS.length 
    });
  } catch (error) {
    console.error('Failed to refresh configuration:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// API: Validate configuration
app.get('/api/config/validate', (req, res) => {
  const results = [];
  
  APPS.forEach(app => {
    constvalidation = validateApp(app);
    results.push({
      id: app.id,
      name: app.name,
      ...validation
    });
  });
  
  res.json({
    total: results.length,
    valid: results.filter(r => r.valid).length,
    results
  });
});

// API: Setup wizard
app.get('/api/setup', async (req, res) => {
  try {
    await setupUserConfiguration();
    res.json({ message: 'Setup completed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Start an app
app.post('/api/apps/:id/start', async (req, res) => {
  const { id } = req.params;

  // Check if already running
  if (runningApps.has(id)) {
    return res.status(400).json({
      error: 'App already running',
      port: runningApps.get(id).port
    });
  }

  // Find app configuration
  const appConfig = APPS.find(a => a.id === id);
  if (!appConfig) {
    return res.status(404).json({ error: 'App not found' });
  }

  // Validate configuration
  const validation = validateApp(appConfig);
  if (!validation.valid) {
    return res.status(400).json({ 
      error: 'Invalid app configuration', 
      details: validation.errors 
    });
  }

  try {
    // Kill any process on the preferred port to avoid conflicts
    if (appConfig.preferredPort) {
      console.log(`Checking port ${appConfig.preferredPort}...`);
      await killPortProcess(appConfig.preferredPort);
    }

    // Find available port
    let port = null;
    if (appConfig.preferredPort && appConfig.maxPort) {
      port = await findAvailablePort(appConfig.preferredPort, appConfig.maxPort);
    }

    // Prepare environment with PORT variable
    const env = { ...process.env };
    if (port) {
      env.PORT = port.toString();
    }

    console.log(`Starting ${appConfig.name} on port ${port || 'N/A'}...`);
    console.log(`Command: ${appConfig.command} ${appConfig.args.join(' ')}`);
    console.log(`Working directory: ${appConfig.path}`);

    // For CLI apps, open in Terminal instead of spawning background process
    if (!appConfig.autoOpenBrowser) {
      if (getEnv('ENABLE_TERMINAL_OPEN', 'true') !== 'false') {
        const terminalApp = getEnv('TERMINAL_APP', 'Terminal.app');
        const terminalScript = `
tell application "${terminalApp}"
  do script "cd '${appConfig.path}' && ${appConfig.command} ${appConfig.args.join(' ')}"
  activate
end tell
        `.trim();

        spawn('osascript', ['-e', terminalScript], {
          detached: true,
          stdio: 'ignore'
        });
      }

      res.json({
        success: true,
        appId: id,
        name: appConfig.name,
        port: null,
        message: 'Launched in Terminal'
      });
      return;
    }

    // Spawn the process (for web apps only)
    const childProcess = spawn(appConfig.command, appConfig.args, {
      cwd: appConfig.path,
      env,
      shell: true,
      detached: false
    });

    // Handle process output
    childProcess.stdout?.on('data', (data) => {
      console.log(`[${appConfig.name}] ${data.toString().trim()}`);
    });

    childProcess.stderr?.on('data', (data) => {
      console.error(`[${appConfig.name}] ${data.toString().trim()}`);
    });

    childProcess.on('error', (error) => {
      console.error(`[${appConfig.name}] Error:`, error.message);
      runningApps.delete(id);
    });

    childProcess.on('exit', (code) => {
      console.log(`[${appConfig.name}] Exited with code ${code}`);
      runningApps.delete(id);
    });

    // Store process info
    runningApps.set(id, {
      process: childProcess,
      port,
      startTime: new Date().toISOString()
    });

    // Open browser if configured (for web apps)
    if (getEnv('ENABLE_AUTO_BROWSER_OPEN', 'true') !== 'false' && appConfig.autoOpenBrowser && port) {
      setTimeout(() => {
        openBrowser(`http://localhost:${port}`);
      }, 3000); // Wait 3 seconds for server to start
    }

    res.json({
      success: true,
      appId: id,
      name: appConfig.name,
      port,
      pid: childProcess.pid
    });

  } catch (error) {
    console.error(`Failed to start ${appConfig.name}:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// API: Stop an app
app.post('/api/apps/:id/stop', (req, res) => {
  const { id } = req.params;

  const running = runningApps.get(id);
  if (!running) {
    return res.status(400).json({ error: 'App is not running' });
  }

  const appConfig = APPS.find(a => a.id === id);

  try {
    // Kill the process
    running.process.kill('SIGTERM');

    // Wait a bit, then force kill if still running
    setTimeout(() => {
      if (runningApps.has(id)) {
        running.process.kill('SIGKILL');
        runningApps.delete(id);
      }
    }, 5000);

    runningApps.delete(id);

    console.log(`Stopped ${appConfig?.name || id}`);

    res.json({
      success: true,
      appId: id,
      name: appConfig?.name
    });

  } catch (error) {
    console.error(`Failed to stop ${id}:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// API: Open Terminal at path
app.post('/api/apps/:id/open-terminal', (req, res) => {
  const { id } = req.params;

  const appConfig = APPS.find(a => a.id === id);
  if (!appConfig) {
    return res.status(404).json({ error: 'App not found' });
  }

  try {
    const terminalApp = getEnv('TERMINAL_APP', 'Terminal.app');
    const terminalScript = `
tell application "${terminalApp}"
  do script "cd '${appConfig.path}'"
  activate
end tell
    `.trim();

    spawn('osascript', ['-e', terminalScript], {
      detached: true,
      stdio: 'ignore'
    });

    console.log(`Opened Terminal at ${appConfig.path}`);

    res.json({
      success: true,
      appId: id,
      name: appConfig.name,
      path: appConfig.path
    });

  } catch (error) {
    console.error(`Failed to open Terminal for ${id}:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// API: Force refresh (just returns current status)
app.post('/api/refresh', (req, res) => {
  const apps = APPS.map(app => getAppStatus(app.id));
  res.json({ apps });
});

// API: Kill all development ports
app.post('/api/cleanup-ports', async (req, res) => {
  try {
    console.log('🧹 Cleaning up all development ports...');

    const portRanges = [
      { start: 3000, end: 3020 },
      { start: 4500, end: 4510 },
      { start: 5173, end: 5180 },
      { start: 8000, end: 8010 }
    ];

    const allKilled = [];
    for (const range of portRanges) {
      const killed = await killPortRange(range.start, range.end);
      allKilled.push(...killed);
    }

    console.log(`✓ Cleaned up ${allKilled.length} ports`);

    res.json({
      success: true,
      message: 'Port cleanup complete',
      portsKilled: allKilled,
      count: allKilled.length
    });
  } catch (error) {
    console.error('Failed to cleanup ports:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    runningApps: runningApps.size,
    totalApps: APPS.length
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Dev Launcher Backend running on http://localhost:${PORT}`);
  console.log(`📱 Configured apps: ${APPS.length}`);
  console.log(`🔧 API endpoints:`);
  console.log(`  GET  /api/apps              - List all apps with status`);
  console.log(`  GET  /api/status           - System status`);
  console.log(`  GET  /api/setup            - Setup wizard`);
  console.log(`  GET  /api/config/validate  - Validate configurations`);
  console.log(`  POST /api/config/refresh   - Refresh configurations`);
  console.log(`  POST /api/apps/:id/start    - Start an app`);
  console.log(`  POST /api/apps/:id/stop     - Stop an app`);
  console.log(`  POST /api/apps/:id/open-terminal - Open Terminal`);
  console.log(`  POST /api/refresh          - Force refresh status`);
  console.log(`  POST /api/cleanup-ports    - Kill all dev ports`);
  console.log(`  GET  /health               - Health check`);
});

// Cleanup on exit
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  runningApps.forEach((running, appId) => {
    console.log(`Stopping ${appId}...`);
    running.process.kill('SIGTERM');
  });
  process.exit(0);
});
