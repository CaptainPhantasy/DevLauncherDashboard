import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load environment variables from .env file
 */
export function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  const env = {};
  
  if (fs.existsSync(envPath)) {
    const envLines = fs.readFileSync(envPath, 'utf8').split('\n');
    
    envLines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          env[key] = valueParts.join('=').replace(/^["']|["']$/g, '');
        }
      }
    });
  }
  
  return env;
}

/**
 * Get environment variable with fallback
 */
export function getEnv(key, defaultValue = null) {
  const env = loadEnv();
  return env[key] || process.env[key] || defaultValue;
}

/**
 * Resolve a path that may contain ~ or environment variables
 */
export function resolvePath(inputPath) {
  if (!inputPath) return inputPath;
  
  const env = loadEnv();
  let resolved = inputPath;
  
  // Replace environment variables
  Object.keys(env).forEach(key => {
    const pattern = new RegExp(`\\$\\{${key}\\}`, 'g');
    resolved = resolved.replace(pattern, env[key]);
    const pattern2 = new RegExp(`\\$${key}`, 'g');
    resolved = resolved.replace(pattern2, env[key]);
  });
  
  // Handle ~ for home directory
  if (resolved.startsWith('~')) {
    return path.join(os.homedir(), resolved.substring(1));
  }
  
  // Handle relative paths - resolve from current script directory
  if (!path.isAbsolute(resolved)) {
    return path.resolve(__dirname, '..', resolved);
  }
  
  return resolved;
}

/**
 * Load and validate app configurations from multiple sources
 */
export async function loadAppConfigurations() {
  const configSources = [];
  
  // 1. Try to load user's local configuration
  const userConfigPath = path.join(__dirname, 'apps.local.js');
  if (fs.existsSync(userConfigPath)) {
    try {
      const userModule = await import(userConfigPath);
      if (userModule.USER_APPS && Array.isArray(userModule.USER_APPS)) {
        configSources.push({
          name: 'user',
          apps: userModule.USER_APPS
        });
        console.log(`✓ Loaded ${userModule.USER_APPS.length} apps from user configuration`);
      }
    } catch (error) {
      console.error('Error loading user configuration:', error.message);
    }
  }
  
  // 2. Load fallback defaults if no user config
  if (configSources.length === 0) {
    const defaultConfigPath = path.join(__dirname, 'apps.defaults.js');
    if (fs.existsSync(defaultConfigPath)) {
      try {
        const defaultModule = await import(defaultConfigPath);
        if (defaultModule.DEFAULT_APPS && Array.isArray(defaultModule.DEFAULT_APPS)) {
          configSources.push({
            name: 'defaults',
            apps: defaultModule.DEFAULT_APPS
          });
          console.log(`⚠️ No user configuration found, loaded ${defaultModule.DEFAULT_APPS.length} default apps`);
        }
      } catch (error) {
        console.error('Error loading default configuration:', error.message);
      }
    }
  }
  
  // Merge all configurations (user apps override defaults by ID)
  const mergedApps = new Map();
  
  configSources.forEach(source => {
    source.apps.forEach(app => {
      // Validate required fields
      if (!app.id || !app.name || !app.path || !app.command) {
        console.warn(`⚠️ Invalid app configuration (missing required fields):`, app.name || app.id || 'unknown');
        return;
      }
      
      // Resolve the path and create a clean app object
      const resolvedApp = {
        description: '',
        preferredPort: null,
        maxPort: null,
        autoOpenBrowser: true,
        type: 'custom',
        ...app,
        path: resolvePath(app.path)
      };
      
      // Validate directory exists (warn but don't fail)
      if (!fs.existsSync(resolvedApp.path)) {
        console.warn(`⚠️ Directory does not exist: ${resolvedApp.path}`);
      }
      
      mergedApps.set(app.id, resolvedApp);
    });
  });
  
  const apps = Array.from(mergedApps.values());
  console.log(`📱 Total apps configured: ${apps.length}`);
  
  return apps;
}

/**
 * Validate app configuration
 */
export function validateApp(app) {
  const requiredFields = ['id', 'name', 'path', 'command', 'args'];
  const missing = requiredFields.filter(field => !app[field]);
  
  if (missing.length > 0) {
    return {
      valid: false,
      errors: [`Missing required fields: ${missing.join(', ')}`]
    };
  }
  
  const warnings = [];
  
  // Check if path exists
  if (!fs.existsSync(app.path)) {
    warnings.push(`Directory does not exist: ${app.path}`);
  }
  
  // Check port configuration
  if (app.preferredPort && app.maxPort) {
    const prefPort = parseInt(app.preferredPort);
    const maxPort = parseInt(app.maxPort);
    
    if (prefPort < 1024 || prefPort > 65535) {
      warnings.push(`Preferred port ${prefPort} is outside valid range (1024-65535)`);
    }
    
    if (maxPort < prefPort) {
      warnings.push(`Max port ${maxPort} is less than preferred port ${prefPort}`);
    }
  }
  
  if (app.autoOpenBrowser === false && app.preferredPort) {
    warnings.push(`App has port configured but autoOpenBrowser is false`);
  }
  
  return {
    valid: missing.length === 0,
    warnings,
    errors: []
  };
}

/**
 * Create a simple user configuration file from template
 */
export function createUserConfig(targetPath = null) {
  const configPath = targetPath || path.join(__dirname, 'apps.local.js');
  const templatePath = path.join(__dirname, 'apps-template.js');
  
  if (fs.existsSync(configPath)) {
    console.log(`Configuration file already exists: ${configPath}`);
    return false;
  }
  
  try {
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    fs.writeFileSync(configPath, templateContent);
    console.log(`✅ Created configuration file: ${configPath}`);
    return true;
  } catch (error) {
    console.error(`Error creating configuration file:`, error.message);
    return false;
  }
}

/**
 * Setup utility for first-time users
 */
export async function setupUserConfiguration() {
  console.log('🚀 Setting up Dev Launcher configuration...\n');
  
  // 1. Create user config if it doesn't exist
  if (!fs.existsSync(path.join(__dirname, 'apps.local.js'))) {
    console.log('📝 Creating user configuration file...');
    if (createUserConfig()) {
      console.log('✅ apps.local.js created - you can now add your projects!\n');
    }
  } else {
    console.log('✅ Configuration file already exists\n');
  }
  
  // 2. Load current configurations
  try {
    const apps = await loadAppConfigurations();
    
    console.log(`📱 Currently configured apps: ${apps.length}`);
    apps.forEach((app, index) => {
      console.log(`  ${index + 1}. ${app.name} - ${app.type || 'custom'} (${app.path})`);
    });
    
    console.log('\n💡 To add your own apps:');
    console.log('   1. Edit apps.local.js')
    console.log('   2. Add your project configurations')
    console.log('   3. Restart the Dev Launcher server\n');
    
  } catch (error) {
    console.error('❌ Failed to load configurations:', error.message);
  }
  
  // 3. Environment setup check
  const devRoot = getEnv('DEV_ROOT', '~/projects');
  console.log(`📁 Development root: ${devRoot}`);
  console.log(`🌐 Browser: ${getEnv('BROWSER_APP', 'Google Chrome')}`);
  console.log(`💻 Terminal: ${getEnv('TERMINAL_APP', 'Terminal.app')}\n`);
  
  return true;
}
