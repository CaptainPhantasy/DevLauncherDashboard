import { loadAppConfigurations } from './config-utils.js';

export let APPS = await loadAppConfigurations();

export async function refreshApps() {
  APPS = await loadAppConfigurations();
  return APPS;
}

export function addApp(appConfig) {
  const existing = APPS.findIndex(a => a.id === appConfig.id);
  if (existing !== -1) {
    APPS[existing] = appConfig;
  } else {
    APPS.push(appConfig);
  }
}
