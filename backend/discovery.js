import fs from 'fs';
import path from 'path';

// Icon filename patterns, checked in priority order
const ICON_PATTERNS = [
  /^logo\.(png|jpg|jpeg|svg|ico)$/i,
  /^icon\.(png|jpg|jpeg|svg|ico)$/i,
  /^favicon\.(png|jpg|jpeg|svg|ico)$/i,
  /^hero\.(png|jpg|jpeg|svg)$/i,
  /^banner\.(png|jpg|jpeg|svg)$/i,
  /logo/i,
  /icon/i,
  /brand/i,
];

// Directories to scan for icons beyond the root
const ICON_DIRS = ['public', 'assets', 'src/assets', 'static', 'images', 'img', 'src/images'];

// Known framework indicators in dependencies
const FRAMEWORK_SIGNATURES = {
  nextjs:  { deps: ['next'], scripts: { dev: 'next dev', build: 'next build' } },
  vite:    { deps: ['vite'], scripts: { dev: 'vite' } },
  cra:     { deps: ['react-scripts'], scripts: { start: 'react-scripts start' } },
  remix:   { deps: ['@remix-run/dev'], scripts: {} },
  nuxt:    { deps: ['nuxt'], scripts: { dev: 'nuxt dev' } },
  angular: { deps: ['@angular/core'], scripts: { start: 'ng serve' } },
  express: { deps: ['express'], scripts: {} },
  fastify: { deps: ['fastify'], scripts: {} },
  django:  { files: ['manage.py'], scripts: {} },
  flask:   { files: ['app.py', 'wsgi.py'], deps: ['flask'] },
  rails:   { files: ['Gemfile', 'config/routes.rb'], scripts: {} },
};

/**
 * List contents of a directory for the file browser.
 * Returns only directories (no files) for cleaner navigation.
 */
export function listDirectory(dirPath) {
  const resolved = dirPath.replace(/^~/, process.env.HOME || '/Users');

  if (!fs.existsSync(resolved)) {
    throw new Error(`Directory not found: ${resolved}`);
  }

  const stat = fs.statSync(resolved);
  if (!stat.isDirectory()) {
    throw new Error(`Not a directory: ${resolved}`);
  }

  const entries = [];
  for (const name of fs.readdirSync(resolved)) {
    // Skip hidden dirs and common noise
    if (name.startsWith('.') || name === 'node_modules' || name === '__pycache__' || name === '.git') continue;

    const fullPath = path.join(resolved, name);
    try {
      const s = fs.statSync(fullPath);
      if (s.isDirectory()) {
        // Quick hint: does this directory look like a project?
        const hasPackageJson = fs.existsSync(path.join(fullPath, 'package.json'));
        const hasDockerfile  = fs.existsSync(path.join(fullPath, 'Dockerfile'));
        const hasDockerCompose = fs.existsSync(path.join(fullPath, 'docker-compose.yml')) ||
                                 fs.existsSync(path.join(fullPath, 'docker-compose.yaml'));
        const hasManagePy = fs.existsSync(path.join(fullPath, 'manage.py'));
        const hasCargo    = fs.existsSync(path.join(fullPath, 'Cargo.toml'));
        const hasGemfile  = fs.existsSync(path.join(fullPath, 'Gemfile'));

        entries.push({
          name,
          path: fullPath,
          isProject: hasPackageJson || hasDockerfile || hasDockerCompose || hasManagePy || hasCargo || hasGemfile,
        });
      }
    } catch {
      // Permission denied etc — skip silently
    }
  }

  entries.sort((a, b) => {
    // Projects first, then alphabetical
    if (a.isProject !== b.isProject) return a.isProject ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return { path: resolved, entries };
}

/**
 * Discover project structure from a directory.
 * Returns everything needed to create an app config.
 */
export function discoverProject(dirPath) {
  const resolved = dirPath.replace(/^~/, process.env.HOME || '/Users');

  if (!fs.existsSync(resolved)) {
    throw new Error(`Directory not found: ${resolved}`);
  }

  const result = {
    name: path.basename(resolved),
    description: '',
    path: resolved,
    framework: null,
    services: [],
    icon: null,
    hasDocker: false,
  };

  // --- Detect project type from root package.json ---
  const rootPkg = readPackageJson(resolved);
  if (rootPkg) {
    result.name = rootPkg.name || result.name;
    result.description = rootPkg.description || '';
  }

  // --- Scan for services ---
  // Check for monorepo / multi-service structure first
  const subdirs = safeReaddir(resolved);
  const serviceRoles = detectServiceDirs(resolved, subdirs);

  if (serviceRoles.length > 0) {
    // Multi-service project
    let order = 0;
    for (const svc of serviceRoles) {
      const svcPath = path.join(resolved, svc.dir);
      const svcPkg = readPackageJson(svcPath);
      const detected = detectStartCommand(svcPath, svcPkg, svc.role);

      result.services.push({
        role: svc.role,
        dir: svc.dir,
        command: detected.command,
        args: detected.args,
        framework: detected.framework,
        order: svc.role === 'database' ? 0 : svc.role === 'backend' ? 1 : svc.role === 'middleware' ? 2 : 3,
      });
      order++;
    }

    // Sort by startup order
    result.services.sort((a, b) => a.order - b.order);

    // Use the frontend framework as the top-level type if present
    const frontendSvc = result.services.find(s => s.role === 'frontend');
    const backendSvc = result.services.find(s => s.role === 'backend');
    result.framework = frontendSvc?.framework || backendSvc?.framework || 'custom';
  } else if (rootPkg) {
    // Single-service project
    const detected = detectStartCommand(resolved, rootPkg, 'fullstack');
    result.services.push({
      role: 'fullstack',
      dir: '.',
      command: detected.command,
      args: detected.args,
      framework: detected.framework,
      order: 0,
    });
    result.framework = detected.framework;
  }

  // --- Docker ---
  result.hasDocker = fs.existsSync(path.join(resolved, 'Dockerfile')) ||
                     fs.existsSync(path.join(resolved, 'docker-compose.yml')) ||
                     fs.existsSync(path.join(resolved, 'docker-compose.yaml'));

  // If no services detected but has docker-compose, add docker service
  if (result.services.length === 0 && result.hasDocker) {
    const composeFile = fs.existsSync(path.join(resolved, 'docker-compose.yml')) ? 'docker-compose.yml' : 'docker-compose.yaml';
    result.services.push({
      role: 'fullstack',
      dir: '.',
      command: 'docker-compose',
      args: ['-f', composeFile, 'up'],
      framework: 'docker',
      order: 0,
    });
    result.framework = 'docker';
  }

  // --- Python projects without package.json ---
  if (result.services.length === 0) {
    const pythonEntry = detectPythonProject(resolved);
    if (pythonEntry) {
      result.services.push(pythonEntry);
      result.framework = pythonEntry.framework;
    }
  }

  // --- Justfile + uv-based projects (e.g. multi-app Python monorepos) ---
  if (result.services.length === 0 && fs.existsSync(path.join(resolved, 'justfile'))) {
    const justfileServices = detectJustfileProject(resolved);
    if (justfileServices.length > 0) {
      result.services.push(...justfileServices);
      result.services.sort((a, b) => a.order - b.order);
      result.framework = justfileServices[0].framework;
    }
  }

  // --- Static HTML projects (no build step, serve with http-server) ---
  if (result.services.length === 0) {
    const htmlFiles = safeReaddir(resolved).filter(f => f.endsWith('.html'));
    if (htmlFiles.length > 0) {
      const mainHtml = htmlFiles.includes('index.html') ? 'index.html' : htmlFiles[0];
      result.services.push({
        role: 'fullstack',
        dir: '.',
        command: 'python3',
        args: ['-m', 'http.server', '${PORT:-8000}'],
        framework: 'static',
        order: 0,
      });
      result.framework = 'static';
      result.description = result.description || `Static HTML (${mainHtml})`;
    }
  }

  // --- Icon detection ---
  result.icon = findProjectIcon(resolved);

  return result;
}

/**
 * Allocate a port block for a new app.
 * Returns { start, end } representing 10 consecutive ports.
 * Avoids the launcher's own range (4500-4510) and any already-claimed blocks.
 */
export function allocatePortBlock(existingApps) {
  const LAUNCHER_RANGE = { start: 4500, end: 4510 };
  const BLOCK_SIZE = 10;
  const RANGE_START = 3000;
  const RANGE_END = 9000;

  // Collect all claimed port ranges
  const claimed = new Set();
  for (const app of existingApps) {
    if (app.portBlock) {
      for (let p = app.portBlock.start; p <= app.portBlock.end; p++) claimed.add(p);
    } else if (app.preferredPort) {
      // Legacy single-port apps: reserve their stated range
      const start = app.preferredPort;
      const end = app.maxPort || (start + BLOCK_SIZE - 1);
      for (let p = start; p <= end; p++) claimed.add(p);
    }
  }
  // Reserve launcher range
  for (let p = LAUNCHER_RANGE.start; p <= LAUNCHER_RANGE.end; p++) claimed.add(p);

  // Find first free block
  for (let blockStart = RANGE_START; blockStart + BLOCK_SIZE - 1 <= RANGE_END; blockStart += BLOCK_SIZE) {
    let free = true;
    for (let p = blockStart; p < blockStart + BLOCK_SIZE; p++) {
      if (claimed.has(p)) { free = false; break; }
    }
    if (free) {
      return { start: blockStart, end: blockStart + BLOCK_SIZE - 1 };
    }
  }

  throw new Error('No free port blocks available in range 3000-9000');
}

// ── Internal helpers ──────────────────────────────────────

function readPackageJson(dir) {
  const pkgPath = path.join(dir, 'package.json');
  if (!fs.existsSync(pkgPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  } catch {
    return null;
  }
}

function safeReaddir(dir) {
  try {
    return fs.readdirSync(dir).filter(n => !n.startsWith('.') && n !== 'node_modules');
  } catch {
    return [];
  }
}

/**
 * Detect if subdirectories map to known service roles.
 */
function detectServiceDirs(rootDir, subdirs) {
  const ROLE_PATTERNS = {
    backend:    ['backend', 'server', 'api', 'service', 'services'],
    frontend:   ['frontend', 'client', 'web', 'app', 'ui'],
    middleware:  ['middleware', 'gateway', 'proxy', 'bff'],
    database:   ['db', 'database', 'migrations'],
  };

  const found = [];
  for (const dir of subdirs) {
    const fullPath = path.join(rootDir, dir);
    try {
      if (!fs.statSync(fullPath).isDirectory()) continue;
    } catch { continue; }

    const lower = dir.toLowerCase();
    for (const [role, patterns] of Object.entries(ROLE_PATTERNS)) {
      if (patterns.some(p => lower === p || lower.startsWith(p + '-') || lower.endsWith('-' + p))) {
        // Verify it has something runnable
        const hasPkg = fs.existsSync(path.join(fullPath, 'package.json'));
        const hasDockerfile = fs.existsSync(path.join(fullPath, 'Dockerfile'));
        const hasPython = fs.existsSync(path.join(fullPath, 'manage.py')) ||
                          fs.existsSync(path.join(fullPath, 'app.py')) ||
                          fs.existsSync(path.join(fullPath, 'main.py'));

        if (hasPkg || hasDockerfile || hasPython) {
          found.push({ role, dir });
        }
        break;
      }
    }
  }

  return found;
}

/**
 * Detect the correct start command for a service directory.
 */
function detectStartCommand(dir, pkg, role) {
  const result = { command: 'npm', args: ['run', 'dev'], framework: 'custom' };

  if (!pkg) {
    // Try Python
    if (fs.existsSync(path.join(dir, 'manage.py'))) {
      return { command: 'python', args: ['manage.py', 'runserver'], framework: 'django' };
    }
    if (fs.existsSync(path.join(dir, 'app.py'))) {
      return { command: 'python', args: ['app.py'], framework: 'flask' };
    }
    if (fs.existsSync(path.join(dir, 'main.py'))) {
      return { command: 'python', args: ['main.py'], framework: 'python' };
    }
    return result;
  }

  const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
  const scripts = pkg.scripts || {};

  // Detect framework from dependencies
  for (const [fw, sig] of Object.entries(FRAMEWORK_SIGNATURES)) {
    if (sig.deps && sig.deps.some(d => d in allDeps)) {
      result.framework = fw;
      break;
    }
  }

  // Determine best start command from scripts
  if (role === 'backend' || role === 'fullstack') {
    if (scripts.dev) {
      result.args = ['run', 'dev'];
    } else if (scripts.start) {
      result.command = 'npm';
      result.args = ['start'];
    } else if (scripts.serve) {
      result.args = ['run', 'serve'];
    }
  } else if (role === 'frontend') {
    if (scripts.dev) {
      result.args = ['run', 'dev'];
    } else if (scripts.start) {
      result.command = 'npm';
      result.args = ['start'];
    }
  }

  // Special case: CRA uses npm start, not npm run dev
  if (result.framework === 'cra') {
    result.command = 'npm';
    result.args = ['start'];
  }

  return result;
}

/**
 * Detect Python projects without package.json.
 */
function detectPythonProject(dir) {
  if (fs.existsSync(path.join(dir, 'manage.py'))) {
    return { role: 'fullstack', dir: '.', command: 'python', args: ['manage.py', 'runserver'], framework: 'django', order: 0 };
  }
  if (fs.existsSync(path.join(dir, 'requirements.txt')) || fs.existsSync(path.join(dir, 'pyproject.toml'))) {
    // Look for common entrypoints
    for (const entry of ['app.py', 'main.py', 'server.py', 'run.py']) {
      if (fs.existsSync(path.join(dir, entry))) {
        return { role: 'fullstack', dir: '.', command: 'python', args: [entry], framework: 'python', order: 0 };
      }
    }
    // Check for uvicorn/gunicorn in requirements
    const reqPath = path.join(dir, 'requirements.txt');
    if (fs.existsSync(reqPath)) {
      const reqs = fs.readFileSync(reqPath, 'utf8').toLowerCase();
      if (reqs.includes('uvicorn')) {
        return { role: 'fullstack', dir: '.', command: 'uvicorn', args: ['main:app', '--reload'], framework: 'fastapi', order: 0 };
      }
      if (reqs.includes('gunicorn')) {
        return { role: 'fullstack', dir: '.', command: 'gunicorn', args: ['app:app'], framework: 'flask', order: 0 };
      }
    }
  }
  return null;
}

/**
 * Find the best icon/logo file in a project directory.
 * Returns the relative path from project root, or null.
 */
function findProjectIcon(rootDir) {
  // Directories to search, in priority order
  const searchDirs = [rootDir, ...ICON_DIRS.map(d => path.join(rootDir, d))];

  for (const dir of searchDirs) {
    if (!fs.existsSync(dir)) continue;

    let files;
    try { files = fs.readdirSync(dir); } catch { continue; }

    // Check each pattern in priority order
    for (const pattern of ICON_PATTERNS) {
      for (const file of files) {
        if (pattern.test(file) && isImageFile(file)) {
          return path.relative(rootDir, path.join(dir, file));
        }
      }
    }
  }

  // Fallback: find any prominent image file in root
  try {
    const rootFiles = fs.readdirSync(rootDir);
    for (const file of rootFiles) {
      if (isImageFile(file) && !file.startsWith('.')) {
        const stat = fs.statSync(path.join(rootDir, file));
        // Only consider reasonably sized images (< 5MB, > 1KB)
        if (stat.size > 1024 && stat.size < 5 * 1024 * 1024) {
          return file;
        }
      }
    }
  } catch { /* ignore */ }

  return null;
}

/**
 * Detect services from a justfile-based project (uv/Python monorepo pattern).
 * Scans for pyproject.toml in subdirectories under apps/, services/, etc.
 * Parses justfile for named run targets.
 */
function detectJustfileProject(rootDir) {
  const services = [];
  const justfilePath = path.join(rootDir, 'justfile');
  let justfileContent = '';
  try { justfileContent = fs.readFileSync(justfilePath, 'utf8'); } catch { return services; }

  // Look for sub-app directories (apps/*, services/*)
  const appDirs = ['apps', 'services', 'packages', 'modules'];
  for (const appDir of appDirs) {
    const appsPath = path.join(rootDir, appDir);
    if (!fs.existsSync(appsPath)) continue;

    const subdirs = safeReaddir(appsPath);
    for (const sub of subdirs) {
      const subPath = path.join(appsPath, sub);
      try { if (!fs.statSync(subPath).isDirectory()) continue; } catch { continue; }

      const hasPyproject = fs.existsSync(path.join(subPath, 'pyproject.toml'));
      const hasMainPy = fs.existsSync(path.join(subPath, 'main.py'));
      const hasPackageSwift = fs.existsSync(path.join(subPath, 'Package.swift'));

      if (hasPyproject && hasMainPy) {
        // Check if justfile has a target for this sub-app
        const lower = sub.toLowerCase();
        const hasJustTarget = justfileContent.toLowerCase().includes(`cd ${appDir}/${sub}`) ||
                              justfileContent.toLowerCase().includes(`cd apps/${sub}`);

        // Determine role from directory name
        let role = 'fullstack';
        if (lower.includes('listen') || lower.includes('server') || lower.includes('api')) role = 'backend';
        else if (lower.includes('drive') || lower.includes('steer') || lower.includes('direct')) role = 'middleware';

        // Detect if it's a FastAPI/uvicorn app
        let command = 'uv';
        let args = ['run', 'python', 'main.py'];
        let framework = 'python';

        const mainContent = safeReadFile(path.join(subPath, 'main.py'));
        if (mainContent.includes('FastAPI') || mainContent.includes('fastapi')) {
          framework = 'fastapi';
          // Check if uvicorn is used in pyproject.toml
          const pyproject = safeReadFile(path.join(subPath, 'pyproject.toml'));
          if (pyproject.includes('uvicorn')) {
            command = 'uv';
            args = ['run', 'uvicorn', 'main:app', '--host', '0.0.0.0', '--port', '${PORT:-7600}'];
          }
        }

        services.push({
          role,
          dir: `${appDir}/${sub}`,
          command,
          args,
          framework,
          order: role === 'backend' ? 0 : role === 'middleware' ? 1 : 2,
        });
      } else if (hasPackageSwift) {
        services.push({
          role: 'middleware',
          dir: `${appDir}/${sub}`,
          command: 'swift',
          args: ['run'],
          framework: 'swift',
          order: 1,
        });
      }
    }
  }

  // If no sub-apps found, treat the justfile itself as a single-service project
  if (services.length === 0) {
    // Look for a "listen" or "serve" or "start" target in justfile
    const listenMatch = justfileContent.match(/^(\w+):\s*\n\s+.*(?:uvicorn|python|uv run)/m);
    if (listenMatch) {
      services.push({
        role: 'fullstack',
        dir: '.',
        command: 'just',
        args: [listenMatch[1]],
        framework: 'python',
        order: 0,
      });
    }
  }

  return services;
}

function safeReadFile(filePath) {
  try { return fs.readFileSync(filePath, 'utf8'); } catch { return ''; }
}

function isImageFile(filename) {
  return /\.(png|jpg|jpeg|svg|ico|webp)$/i.test(filename);
}
