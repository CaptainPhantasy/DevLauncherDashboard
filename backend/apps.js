import { loadAppConfigurations } from './config-utils.js';

export let APPS = [];

loadAppConfigurations().then(apps => {
  APPS = apps;
}).catch(error => {
  console.error('Failed to load app configurations:', error);
  APPS = [];
});

export async function refreshApps() {
  try {
    APPS = await loadAppConfigurations();
    return APPS;
  } catch (error) {
    console.error('Failed to refresh app configurations:', error);
    return APPS;
  }
}

/**
 * Add a new app to the runtime array (for import).
 */
export function addApp(appConfig) {
  // Prevent duplicates
  const existing = APPS.findIndex(a => a.id === appConfig.id);
  if (existing !== -1) {
    APPS[existing] = appConfig;
  } else {
    APPS.push(appConfig);
  }
}
