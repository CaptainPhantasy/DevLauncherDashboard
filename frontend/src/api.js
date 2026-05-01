const API_PORT = import.meta.env.VITE_API_PORT || '4500';
const API_ORIGIN = import.meta.env.VITE_API_BASE || `${window.location.protocol}//${window.location.hostname}:${API_PORT}`;

async function readError(response, fallback) {
  const text = await response.text();
  if (!text) return fallback;

  try {
    const parsed = JSON.parse(text);
    if (parsed.error) {
      const details = Array.isArray(parsed.details) ? `: ${parsed.details.join(', ')}` : '';
      return `${parsed.error}${details}`;
    }
    if (parsed.message) return parsed.message;
  } catch {
    // Fall back to the response text below.
  }

  return text || fallback;
}

async function request(path, options = {}, fallback = 'Request failed') {
  let response;

  try {
    response = await fetch(`${API_ORIGIN}${path}`, options);
  } catch (error) {
    throw new Error(`Backend unavailable at ${API_ORIGIN}. Start the backend server and try again. (${error.message})`);
  }

  if (!response.ok) {
    throw new Error(await readError(response, `${fallback} (${response.status})`));
  }

  return response.json();
}

export async function getApps() {
  return request('/api/apps', {}, 'Failed to fetch apps');
}

export async function getStatus() {
  return request('/api/status', {}, 'Failed to fetch status');
}

export async function startApp(appId) {
  return request(`/api/apps/${appId}/start`, { method: 'POST' }, 'Failed to start app');
}

export async function stopApp(appId) {
  return request(`/api/apps/${appId}/stop`, { method: 'POST' }, 'Failed to stop app');
}

export async function refreshApps() {
  return request('/api/config/refresh', { method: 'POST' }, 'Failed to refresh app configuration');
}

export async function openTerminal(appId) {
  return request(`/api/apps/${appId}/open-terminal`, { method: 'POST' }, 'Failed to open Terminal');
}

export async function browseDirectory(dirPath) {
  return request(
    '/api/browse',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: dirPath }),
    },
    'Failed to browse directory'
  );
}

export async function discoverProject(dirPath) {
  return request(
    '/api/discover',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: dirPath }),
    },
    'Failed to discover project'
  );
}

export async function importProject(projectData) {
  return request(
    '/api/import',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(projectData),
    },
    'Failed to import project'
  );
}

export async function cleanupPorts() {
  return request('/api/cleanup-ports', { method: 'POST' }, 'Failed to cleanup ports');
}

export function getIconUrl(appId) {
  return `${API_ORIGIN}/api/apps/${appId}/icon`;
}
