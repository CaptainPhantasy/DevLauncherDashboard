import { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import {
  RefreshCw, Rocket, LayoutDashboard, Search,
  Activity, Play, Square, Trash2, Server,
  ChevronLeft, ChevronRight, Wifi, WifiOff,
  FolderPlus, GripVertical, Moon, Sun, Command, HelpCircle,
  Star, Clipboard, ListFilter, Rows3, Bell, X, CheckCircle, AlertTriangle, Info
} from 'lucide-react';
import { AppCard } from './components/AppCard';
import { FolderBrowser } from './components/FolderBrowser';
import { DiscoveryPreview } from './components/DiscoveryPreview';
import { getApps, refreshApps, startApp, stopApp, cleanupPorts, discoverProject } from './api';
import { cn } from './lib/utils';

const APP_ORDER_STORAGE_KEY = 'dev-launcher.appOrder.v1';
const THEME_STORAGE_KEY = 'dev-launcher.theme.v1';
const FAVORITES_STORAGE_KEY = 'dev-launcher.favorites.v1';
const FILTER_STORAGE_KEY = 'dev-launcher.filter.v1';
const SORT_STORAGE_KEY = 'dev-launcher.sort.v1';
const DENSITY_STORAGE_KEY = 'dev-launcher.density.v1';
const ACTIVITY_STORAGE_KEY = 'dev-launcher.activity.v1';
const MAX_ACTIVITY_ITEMS = 12;

function readStoredJson(key, fallback) {
  if (typeof window === 'undefined') return fallback;

  try {
    const stored = window.localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function readStoredString(key, fallback, allowedValues) {
  const value = readStoredJson(key, fallback);
  return allowedValues.includes(value) ? value : fallback;
}

function getInitialTheme() {
  if (typeof window === 'undefined') return 'dark';
  const stored = readStoredString(THEME_STORAGE_KEY, 'system', ['system', 'dark', 'light']);
  if (stored !== 'system') return stored;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function readStoredStringArray(key) {
  const stored = readStoredJson(key, []);
  return Array.isArray(stored) ? stored.filter(item => typeof item === 'string') : [];
}

function readStoredActivity() {
  const stored = readStoredJson(ACTIVITY_STORAGE_KEY, []);
  return Array.isArray(stored) ? stored.filter(item => item && typeof item.message === 'string').slice(0, MAX_ACTIVITY_ITEMS) : [];
}

function sortApps(apps, mode, customOrder) {
  if (mode === 'custom') return orderApps(apps, customOrder);

  return [...apps].sort((a, b) => {
    if (mode === 'name') return a.name.localeCompare(b.name);
    if (mode === 'type') return (a.type || 'custom').localeCompare(b.type || 'custom') || a.name.localeCompare(b.name);
    if (mode === 'status') return Number(b.isRunning) - Number(a.isRunning) || a.name.localeCompare(b.name);
    return 0;
  });
}

function getToastIcon(type) {
  if (type === 'success') return CheckCircle;
  if (type === 'error') return AlertTriangle;
  return Info;
}


function readStoredAppOrder() {
  if (typeof window === 'undefined') return [];

  try {
    const stored = window.localStorage.getItem(APP_ORDER_STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed.filter(id => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function mergeAppOrder(apps, existingOrder) {
  const appIds = new Set(apps.map(app => app.id));
  const keptOrder = existingOrder.filter(id => appIds.has(id));
  const orderedIds = new Set(keptOrder);
  const newIds = apps.map(app => app.id).filter(id => !orderedIds.has(id));

  return [...keptOrder, ...newIds];
}

function orderApps(apps, order) {
  const rank = new Map(order.map((id, index) => [id, index]));

  return [...apps].sort((a, b) => {
    const rankA = rank.has(a.id) ? rank.get(a.id) : Number.MAX_SAFE_INTEGER;
    const rankB = rank.has(b.id) ? rank.get(b.id) : Number.MAX_SAFE_INTEGER;
    return rankA - rankB;
  });
}

function moveAppBefore(order, draggedId, targetId) {
  if (!draggedId || draggedId === targetId) return order;

  const withoutDragged = order.filter(id => id !== draggedId);
  if (!targetId) return [...withoutDragged, draggedId];

  const targetIndex = withoutDragged.indexOf(targetId);
  if (targetIndex === -1) return order;

  const nextOrder = [...withoutDragged];
  nextOrder.splice(targetIndex, 0, draggedId);
  return nextOrder;
}

function sameOrder(left, right) {
  if (left.length !== right.length) return false;
  return left.every((id, index) => id === right[index]);
}

function App() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingApps, setLoadingApps] = useState({});
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [cleanupMsg, setCleanupMsg] = useState(null);
  const [showBrowser, setShowBrowser] = useState(false);
  const [discovery, setDiscovery] = useState(null);
  const [discovering, setDiscovering] = useState(false);
  const fetchingRef = useRef(false);
  const [appOrder, setAppOrder] = useState(readStoredAppOrder);
  const [draggingAppId, setDraggingAppId] = useState(null);
  const [dragOverAppId, setDragOverAppId] = useState(null);
  const appOrderRef = useRef(appOrder);
  const frameRefs = useRef(new Map());
  const frameRectsRef = useRef(new Map());
  const draggingAppIdRef = useRef(null);
  const boardRef = useRef(null);

  const [theme, setTheme] = useState(getInitialTheme);
  const [favoriteIds, setFavoriteIds] = useState(() => readStoredStringArray(FAVORITES_STORAGE_KEY));
  const [activeFilter, setActiveFilter] = useState(() => readStoredString(FILTER_STORAGE_KEY, 'all', ['all', 'favorites', 'running', 'stopped']));
  const [sortMode, setSortMode] = useState(() => readStoredString(SORT_STORAGE_KEY, 'custom', ['custom', 'name', 'type', 'status']));
  const [density, setDensity] = useState(() => readStoredString(DENSITY_STORAGE_KEY, 'comfortable', ['comfortable', 'compact']));
  const [toasts, setToasts] = useState([]);
  const [activityLog, setActivityLog] = useState(readStoredActivity);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const searchInputRef = useRef(null);
  const toastIdRef = useRef(0);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
  }, [theme]);

  useEffect(() => {
    appOrderRef.current = appOrder;
    window.localStorage.setItem(APP_ORDER_STORAGE_KEY, JSON.stringify(appOrder));
  }, [appOrder]);

  useEffect(() => { window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteIds)); }, [favoriteIds]);
  useEffect(() => { window.localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(activeFilter)); }, [activeFilter]);
  useEffect(() => { window.localStorage.setItem(SORT_STORAGE_KEY, JSON.stringify(sortMode)); }, [sortMode]);
  useEffect(() => { window.localStorage.setItem(DENSITY_STORAGE_KEY, JSON.stringify(density)); }, [density]);
  useEffect(() => { window.localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(activityLog)); }, [activityLog]);

  useLayoutEffect(() => {
    const previousRects = frameRectsRef.current;
    if (previousRects.size === 0) return;

    const cleanupTimers = [];

    for (const [appId, element] of frameRefs.current.entries()) {
      const previousRect = previousRects.get(appId);
      if (!previousRect || draggingAppId === appId) continue;

      const nextRect = element.getBoundingClientRect();
      const deltaX = previousRect.left - nextRect.left;
      const deltaY = previousRect.top - nextRect.top;

      if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) continue;

      element.style.transition = 'none';
      element.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

      requestAnimationFrame(() => {
        element.style.transition = 'transform 280ms cubic-bezier(0.22, 1, 0.36, 1)';
        element.style.transform = '';
      });

      cleanupTimers.push(window.setTimeout(() => {
        element.style.transition = '';
        element.style.transform = '';
      }, 320));
    }

    frameRectsRef.current = new Map();

    return () => cleanupTimers.forEach(timer => window.clearTimeout(timer));
  }, [apps, draggingAppId]);

  const addToast = useCallback((message, type = 'info') => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { id, message, type }].slice(-4));
    window.setTimeout(() => setToasts(prev => prev.filter(toast => toast.id !== id)), 4200);
  }, []);

  const addActivity = useCallback((message, type = 'info') => {
    setActivityLog(prev => [{ id: `${Date.now()}-${Math.random()}`, message, type, timestamp: new Date().toISOString() }, ...prev].slice(0, MAX_ACTIVITY_ITEMS));
  }, []);

  const notify = useCallback((message, type = 'info') => {
    addToast(message, type);
    addActivity(message, type);
  }, [addActivity, addToast]);

  const applyAppData = useCallback((data, nextOrder) => {
    setApps(sortApps(data, sortMode, nextOrder));
  }, [sortMode]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const toggleDensity = () => setDensity(prev => prev === 'comfortable' ? 'compact' : 'comfortable');
  const toggleFavorite = (appId) => setFavoriteIds(prev => prev.includes(appId) ? prev.filter(id => id !== appId) : [...prev, appId]);

  const copyAppPath = async (app) => {
    try {
      await navigator.clipboard.writeText(app.path);
      notify(`Copied path for ${app.name}`, 'success');
    } catch (err) {
      setError(`Unable to copy ${app.name} path: ${err.message}`);
      notify(`Unable to copy ${app.name} path`, 'error');
    }
  };


  const fetchApps = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      setError(null);
      const data = await getApps();
      const nextOrder = mergeAppOrder(data, appOrderRef.current);
      appOrderRef.current = nextOrder;
      setAppOrder(nextOrder);
      applyAppData(data, nextOrder);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [applyAppData]);

  useEffect(() => {
    fetchApps();
    const interval = setInterval(fetchApps, 5000);
    return () => clearInterval(interval);
  }, [fetchApps]);

  useEffect(() => {
    setApps(prev => sortApps(prev, sortMode, appOrderRef.current));
  }, [sortMode]);

  const handleStart = async (appId) => {
    setLoadingApps(prev => ({ ...prev, [appId]: true }));
    try {
      await startApp(appId);
      notify(`Starting ${apps.find(app => app.id === appId)?.name || 'app'}`, 'success');
      setTimeout(() => { fetchApps(); setLoadingApps(prev => ({ ...prev, [appId]: false })); }, 2000);
    } catch (err) {
      setError(err.message);
      notify(`Start failed: ${err.message}`, 'error');
      setLoadingApps(prev => ({ ...prev, [appId]: false }));
    }
  };

  const handleStop = async (appId) => {
    setLoadingApps(prev => ({ ...prev, [appId]: true }));
    try {
      await stopApp(appId);
      notify(`Stopping ${apps.find(app => app.id === appId)?.name || 'app'}`, 'success');
      setTimeout(() => { fetchApps(); setLoadingApps(prev => ({ ...prev, [appId]: false })); }, 1000);
    } catch (err) {
      setError(err.message);
      notify(`Stop failed: ${err.message}`, 'error');
      setLoadingApps(prev => ({ ...prev, [appId]: false }));
    }
  };

  const handleStartAll = () => { apps.filter(a => !a.isRunning).forEach(a => handleStart(a.id)); };
  const handleStopAll = () => { apps.filter(a => a.isRunning).forEach(a => handleStop(a.id)); };

  const handleCleanPorts = async () => {
    try {
      const data = await cleanupPorts();
      setCleanupMsg(`Cleaned ${data.count} port${data.count !== 1 ? 's' : ''}`);
      notify(`Cleaned ${data.count} port${data.count !== 1 ? 's' : ''}`, 'success');
      setTimeout(() => setCleanupMsg(null), 3000);
      fetchApps();
    } catch (err) { setError(err.message); notify(`Cleanup failed: ${err.message}`, 'error'); }
  };

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await refreshApps();
      const appsData = data.apps || [];
      const nextOrder = mergeAppOrder(appsData, appOrderRef.current);
      appOrderRef.current = nextOrder;
      setAppOrder(nextOrder);
      applyAppData(appsData, nextOrder);
      setError(null);
      notify(`Refreshed ${appsData.length} apps`, 'success');
    } catch (err) {
      setError(err.message);
      notify(`Refresh failed: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [applyAppData, notify]);

  const captureFrameRects = () => {
    frameRectsRef.current = new Map(
      [...frameRefs.current.entries()].map(([appId, element]) => [appId, element.getBoundingClientRect()])
    );
  };

  const commitAppOrder = useCallback((nextOrder) => {
    captureFrameRects();
    appOrderRef.current = nextOrder;
    setAppOrder(nextOrder);
    setApps(prev => orderApps(prev, nextOrder));
  }, []);

  const handleDragStart = (appId, event) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', appId);
    draggingAppIdRef.current = appId;
    setDraggingAppId(appId);
  };

  const handleDragOver = (targetId, event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDragOverAppId(targetId);
  };

  const getBoardInsertionIndex = (clientX, clientY) => {
    const activeDraggingAppId = draggingAppIdRef.current;
    const visibleFrames = apps
      .filter(app => app.id !== activeDraggingAppId)
      .map(app => ({ appId: app.id, element: frameRefs.current.get(app.id) }))
      .filter(({ element }) => element);

    if (visibleFrames.length === 0) return 0;

    const rows = [];
    for (const frame of visibleFrames) {
      const rect = frame.element.getBoundingClientRect();
      let row = rows.find(candidate => clientY >= candidate.top && clientY <= candidate.bottom);

      if (!row) {
        row = { top: rect.top, bottom: rect.bottom, frames: [] };
        rows.push(row);
      }

      row.top = Math.min(row.top, rect.top);
      row.bottom = Math.max(row.bottom, rect.bottom);
      row.frames.push({ ...frame, rect });
    }

    rows.sort((a, b) => a.top - b.top);
    rows.forEach(row => row.frames.sort((a, b) => a.rect.left - b.rect.left));

    const targetRow = rows.find(row => clientY <= row.bottom) || rows[rows.length - 1];
    const orderedVisibleIds = visibleFrames.map(({ appId }) => appId);

    for (const frame of targetRow.frames) {
      const midpoint = frame.rect.left + frame.rect.width / 2;
      if (clientX < midpoint) {
        return orderedVisibleIds.indexOf(frame.appId);
      }
    }

    const lastFrameInRow = targetRow.frames[targetRow.frames.length - 1];
    return orderedVisibleIds.indexOf(lastFrameInRow.appId) + 1;
  };

  const moveAppToIndex = (draggedId, insertionIndex) => {
    if (!draggedId) return;

    const withoutDragged = appOrderRef.current.filter(id => id !== draggedId);
    const boundedIndex = Math.max(0, Math.min(insertionIndex, withoutDragged.length));
    const nextOrder = [...withoutDragged];
    nextOrder.splice(boundedIndex, 0, draggedId);

    if (!sameOrder(nextOrder, appOrderRef.current)) {
      commitAppOrder(nextOrder);
    }
  };

  const handleBoardDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    const activeDraggingAppId = draggingAppIdRef.current;
    if (!activeDraggingAppId) return;

    moveAppToIndex(activeDraggingAppId, getBoardInsertionIndex(event.clientX, event.clientY));
  };

  const handleBoardDrop = (event) => {
    event.preventDefault();
    const draggedId = event.dataTransfer.getData('text/plain') || draggingAppIdRef.current;

    moveAppToIndex(draggedId, getBoardInsertionIndex(event.clientX, event.clientY));
    draggingAppIdRef.current = null;
    setDraggingAppId(null);
    setDragOverAppId(null);
  };

  const handleDragEnter = (targetId, event) => {
    event.preventDefault();

    const activeDraggingAppId = draggingAppIdRef.current;
    if (!activeDraggingAppId || activeDraggingAppId === targetId) return;

    const nextOrder = moveAppBefore(appOrderRef.current, activeDraggingAppId, targetId);
    if (nextOrder !== appOrderRef.current) {
      commitAppOrder(nextOrder);
    }

    setDragOverAppId(targetId);
  };

  const handleDrop = (targetId, event) => {
    event.preventDefault();
    const draggedId = event.dataTransfer.getData('text/plain') || draggingAppIdRef.current;
    const nextOrder = moveAppBefore(appOrderRef.current, draggedId, targetId);

    commitAppOrder(nextOrder);
    draggingAppIdRef.current = null;
    setDraggingAppId(null);
    setDragOverAppId(null);
  };

  const handleDragEnd = () => {
    draggingAppIdRef.current = null;
    setDraggingAppId(null);
    setDragOverAppId(null);
  };

  const moveAppByKeyboard = (appId, direction) => {
    const currentIndex = appOrderRef.current.indexOf(appId);
    const targetIndex = currentIndex + direction;

    if (currentIndex === -1 || targetIndex < 0 || targetIndex >= appOrderRef.current.length) return;

    const nextOrder = [...appOrderRef.current];
    const [movedId] = nextOrder.splice(currentIndex, 1);
    nextOrder.splice(targetIndex, 0, movedId);
    commitAppOrder(nextOrder);
  };

  const handleDragHandleKeyDown = (appId, event) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      moveAppByKeyboard(appId, -1);
    }

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      moveAppByKeyboard(appId, 1);
    }
  };

  // Folder browser → discover
  const handleFolderSelect = async (folderPath) => {
    setShowBrowser(false);
    setDiscovering(true);
    try {
      const result = await discoverProject(folderPath);
      setDiscovery(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setDiscovering(false);
    }
  };

  const handleImported = () => {
    setDiscovery(null);
    fetchApps();
  };

  // Filter; ordering is controlled by custom kanban order or selected sort mode.
  const query = search.toLowerCase();
  const favoriteSet = new Set(favoriteIds);
  const searchedApps = apps.filter(a =>
    a.name.toLowerCase().includes(query) ||
    (a.type || '').toLowerCase().includes(query) ||
    (a.description || '').toLowerCase().includes(query)
  );
  const filtered = searchedApps.filter(app => {
    if (activeFilter === 'favorites') return favoriteSet.has(app.id);
    if (activeFilter === 'running') return app.isRunning;
    if (activeFilter === 'stopped') return !app.isRunning;
    return true;
  });

  const runningCount = apps.filter(a => a.isRunning).length;
  const stoppedCount = apps.length - runningCount;
  const visibleRunningCount = filtered.filter(a => a.isRunning).length;
  const activeFilterLabel = activeFilter === 'all' ? 'All apps' : activeFilter[0].toUpperCase() + activeFilter.slice(1);
  const commandItems = [
    { id: 'refresh', label: 'Refresh apps', hint: 'Reload configuration', run: handleRefresh },
    { id: 'search', label: 'Focus search', hint: 'Jump to dashboard search', run: () => searchInputRef.current?.focus() },
    { id: 'theme', label: `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`, hint: 'Toggle appearance', run: toggleTheme },
    { id: 'density', label: `Use ${density === 'comfortable' ? 'compact' : 'comfortable'} density`, hint: 'Toggle card spacing', run: toggleDensity },
    { id: 'favorites-filter', label: 'Show favorites', hint: 'Filter pinned apps', run: () => setActiveFilter('favorites') },
    { id: 'running-filter', label: 'Show running apps', hint: 'Filter active apps', run: () => setActiveFilter('running') },
    { id: 'all-filter', label: 'Show all apps', hint: 'Clear filters', run: () => setActiveFilter('all') },
    ...apps.slice(0, 20).flatMap(app => [
      { id: `start-${app.id}`, label: `Start ${app.name}`, hint: app.type || 'app', run: () => handleStart(app.id) },
      { id: `terminal-${app.id}`, label: `Copy ${app.name} path`, hint: app.path, run: () => copyAppPath(app) },
    ]),
  ].filter(item => item.label.toLowerCase().includes(commandQuery.toLowerCase()) || item.hint.toLowerCase().includes(commandQuery.toLowerCase())).slice(0, 12);

  useEffect(() => {
    const onKeyDown = (event) => {
      const target = event.target;
      const isTyping = target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }

      if (event.key === '?' || event.key === 'F1') {
        event.preventDefault();
        setShortcutsOpen(true);
        return;
      }

      if (event.key === 'Escape') {
        setCommandPaletteOpen(false);
        setShortcutsOpen(false);
        setError(null);
        return;
      }

      if (!isTyping && event.key === '/') {
        event.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (!isTyping && event.key.toLowerCase() === 'r') {
        event.preventDefault();
        handleRefresh();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleRefresh]);


  if (loading && apps.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-10 w-10 animate-pulse text-blue-500 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading platform...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-slate-100 flex">
      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-full bg-slate-900/80 border-r border-slate-800 flex flex-col transition-all duration-200 z-20",
        sidebarOpen ? "w-56" : "w-16"
      )}>
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Rocket className="h-5 w-5 text-white" />
            </div>
            {sidebarOpen && (
              <div className="min-w-0">
                <h1 className="text-base font-bold text-slate-100 truncate">Dev Launcher</h1>
                <p className="text-[10px] text-slate-500 font-mono">v2.0.0</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium bg-slate-800 text-blue-400">
            <LayoutDashboard className="h-4 w-4 flex-shrink-0" />
            {sidebarOpen && <span>Dashboard</span>}
          </button>
          <button
            onClick={() => setShowBrowser(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 transition-colors"
          >
            <FolderPlus className="h-4 w-4 flex-shrink-0" />
            {sidebarOpen && <span>Import Project</span>}
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            {runningCount > 0 ? (
              <Wifi className="h-3.5 w-3.5 text-green-400" />
            ) : (
              <WifiOff className="h-3.5 w-3.5 text-slate-600" />
            )}
            {sidebarOpen && (
              <span className="text-xs text-slate-500">
                {runningCount > 0 ? `${runningCount} active` : 'All stopped'}
              </span>
            )}
          </div>
          {sidebarOpen && (
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-slate-800/60 rounded-md px-2 py-1.5">
                <div className="text-lg font-bold text-slate-100">{apps.length}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Apps</div>
              </div>
              <div className="bg-slate-800/60 rounded-md px-2 py-1.5">
                <div className={cn("text-lg font-bold", runningCount > 0 ? "text-green-400" : "text-slate-500")}>{runningCount}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Live</div>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => setSidebarOpen(prev => !prev)}
          className="p-3 border-t border-slate-800 text-slate-500 hover:text-slate-300 transition-colors flex items-center justify-center"
        >
          {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </aside>

      {/* Main */}
      <main className={cn("flex-1 transition-all duration-200", sidebarOpen ? "ml-56" : "ml-16")}>
        <header className="sticky top-0 z-10 bg-[#0a0f1a]/90 backdrop-blur-md border-b border-slate-800/60">
          <div className="px-6 py-3 flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search apps..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-colors"
              />
            </div>

            <div className="flex items-center gap-2">
              {cleanupMsg && <span className="text-xs text-green-400 font-medium animate-pulse">{cleanupMsg}</span>}
              <button onClick={() => setCommandPaletteOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600/15 text-blue-300 hover:bg-blue-600/25 transition-colors" title="Command palette (⌘K)">
                <Command className="h-3 w-3" /> Commands
              </button>
              <button onClick={toggleTheme} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-slate-300 transition-colors" title="Toggle theme">
                {theme === 'dark' ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />} {theme === 'dark' ? 'Light' : 'Dark'}
              </button>
              <button onClick={() => setShortcutsOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-slate-300 transition-colors" title="Keyboard shortcuts (?)">
                <HelpCircle className="h-3 w-3" /> Help
              </button>
              <button onClick={handleStartAll} disabled={stoppedCount === 0} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-600/20 text-green-400 hover:bg-green-600/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <Play className="h-3 w-3" /> Start All
              </button>
              <button onClick={handleStopAll} disabled={runningCount === 0} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600/20 text-red-400 hover:bg-red-600/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <Square className="h-3 w-3" /> Stop All
              </button>
              <button onClick={handleCleanPorts} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-slate-300 transition-colors" title="Kill all processes on common dev ports">
                <Trash2 className="h-3 w-3" /> Clean Ports
              </button>
              <button onClick={handleRefresh} disabled={loading} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-slate-300 disabled:opacity-50 transition-colors">
                <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} /> Refresh
              </button>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-red-900/30 border border-red-800/50 flex items-center justify-between">
              <p className="text-red-300 text-sm">{error}</p>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300 text-xs ml-4">Dismiss</button>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-800/60 bg-slate-900/50 p-3" data-testid="dashboard-toolbar">
            <div className="flex items-center gap-2 text-xs text-slate-500 mr-1"><ListFilter className="h-3.5 w-3.5" /> Filter</div>
            {[['all', 'All'], ['favorites', 'Favorites'], ['running', 'Running'], ['stopped', 'Stopped']].map(([value, label]) => (
              <button key={value} onClick={() => setActiveFilter(value)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors', activeFilter === value ? 'bg-blue-600/25 text-blue-200' : 'bg-slate-800/60 text-slate-400 hover:text-slate-200')}>{label}</button>
            ))}
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <select value={sortMode} onChange={(event) => setSortMode(event.target.value)} className="px-3 py-1.5 rounded-lg bg-slate-800/70 border border-slate-700/60 text-xs text-slate-300 focus:outline-none focus:border-blue-500/50" aria-label="Sort apps">
                <option value="custom">Custom order</option>
                <option value="name">Name</option>
                <option value="type">Type</option>
                <option value="status">Status</option>
              </select>
              <button onClick={toggleDensity} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/60 text-slate-400 hover:text-slate-200 transition-colors" title="Toggle density">
                <Rows3 className="h-3 w-3" /> {density === 'comfortable' ? 'Compact' : 'Comfort'}
              </button>
            </div>
          </div>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Apps</p>
                  <p className="text-2xl font-bold text-slate-100">{apps.length}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-blue-600/10 flex items-center justify-center">
                  <Server className="h-5 w-5 text-blue-400" />
                </div>
              </div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Running</p>
                  <p className={cn("text-2xl font-bold", runningCount > 0 ? "text-green-400" : "text-slate-500")}>{runningCount}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-green-600/10 flex items-center justify-center">
                  <Activity className={cn("h-5 w-5", runningCount > 0 ? "text-green-400" : "text-slate-600")} />
                </div>
              </div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Stopped</p>
                  <p className="text-2xl font-bold text-slate-400">{stoppedCount}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-slate-700/30 flex items-center justify-center">
                  <Square className="h-5 w-5 text-slate-500" />
                </div>
              </div>
            </div>
          </div>

          {/* App grid */}
          {filtered.length > 0 ? (
            <div
              className={cn('kanban-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-6', density === 'compact' ? 'gap-2' : 'gap-4')}
              data-testid="kanban-board"
              ref={boardRef}
              onDragOver={handleBoardDragOver}
              onDrop={handleBoardDrop}
            >
              {filtered.map((app) => {
                const isDragging = draggingAppId === app.id;
                const isDropTarget = dragOverAppId === app.id && draggingAppId !== app.id;

                return (
                  <div
                    key={app.id}
                    ref={(element) => {
                      if (element) {
                        frameRefs.current.set(app.id, element);
                      } else {
                        frameRefs.current.delete(app.id);
                      }
                    }}
                    draggable
                    onDragStart={(event) => handleDragStart(app.id, event)}
                    onDragEnter={(event) => handleDragEnter(app.id, event)}
                    onDragOver={(event) => handleDragOver(app.id, event)}
                    onDrop={(event) => handleDrop(app.id, event)}
                    onDragEnd={handleDragEnd}
                    onDragLeave={() => dragOverAppId === app.id && setDragOverAppId(null)}
                    data-testid={`kanban-frame-${app.id}`}
                    className={cn(
                      'kanban-frame group',
                      isDragging && 'kanban-frame--dragging',
                      isDropTarget && 'kanban-frame--drop-before'
                    )}
                  >
                    <button
                      type="button"
                      draggable
                      data-drag-handle
                      data-testid={`kanban-drag-handle-${app.id}`}
                      aria-label={`Move ${app.name} frame. Use arrow keys or drag to reorder.`}
                      onKeyDown={(event) => handleDragHandleKeyDown(app.id, event)}
                      className="kanban-drag-handle"
                      title="Drag to reorder"
                    >
                      <GripVertical className="h-4 w-4" />
                    </button>
                    <AppCard
                      app={app}
                      onStart={handleStart}
                      onStop={handleStop}
                      onError={setError}
                      onCopyPath={copyAppPath}
                      onToggleFavorite={toggleFavorite}
                      isFavorite={favoriteSet.has(app.id)}
                      density={density}
                      isLoading={loadingApps[app.id]}
                    />
                  </div>
                );
              })}
              <div
                aria-hidden="true"
                data-testid="kanban-drop-end"
                onDragEnter={(event) => handleDragEnter(null, event)}
                onDragOver={(event) => handleDragOver(null, event)}
                onDrop={(event) => handleDrop(null, event)}
                className={cn(
                  'kanban-end-drop-target',
                  dragOverAppId === null && draggingAppId && 'kanban-end-drop-target--active'
                )}
              />
            </div>
          ) : apps.length === 0 ? (
            <div className="text-center py-16">
              <FolderPlus className="h-12 w-12 text-slate-700 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-400 mb-1">No applications yet</h3>
              <p className="text-sm text-slate-600 mb-4">Import a project folder to get started.</p>
              <button onClick={() => setShowBrowser(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 transition-colors">
                <FolderPlus className="h-4 w-4" /> Import Project
              </button>
            </div>
          ) : (
            <div className="text-center py-16">
              <Search className="h-12 w-12 text-slate-700 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-400 mb-1">No matching apps</h3>
              <p className="text-sm text-slate-600">Try a different search term.</p>
            </div>
          )}
        </div>
        <footer className="sticky bottom-0 z-10 border-t border-slate-800/70 bg-[#0a0f1a]/90 px-6 py-2 text-xs text-slate-500 backdrop-blur-md" data-testid="status-bar">
          <div className="flex flex-wrap items-center gap-3">
            <span>{activeFilterLabel}: {filtered.length}/{apps.length} shown</span>
            <span>{visibleRunningCount} visible running</span>
            <span>Sort: {sortMode}</span>
            <span>Density: {density}</span>
            <span className="ml-auto">Shortcuts: <kbd className="rounded bg-slate-800 px-1.5 py-0.5">⌘K</kbd> palette · <kbd className="rounded bg-slate-800 px-1.5 py-0.5">?</kbd> help · <kbd className="rounded bg-slate-800 px-1.5 py-0.5">/</kbd> search</span>
          </div>
        </footer>
      </main>

      <div className="fixed right-4 top-4 z-[70] space-y-2" aria-live="polite" aria-atomic="true" data-testid="toast-region">
        {toasts.map((toast) => {
          const ToastIcon = getToastIcon(toast.type);
          return (
            <div key={toast.id} className={cn('flex items-center gap-2 rounded-xl border px-4 py-3 text-sm shadow-2xl backdrop-blur-md', toast.type === 'error' ? 'border-red-700/60 bg-red-950/80 text-red-100' : toast.type === 'success' ? 'border-green-700/60 bg-green-950/80 text-green-100' : 'border-slate-700/70 bg-slate-900/90 text-slate-100')}>
              <ToastIcon className="h-4 w-4" />
              <span>{toast.message}</span>
            </div>
          );
        })}
      </div>

      {activityLog.length > 0 && (
        <aside className="fixed bottom-12 right-4 z-20 hidden w-80 rounded-xl border border-slate-800/70 bg-slate-950/90 p-3 shadow-2xl backdrop-blur-md xl:block" data-testid="activity-log">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500"><Bell className="h-3.5 w-3.5" /> Activity</div>
          <div className="space-y-2">
            {activityLog.slice(0, 4).map(item => (
              <div key={item.id} className="rounded-lg bg-slate-900/70 px-3 py-2 text-xs text-slate-400">{item.message}</div>
            ))}
          </div>
        </aside>
      )}

      {commandPaletteOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/60 px-4 pt-24 backdrop-blur-sm" onMouseDown={() => setCommandPaletteOpen(false)} data-testid="command-palette">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-slate-800 px-4 py-3">
              <Command className="h-4 w-4 text-blue-300" />
              <input autoFocus value={commandQuery} onChange={(event) => setCommandQuery(event.target.value)} placeholder="Run a command or jump to an app..." className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 outline-none" />
              <button onClick={() => setCommandPaletteOpen(false)} className="text-slate-500 hover:text-slate-200"><X className="h-4 w-4" /></button>
            </div>
            <div className="max-h-96 overflow-y-auto p-2">
              {commandItems.length > 0 ? commandItems.map(item => (
                <button key={item.id} onClick={() => { item.run(); setCommandPaletteOpen(false); setCommandQuery(''); }} className="w-full rounded-xl px-3 py-2 text-left hover:bg-slate-800/70">
                  <div className="text-sm font-medium text-slate-100">{item.label}</div>
                  <div className="truncate text-xs text-slate-500">{item.hint}</div>
                </button>
              )) : <div className="px-3 py-8 text-center text-sm text-slate-500">No commands match.</div>}
            </div>
          </div>
        </div>
      )}

      {shortcutsOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm" onMouseDown={() => setShortcutsOpen(false)} data-testid="shortcut-help">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-950 p-5 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold text-slate-100">Keyboard shortcuts</h2><button onClick={() => setShortcutsOpen(false)} className="text-slate-500 hover:text-slate-200"><X className="h-4 w-4" /></button></div>
            <div className="grid gap-2 text-sm text-slate-300">
              {[['⌘/Ctrl K', 'Open command palette'], ['/', 'Focus search'], ['R', 'Refresh apps'], ['?', 'Open shortcuts'], ['Esc', 'Close dialogs and clear errors'], ['Arrow keys on drag handle', 'Reorder cards']].map(([keys, label]) => (
                <div key={keys} className="flex items-center justify-between rounded-lg bg-slate-900/70 px-3 py-2"><span>{label}</span><kbd className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-400">{keys}</kbd></div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Modals */}
      {showBrowser && (
        <FolderBrowser onSelect={handleFolderSelect} onClose={() => setShowBrowser(false)} />
      )}
      {discovering && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="text-center">
            <Activity className="h-8 w-8 animate-spin text-blue-400 mx-auto mb-3" />
            <p className="text-slate-300 text-sm">Scanning project structure...</p>
          </div>
        </div>
      )}
      {discovery && (
        <DiscoveryPreview discovery={discovery} onImported={handleImported} onClose={() => setDiscovery(null)} />
      )}
    </div>
  );
}

export default App;
