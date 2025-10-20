#!/usr/bin/env node

import { setupUserConfiguration } from '../backend/config-utils.js';
import { fileURLToPath } from 'url';
import path from 'path';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('🔧 Dev Launcher Setup Tool');
  console.log('=========================\n');
  
  try {
    await setupUserConfiguration();
    console.log('✅ Setup completed successfully!\n');
    
    console.log('Next steps:');
    console.log('1. Edit apps.local.js with your project paths');
    console.log('2. Run: npm start or ./start.sh');
    console.log('3. Open http://localhost:4501 in your browser');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

main();
