import { loadAppConfigurations } from './config-utils.js';

/**
 * Dynamic App Configurations
 * 
 * This loads app configurations from user settings or defaults.
 * Users can customize apps.local.js with their own projects.
 */
export let APPS = [];

// Load configurations asynchronously
loadAppConfigurations().then(apps => {
  APPS = apps;
}).catch(error => {
  console.error('Failed to load app configurations:', error);
  // Fallback to empty array if loading fails
  APPS = [];
});

/**
 * Helper function to refresh app configurations
 */
export async function refreshApps() {
  try {
    APPS = await loadAppConfigurations();
    return APPS;
  } catch (error) {
    console.error('Failed to refresh app configurations:', error);
    return APPS;
  }
}
