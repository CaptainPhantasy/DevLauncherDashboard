import { useState, useEffect } from 'react';
import {
  Folder, FolderOpen, ChevronRight, ArrowUp, X,
  Loader2, Scan, Home
} from 'lucide-react';
import { cn } from '../lib/utils';
import { browseDirectory } from '../api';

const DEFAULT_START = '/Volumes/Storage/Development';

export function FolderBrowser({ onSelect, onClose }) {
  const [currentPath, setCurrentPath] = useState(DEFAULT_START);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDirectory(currentPath);
  }, [currentPath]);

  async function loadDirectory(dirPath) {
    setLoading(true);
    setError(null);
    try {
      const result = await browseDirectory(dirPath);
      setEntries(result.entries);
      setCurrentPath(result.path);
    } catch (err) {
      setError(err.message);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }

  function navigateTo(dirPath) {
    setCurrentPath(dirPath);
  }

  function navigateUp() {
    const parent = currentPath.split('/').slice(0, -1).join('/') || '/';
    setCurrentPath(parent);
  }

  // Breadcrumb segments
  const segments = currentPath.split('/').filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-slate-100">Select Project Folder</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Breadcrumb */}
        <div className="px-5 py-2 border-b border-slate-800/60 flex items-center gap-1 text-sm overflow-x-auto">
          <button onClick={() => setCurrentPath('/')} className="text-slate-500 hover:text-blue-400 transition-colors flex-shrink-0">
            <Home className="h-3.5 w-3.5" />
          </button>
          {segments.map((seg, i) => (
            <span key={i} className="flex items-center gap-1 flex-shrink-0">
              <ChevronRight className="h-3 w-3 text-slate-600" />
              <button
                onClick={() => navigateTo('/' + segments.slice(0, i + 1).join('/'))}
                className={cn(
                  "hover:text-blue-400 transition-colors truncate max-w-[120px]",
                  i === segments.length - 1 ? "text-slate-200 font-medium" : "text-slate-500"
                )}
              >
                {seg}
              </button>
            </span>
          ))}
        </div>

        {/* Actions bar */}
        <div className="px-5 py-2 border-b border-slate-800/60 flex items-center gap-2">
          <button
            onClick={navigateUp}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowUp className="h-3 w-3" />
            Up
          </button>
          <div className="flex-1" />
          <button
            onClick={() => onSelect(currentPath)}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors"
          >
            <Scan className="h-3 w-3" />
            Scan This Folder
          </button>
        </div>

        {/* Directory listing */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
            </div>
          ) : error ? (
            <div className="px-5 py-8 text-center">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-slate-500 text-sm">No folders found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/40">
              {entries.map((entry) => (
                <button
                  key={entry.path}
                  onClick={() => entry.isProject ? onSelect(entry.path) : navigateTo(entry.path)}
                  onDoubleClick={() => navigateTo(entry.path)}
                  className="w-full flex items-center gap-3 px-5 py-2.5 text-left hover:bg-slate-800/50 transition-colors group"
                >
                  {entry.isProject ? (
                    <FolderOpen className="h-4 w-4 text-blue-400 flex-shrink-0" />
                  ) : (
                    <Folder className="h-4 w-4 text-slate-500 flex-shrink-0" />
                  )}
                  <span className={cn(
                    "text-sm truncate",
                    entry.isProject ? "text-slate-100 font-medium" : "text-slate-400"
                  )}>
                    {entry.name}
                  </span>
                  {entry.isProject && (
                    <span className="ml-auto flex items-center gap-1.5 text-[10px] text-blue-400/70 uppercase tracking-wider font-medium flex-shrink-0">
                      <Scan className="h-3 w-3" />
                      Project
                    </span>
                  )}
                  {!entry.isProject && (
                    <ChevronRight className="ml-auto h-3.5 w-3.5 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
