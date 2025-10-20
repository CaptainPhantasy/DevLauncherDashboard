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
  const response = await fetch(`${API_BASE}/api/apps/${appId}/start`, {
    method: 'POST'
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to start app');
  }
  return response.json();
}

export async function stopApp(appId) {
  const response = await fetch(`${API_BASE}/api/apps/${appId}/stop`, {
    method: 'POST'
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to stop app');
  }
  return response.json();
}

export async function refreshApps() {
  const response = await fetch(`${API_BASE}/api/refresh`, {
    method: 'POST'
  });
  if (!response.ok) throw new Error('Failed to refresh');
  return response.json();
}

export async function openTerminal(appId) {
  const response = await fetch(`${API_BASE}/api/apps/${appId}/open-terminal`, {
    method: 'POST'
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to open Terminal');
  }
  return response.json();
}
