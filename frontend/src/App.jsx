import { useState, useEffect } from 'react';
import { RefreshCw, Server, Activity } from 'lucide-react';
import { AppCard } from './components/AppCard';
import { getApps, startApp, stopApp } from './api';
import { cn } from './lib/utils';

function App() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingApps, setLoadingApps] = useState({});
  const [error, setError] = useState(null);

  // Fetch apps on mount and set up polling
  useEffect(() => {
    fetchApps();
  }, []);

  const fetchApps = async () => {
    try {
      setError(null);
      const data = await getApps();
      setApps(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async (appId) => {
    setLoadingApps(prev => ({ ...prev, [appId]: true }));
    try {
      await startApp(appId);
      // Wait a moment then refresh to show running status
      setTimeout(() => {
        fetchApps();
        setLoadingApps(prev => ({ ...prev, [appId]: false }));
      }, 2000);
    } catch (err) {
      setError(err.message);
      setLoadingApps(prev => ({ ...prev, [appId]: false }));
    }
  };

  const handleStop = async (appId) => {
    setLoadingApps(prev => ({ ...prev, [appId]: true }));
    try {
      await stopApp(appId);
      // Refresh immediately
      setTimeout(() => {
        fetchApps();
        setLoadingApps(prev => ({ ...prev, [appId]: false }));
      }, 1000);
    } catch (err) {
      setError(err.message);
      setLoadingApps(prev => ({ ...prev, [appId]: false }));
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchApps();
  };

  const runningCount = apps.filter(app => app.isRunning).length;

  if (loading && apps.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-12 w-12 animate-pulse text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center">
                <Server className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Dev Launcher
                </h1>
                <p className="text-sm text-slate-600">
                  {apps.length} apps configured • {runningCount} running
                </p>
              </div>
            </div>

            <button
              onClick={handleRefresh}
              disabled={loading}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
                "bg-slate-100 text-slate-700 hover:bg-slate-200",
                "disabled:opacity-50"
              )}
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200">
            <p className="text-red-800 text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apps.map((app) => (
            <AppCard
              key={app.id}
              app={app}
              onStart={handleStart}
              onStop={handleStop}
              isLoading={loadingApps[app.id]}
            />
          ))}
        </div>

        {apps.length === 0 && !loading && (
          <div className="text-center py-12">
            <Server className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No applications configured
            </h3>
            <p className="text-slate-600">
              Check your backend configuration to add applications.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
