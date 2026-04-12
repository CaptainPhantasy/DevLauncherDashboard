import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { spawn, exec } from 'child_process';
import { createServer } from 'net';
import { fileURLToPath } from 'url';
import { APPS, refreshApps, addApp } from './apps.js';
import { getEnv, validateApp } from './config-utils.js';
import { listDirectory, discoverProject, allocatePortBlock } from './discovery.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = getEnv('BACKEND_PORT', '4500');

// Store running processes: { appId: { services: Map<role, { process, port }>, startTime } }
const runningApps = new Map();

app.use(cors());
app.use(express.json());

// ── Utilities ──────────────────────────────────────────────

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => { server.close(); resolve(true); });
    server.listen(port, getEnv('BACKEND_HOST', '127.0.0.1'));
  });
}

async function findAvailablePort(preferredPort, maxPort) {
  if (!preferredPort || !maxPort) return null;
  const maxAttempts = parseInt(getEnv('MAX_PORT_ATTEMPTS', '10'));
  const rangeEnd = Math.min(maxPort, preferredPort + maxAttempts - 1);
  for (let port = preferredPort; port <= rangeEnd; port++) {
    if (await isPortAvailable(port)) return port;
  }
  throw new Error(`No available ports in range ${preferredPort}-${rangeEnd}`);
}

function killPortProcess(port) {
  return new Promise((resolve) => {
    exec(`lsof -ti:${port} | xargs kill -9 2>/dev/null`, () => resolve());
  });
}

async function killPortRange(startPort, endPort) {
  const killed = [];
  for (let port = startPort; port <= endPort; port++) {
    const had = await new Promise(resolve => {
      exec(`lsof -ti:${port}`, (err, stdout) => resolve(stdout?.trim() ? true : false));
    });
    if (had) {
      await killPortProcess(port);
      killed.push(port);
    }
  }
  return killed;
}

function openBrowser(url) {
  const browserApp = getEnv('BROWSER_APP', 'Google Chrome');
  exec(`open -a "${browserApp}" "${url}"`, () => {});
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function escapeAppleScript(str) {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');
}

// ── App Status ──────────────────────────────────────────────

function getAppStatus(appId) {
  const appConfig = APPS.find(a => a.id === appId);
  if (!appConfig) return null;

  const running = runningApps.get(appId);
  const serviceStatuses = [];

  if (appConfig.services && appConfig.services.length > 0) {
    for (const svc of appConfig.services) {
      const runningSvc = running?.services?.get(svc.role);
      serviceStatuses.push({
        role: svc.role,
        dir: svc.dir,
        framework: svc.framework,
        isRunning: !!runningSvc,
        port: runningSvc?.port || null,
        pid: runningSvc?.process?.pid || null,
      });
    }
  }

  return {
    id: appConfig.id,
    name: appConfig.name,
    path: appConfig.path,
    isRunning: !!running,
    port: running?.primaryPort || null,
    startTime: running?.startTime || null,
    preferredPort: appConfig.preferredPort || appConfig.portBlock?.start || null,
    type: appConfig.type || 'custom',
    description: appConfig.description || '',
    icon: appConfig.icon || null,
    services: serviceStatuses.length > 0 ? serviceStatuses : undefined,
    portBlock: appConfig.portBlock || null,
  };
}

// ── API: Apps ──────────────────────────────────────────────

app.get('/api/apps', (req, res) => {
  res.json(APPS.map(a => getAppStatus(a.id)));
});

app.get('/api/status', (req, res) => {
  res.json({
    runningCount: runningApps.size,
    totalApps: APPS.length,
    apps: APPS.map(a => getAppStatus(a.id)),
  });
});

// ── API: Start (supports multi-service sequential startup) ──

app.post('/api/apps/:id/start', async (req, res) => {
  const { id } = req.params;

  if (runningApps.has(id)) {
    return res.status(400).json({ error: 'App already running', port: runningApps.get(id).primaryPort });
  }

  const appConfig = APPS.find(a => a.id === id);
  if (!appConfig) return res.status(404).json({ error: 'App not found' });

  const validation = validateApp(appConfig);
  if (!validation.valid) {
    return res.status(400).json({ error: 'Invalid app configuration', details: validation.errors });
  }

  try {
    const services = appConfig.services && appConfig.services.length > 0
      ? appConfig.services
      : [{ role: 'fullstack', dir: '.', command: appConfig.command, args: appConfig.args, framework: appConfig.type, order: 0 }];

    const startupDelay = appConfig.startupDelay || 2000;
    const runningEntry = { services: new Map(), startTime: new Date().toISOString(), primaryPort: null };
    runningApps.set(id, runningEntry);

    // Determine port base
    let nextPort = appConfig.portBlock?.start || appConfig.preferredPort || null;
    const maxPort = appConfig.portBlock?.end || appConfig.maxPort || (nextPort ? nextPort + 9 : null);

    console.log(`Starting ${appConfig.name} (${services.length} service${services.length > 1 ? 's' : ''})...`);

    for (let i = 0; i < services.length; i++) {
      const svc = services[i];
      const svcDir = svc.dir === '.' ? appConfig.path : path.join(appConfig.path, svc.dir);

      // Find port for this service
      let port = null;
      if (nextPort && maxPort) {
        await killPortProcess(nextPort);
        port = await findAvailablePort(nextPort, maxPort);
        nextPort = port + 1; // Next service gets next port
      }

      const env = { ...process.env };
      if (port) env.PORT = port.toString();

      const command = svc.command || appConfig.command || 'npm';
      const args = svc.args || appConfig.args || ['run', 'dev'];

      console.log(`  [${svc.role}] ${command} ${args.join(' ')} (port ${port || 'N/A'}) in ${svcDir}`);

      // CLI-only apps → open in Terminal
      if (appConfig.autoOpenBrowser === false && services.length === 1) {
        const terminalApp = getEnv('TERMINAL_APP', 'Terminal.app');
        const script = `tell application "${terminalApp}"\n  do script "cd '${escapeAppleScript(svcDir)}' && ${escapeAppleScript(command)} ${args.map(escapeAppleScript).join(' ')}"\n  activate\nend tell`;
        spawn('osascript', ['-e', script], { detached: true, stdio: 'ignore' });
        runningEntry.services.set(svc.role, { process: null, port: null });
        break;
      }

      const childProcess = spawn(command, args, { cwd: svcDir, env, shell: true, detached: false });

      childProcess.stdout?.on('data', (d) => console.log(`[${appConfig.name}/${svc.role}] ${d.toString().trim()}`));
      childProcess.stderr?.on('data', (d) => console.error(`[${appConfig.name}/${svc.role}] ${d.toString().trim()}`));
      childProcess.on('error', (e) => {
        console.error(`[${appConfig.name}/${svc.role}] Error: ${e.message}`);
        runningEntry.services.delete(svc.role);
        if (runningEntry.services.size === 0) runningApps.delete(id);
      });
      childProcess.on('exit', (code) => {
        console.log(`[${appConfig.name}/${svc.role}] Exited (${code})`);
        runningEntry.services.delete(svc.role);
        if (runningEntry.services.size === 0) runningApps.delete(id);
      });

      runningEntry.services.set(svc.role, { process: childProcess, port });

      // Track primary port (first service with a port, typically backend or frontend)
      if (port && !runningEntry.primaryPort) {
        runningEntry.primaryPort = port;
      }

      // Pause between services so earlier ones can bind their ports
      if (i < services.length - 1) {
        await sleep(startupDelay);
      }
    }

    // Auto-open browser for the last service with a port (usually frontend)
    if (getEnv('ENABLE_AUTO_BROWSER_OPEN', 'true') !== 'false' && appConfig.autoOpenBrowser !== false) {
      const lastWithPort = [...runningEntry.services.values()].reverse().find(s => s.port);
      if (lastWithPort) {
        setTimeout(() => openBrowser(`http://localhost:${lastWithPort.port}`), 3000);
      }
    }

    res.json({
      success: true,
      appId: id,
      name: appConfig.name,
      port: runningEntry.primaryPort,
      services: [...runningEntry.services.entries()].map(([role, s]) => ({ role, port: s.port, pid: s.process?.pid })),
    });

  } catch (error) {
    runningApps.delete(id);
    console.error(`Failed to start ${appConfig.name}: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// ── API: Stop ──────────────────────────────────────────────

app.post('/api/apps/:id/stop', (req, res) => {
  const { id } = req.params;
  const running = runningApps.get(id);
  if (!running) return res.status(400).json({ error: 'App is not running' });

  const appConfig = APPS.find(a => a.id === id);

  // Kill all services
  for (const [role, svc] of running.services) {
    if (svc.process) {
      svc.process.kill('SIGTERM');
      setTimeout(() => {
        try { svc.process.kill('SIGKILL'); } catch { /* already dead */ }
      }, 5000);
    }
  }
  runningApps.delete(id);
  console.log(`Stopped ${appConfig?.name || id}`);

  res.json({ success: true, appId: id, name: appConfig?.name });
});

// ── API: Terminal ──────────────────────────────────────────

app.post('/api/apps/:id/open-terminal', (req, res) => {
  const appConfig = APPS.find(a => a.id === req.params.id);
  if (!appConfig) return res.status(404).json({ error: 'App not found' });

  const terminalApp = getEnv('TERMINAL_APP', 'Terminal.app');
  const script = `tell application "${terminalApp}"\n  do script "cd '${escapeAppleScript(appConfig.path)}'"\n  activate\nend tell`;
  spawn('osascript', ['-e', script], { detached: true, stdio: 'ignore' });

  res.json({ success: true, appId: req.params.id, path: appConfig.path });
});

// ── API: Browse filesystem ──────────────────────────────────

app.post('/api/browse', (req, res) => {
  const { path: dirPath } = req.body;
  if (!dirPath) return res.status(400).json({ error: 'path is required' });

  try {
    const result = listDirectory(dirPath);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ── API: Discover project structure ──────────────────────────

app.post('/api/discover', (req, res) => {
  const { path: dirPath } = req.body;
  if (!dirPath) return res.status(400).json({ error: 'path is required' });

  try {
    const result = discoverProject(dirPath);
    // Also compute port block suggestion
    const portBlock = allocatePortBlock(APPS);
    result.suggestedPortBlock = portBlock;
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ── API: Import discovered project ──────────────────────────

app.post('/api/import', async (req, res) => {
  const { name, description, path: projectPath, services, framework, icon, portBlock, startupDelay } = req.body;

  if (!name || !projectPath) {
    return res.status(400).json({ error: 'name and path are required' });
  }

  // Generate stable ID from name
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  // Check for duplicates
  if (APPS.find(a => a.id === id || a.path === projectPath)) {
    return res.status(409).json({ error: 'Project already imported' });
  }

  const svcList = services || [];
  const newApp = {
    id,
    name,
    description: description || '',
    path: projectPath,
    services: svcList,
    type: framework || 'custom',
    icon: icon || null,
    portBlock: portBlock || allocatePortBlock(APPS),
    preferredPort: portBlock?.start || null,
    maxPort: portBlock?.end || null,
    startupDelay: startupDelay || 2000,
    autoOpenBrowser: true,
    command: svcList[0]?.command || 'npm',
    args: svcList[0]?.args || ['run', 'dev'],
  };

  try {
    // Add to runtime APPS array
    addApp(newApp);

    // Persist to apps.local.js
    await persistAppConfig(newApp);

    console.log(`Imported: ${name} (${services?.length || 0} services, ports ${portBlock?.start}-${portBlock?.end})`);

    res.json({
      success: true,
      app: getAppStatus(id),
    });
  } catch (error) {
    console.error(`Failed to import ${name}: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Append new app config to apps.local.js file.
 */
async function persistAppConfig(appConfig) {
  const configPath = path.join(__dirname, 'apps.local.js');

  if (!fs.existsSync(configPath)) {
    // Create the file from scratch
    const content = `/**\n * YOUR PERSONAL APP CONFIGURATIONS\n */\n\nexport const USER_APPS = [\n${formatAppEntry(appConfig)}\n];\n`;
    fs.writeFileSync(configPath, content, 'utf8');
    return;
  }

  // Read existing, insert before the closing ];
  let content = fs.readFileSync(configPath, 'utf8');
  const closingBracket = content.lastIndexOf('];');
  if (closingBracket === -1) {
    throw new Error('Could not parse apps.local.js — missing closing ];');
  }

  // Check if array has entries (need comma)
  const beforeClosing = content.substring(0, closingBracket).trimEnd();
  const needsComma = beforeClosing.endsWith('}') || beforeClosing.endsWith(',');

  const entry = formatAppEntry(appConfig);
  const separator = needsComma && !beforeClosing.endsWith(',') ? ',\n\n' : '\n\n';

  content = content.substring(0, closingBracket) + separator + entry + '\n' + content.substring(closingBracket);
  fs.writeFileSync(configPath, content, 'utf8');
}

function formatAppEntry(app) {
  const lines = [
    `  {`,
    `    id: '${app.id}',`,
    `    name: '${app.name.replace(/'/g, "\\'")}',`,
    `    description: '${(app.description || '').replace(/'/g, "\\'")}',`,
    `    path: '${app.path}',`,
  ];

  if (app.services && app.services.length > 0) {
    lines.push(`    services: [`);
    for (const svc of app.services) {
      lines.push(`      { role: '${svc.role}', dir: '${svc.dir}', command: '${svc.command}', args: ${JSON.stringify(svc.args)}, framework: '${svc.framework}', order: ${svc.order} },`);
    }
    lines.push(`    ],`);
  }

  lines.push(`    command: '${app.command || 'npm'}',`);
  lines.push(`    args: ${JSON.stringify(app.args || ['run', 'dev'])},`);
  lines.push(`    type: '${app.type || 'custom'}',`);

  if (app.icon) lines.push(`    icon: '${app.icon}',`);
  if (app.portBlock) lines.push(`    portBlock: { start: ${app.portBlock.start}, end: ${app.portBlock.end} },`);

  lines.push(`    preferredPort: ${app.preferredPort || 'null'},`);
  lines.push(`    maxPort: ${app.maxPort || 'null'},`);
  lines.push(`    startupDelay: ${app.startupDelay || 2000},`);
  lines.push(`    autoOpenBrowser: ${app.autoOpenBrowser !== false}`);
  lines.push(`  }`);

  return lines.join('\n');
}

// ── API: Serve app icons ──────────────────────────────────

app.get('/api/apps/:id/icon', (req, res) => {
  const appConfig = APPS.find(a => a.id === req.params.id);
  if (!appConfig?.icon) return res.status(404).json({ error: 'No icon' });

  const iconPath = path.join(appConfig.path, appConfig.icon);
  if (!fs.existsSync(iconPath)) return res.status(404).json({ error: 'Icon file not found' });

  res.sendFile(iconPath);
});

// ── API: Config management ──────────────────────────────────

app.post('/api/config/refresh', async (req, res) => {
  try {
    await refreshApps();
    res.json({ message: 'Configuration refreshed', apps: APPS.map(a => getAppStatus(a.id)), total: APPS.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/config/validate', (req, res) => {
  const results = APPS.map(a => ({ id: a.id, name: a.name, ...validateApp(a) }));
  res.json({ total: results.length, valid: results.filter(r => r.valid).length, results });
});

// ── API: Misc ──────────────────────────────────────────────

app.post('/api/refresh', (req, res) => {
  res.json({ apps: APPS.map(a => getAppStatus(a.id)) });
});

app.post('/api/cleanup-ports', async (req, res) => {
  try {
    const portRanges = [
      { start: 3000, end: 3020 }, { start: 4500, end: 4510 },
      { start: 5173, end: 5180 }, { start: 8000, end: 8010 },
    ];
    const allKilled = [];
    for (const range of portRanges) {
      const killed = await killPortRange(range.start, range.end);
      allKilled.push(...killed);
    }
    res.json({ success: true, portsKilled: allKilled, count: allKilled.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), runningApps: runningApps.size, totalApps: APPS.length });
});

// ── Start ──────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Dev Launcher Backend on http://localhost:${PORT}`);
  console.log(`${APPS.length} apps configured`);
});

process.on('SIGINT', () => {
  console.log('\nShutting down...');
  runningApps.forEach((running) => {
    for (const [, svc] of running.services) {
      if (svc.process) svc.process.kill('SIGTERM');
    }
  });
  process.exit(0);
});
