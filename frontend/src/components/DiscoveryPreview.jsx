import { useState } from 'react';
import {
  X, Check, Loader2, Package, Image, Network, Clock
} from 'lucide-react';
import { cn } from '../lib/utils';
import { importProject } from '../api';
import { ROLE_ICONS, ROLE_COLORS } from '../lib/constants';

export function DiscoveryPreview({ discovery, onImported, onClose }) {
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState(null);
  const [name, setName] = useState(discovery.name || '');
  const [description, setDescription] = useState(discovery.description || '');

  async function handleImport() {
    setImporting(true);
    setError(null);
    try {
      await importProject({
        name,
        description,
        path: discovery.path,
        services: discovery.services,
        framework: discovery.framework,
        icon: discovery.icon,
        portBlock: discovery.suggestedPortBlock,
        startupDelay: 2000,
      });
      onImported();
    } catch (err) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  }

  const portBlock = discovery.suggestedPortBlock;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-slate-100">Import Project</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Icon preview + name */}
          <div className="flex items-start gap-4">
            {discovery.icon ? (
              <div className="h-14 w-14 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                <Image className="h-6 w-6 text-slate-500" />
              </div>
            ) : (
              <div className="h-14 w-14 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0">
                <Package className="h-6 w-6 text-slate-500" />
              </div>
            )}
            <div className="flex-1 space-y-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-blue-500/50"
                placeholder="Project name"
              />
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-400 focus:outline-none focus:border-blue-500/50"
                placeholder="Description (optional)"
              />
            </div>
          </div>

          {/* Path */}
          <div className="px-3 py-2 bg-slate-800/60 rounded-lg">
            <p className="text-xs text-slate-500 mb-0.5">Path</p>
            <p className="text-sm text-slate-300 font-mono truncate">{discovery.path}</p>
          </div>

          {/* Detected services */}
          {discovery.services.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                Detected Services
                <span className="text-slate-600">({discovery.services.length})</span>
              </p>
              <div className="space-y-1.5">
                {discovery.services.map((svc, i) => {
                  const Icon = ROLE_ICONS[svc.role] || Package;
                  const colors = ROLE_COLORS[svc.role] || 'text-slate-400 bg-slate-400/10';
                  const port = portBlock ? portBlock.start + i : null;

                  return (
                    <div key={svc.role + i} className="flex items-center gap-3 px-3 py-2 bg-slate-800/40 rounded-lg">
                      <div className={cn("h-7 w-7 rounded-md flex items-center justify-center flex-shrink-0", colors)}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-200 capitalize">{svc.role}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">{svc.framework}</span>
                        </div>
                        <p className="text-xs text-slate-500 font-mono truncate">
                          {svc.command} {(svc.args || []).join(' ')}
                          {svc.dir !== '.' && ` (${svc.dir}/)`}
                        </p>
                      </div>
                      {port && (
                        <div className="flex items-center gap-1 text-xs text-slate-500 flex-shrink-0">
                          <Network className="h-3 w-3" />
                          {port}
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-xs text-slate-600 flex-shrink-0">
                        <Clock className="h-3 w-3" />
                        #{svc.order + 1}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Port block */}
          {portBlock && (
            <div className="flex items-center gap-3 px-3 py-2 bg-slate-800/40 rounded-lg">
              <Network className="h-4 w-4 text-blue-400" />
              <div>
                <p className="text-sm text-slate-300">Port block: {portBlock.start}–{portBlock.end}</p>
                <p className="text-xs text-slate-500">Reserved exclusively for this project</p>
              </div>
            </div>
          )}

          {/* Startup info */}
          {discovery.services.length > 1 && (
            <div className="flex items-center gap-3 px-3 py-2 bg-slate-800/40 rounded-lg">
              <Clock className="h-4 w-4 text-yellow-400" />
              <div>
                <p className="text-sm text-slate-300">Sequential startup with 2s delay</p>
                <p className="text-xs text-slate-500">
                  Order: {discovery.services.map(s => s.role).join(' → ')}
                </p>
              </div>
            </div>
          )}

          {/* Icon detected */}
          {discovery.icon && (
            <div className="flex items-center gap-3 px-3 py-2 bg-slate-800/40 rounded-lg">
              <Image className="h-4 w-4 text-emerald-400" />
              <p className="text-sm text-slate-300">
                Icon found: <span className="font-mono text-slate-400">{discovery.icon}</span>
              </p>
            </div>
          )}

          {/* No services warning */}
          {discovery.services.length === 0 && (
            <div className="px-3 py-2 bg-yellow-900/20 border border-yellow-800/30 rounded-lg">
              <p className="text-sm text-yellow-300">No runnable services detected in this folder.</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="px-3 py-2 bg-red-900/30 border border-red-800/50 rounded-lg">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-800 flex items-center gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={importing || !name || discovery.services.length === 0}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {importing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Import Project
          </button>
        </div>
      </div>
    </div>
  );
}
