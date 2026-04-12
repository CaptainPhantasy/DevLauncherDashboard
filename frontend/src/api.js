const API_BASE = 'http://localhost:4500';

export async function getApps() {
  const response = await fetch(`${API_BASE}/api/apps`);
  if (!response.ok) throw new Error('Failed to fetch apps');
  return response.json();
}

export async function getStatus() {
  const response = await fetch(`${API_BASE}/api/status`);
  if (!response.ok) throw new Error('Failed to fetch status');
  return response.json();
}

export async function startApp(appId) {
  const response = await fetch(`${API_BASE}/api/apps/${appId}/start`, { method: 'POST' });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to start app');
  }
  return response.json();
}

export async function stopApp(appId) {
  const response = await fetch(`${API_BASE}/api/apps/${appId}/stop`, { method: 'POST' });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to stop app');
  }
  return response.json();
}

export async function refreshApps() {
  const response = await fetch(`${API_BASE}/api/refresh`, { method: 'POST' });
  if (!response.ok) throw new Error('Failed to refresh');
  return response.json();
}

export async function openTerminal(appId) {
  const response = await fetch(`${API_BASE}/api/apps/${appId}/open-terminal`, { method: 'POST' });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to open Terminal');
  }
  return response.json();
}

export async function browseDirectory(dirPath) {
  const response = await fetch(`${API_BASE}/api/browse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: dirPath }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to browse directory');
  }
  return response.json();
}

export async function discoverProject(dirPath) {
  const response = await fetch(`${API_BASE}/api/discover`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: dirPath }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to discover project');
  }
  return response.json();
}

export async function importProject(projectData) {
  const response = await fetch(`${API_BASE}/api/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(projectData),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to import project');
  }
  return response.json();
}

export async function cleanupPorts() {
  const response = await fetch(`${API_BASE}/api/cleanup-ports`, { method: 'POST' });
  if (!response.ok) throw new Error('Failed to cleanup ports');
  return response.json();
}

export function getIconUrl(appId) {
  return `${API_BASE}/api/apps/${appId}/icon`;
}
