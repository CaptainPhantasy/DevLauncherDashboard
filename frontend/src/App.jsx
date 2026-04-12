import { useState, useEffect, useRef, useCallback } from 'react';
import {
  RefreshCw, Rocket, LayoutDashboard, Search,
  Activity, Play, Square, Trash2, Server,
  ChevronLeft, ChevronRight, Wifi, WifiOff,
  FolderPlus
} from 'lucide-react';
import { AppCard } from './components/AppCard';
import { FolderBrowser } from './components/FolderBrowser';
import { DiscoveryPreview } from './components/DiscoveryPreview';
import { getApps, startApp, stopApp, cleanupPorts, discoverProject } from './api';
import { cn } from './lib/utils';
import { TYPE_ORDER, TYPE_LABELS } from './lib/constants';

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

  useEffect(() => { document.documentElement.classList.add('dark'); }, []);

  const fetchApps = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      setError(null);
      const data = await getApps();
      setApps(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchApps();
    const interval = setInterval(fetchApps, 5000);
    return () => clearInterval(interval);
  }, [fetchApps]);

  const handleStart = async (appId) => {
    setLoadingApps(prev => ({ ...prev, [appId]: true }));
    try {
      await startApp(appId);
      setTimeout(() => { fetchApps(); setLoadingApps(prev => ({ ...prev, [appId]: false })); }, 2000);
    } catch (err) {
      setError(err.message);
      setLoadingApps(prev => ({ ...prev, [appId]: false }));
    }
  };

  const handleStop = async (appId) => {
    setLoadingApps(prev => ({ ...prev, [appId]: true }));
    try {
      await stopApp(appId);
      setTimeout(() => { fetchApps(); setLoadingApps(prev => ({ ...prev, [appId]: false })); }, 1000);
    } catch (err) {
      setError(err.message);
      setLoadingApps(prev => ({ ...prev, [appId]: false }));
    }
  };

  const handleStartAll = () => { apps.filter(a => !a.isRunning).forEach(a => handleStart(a.id)); };
  const handleStopAll = () => { apps.filter(a => a.isRunning).forEach(a => handleStop(a.id)); };

  const handleCleanPorts = async () => {
    try {
      const data = await cleanupPorts();
      setCleanupMsg(`Cleaned ${data.count} port${data.count !== 1 ? 's' : ''}`);
      setTimeout(() => setCleanupMsg(null), 3000);
      fetchApps();
    } catch (err) { setError(err.message); }
  };

  const handleRefresh = () => { setLoading(true); fetchApps(); };

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

  // Filter + group
  const query = search.toLowerCase();
  const filtered = apps.filter(a =>
    a.name.toLowerCase().includes(query) ||
    (a.type || '').toLowerCase().includes(query) ||
    (a.description || '').toLowerCase().includes(query)
  );

  const groups = new Map();
  for (const app of filtered) {
    const type = app.type || 'custom';
    if (!groups.has(type)) groups.set(type, []);
    groups.get(type).push(app);
  }
  const sortedGroups = [...groups.entries()].sort(
    (a, b) => (TYPE_ORDER.indexOf(a[0]) === -1 ? 99 : TYPE_ORDER.indexOf(a[0])) -
              (TYPE_ORDER.indexOf(b[0]) === -1 ? 99 : TYPE_ORDER.indexOf(b[0]))
  );

  const runningCount = apps.filter(a => a.isRunning).length;
  const stoppedCount = apps.length - runningCount;

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
                type="text"
                placeholder="Search apps..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-colors"
              />
            </div>

            <div className="flex items-center gap-2">
              {cleanupMsg && <span className="text-xs text-green-400 font-medium animate-pulse">{cleanupMsg}</span>}
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
            sortedGroups.map(([type, groupApps]) => (
              <div key={type}>
                {sortedGroups.length > 1 && (
                  <div className="flex items-center gap-2 mb-3">
                    <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{TYPE_LABELS[type] || type}</h2>
                    <div className="flex-1 h-px bg-slate-800" />
                    <span className="text-[10px] text-slate-600">{groupApps.length}</span>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {groupApps.map((app) => (
                    <AppCard key={app.id} app={app} onStart={handleStart} onStop={handleStop} isLoading={loadingApps[app.id]} />
                  ))}
                </div>
              </div>
            ))
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
      </main>

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
