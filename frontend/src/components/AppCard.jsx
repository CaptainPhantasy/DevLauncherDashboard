import {
  Play, Square, Loader2, ExternalLink, Clock, Network,
  Box, TerminalSquare, Package
} from 'lucide-react';
import { cn } from '../lib/utils';
import { openTerminal, getIconUrl } from '../api';
import { TYPE_ICONS, TYPE_LABELS, TYPE_COLORS, ROLE_ICONS } from '../lib/constants';

function formatUptime(startTime) {
  if (!startTime) return null;
  const diff = Date.now() - new Date(startTime).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m`;
  return 'Just now';
}

function truncatePath(fullPath) {
  const parts = fullPath.split('/').filter(Boolean);
  if (parts.length <= 2) return fullPath;
  return '.../' + parts.slice(-2).join('/');
}

export function AppCard({ app, onStart, onStop, isLoading }) {
  const isRunning = app.isRunning;
  const TypeIcon = TYPE_ICONS[app.type] || Box;
  const typeLabel = TYPE_LABELS[app.type] || app.type || 'Custom';
  const typeColor = TYPE_COLORS[app.type] || 'bg-slate-600/20 text-slate-400';
  const uptime = formatUptime(app.startTime);

  const handleOpenTerminal = async () => {
    try { await openTerminal(app.id); } catch { /* ignore */ }
  };

  return (
    <div className={cn(
      "relative rounded-xl border bg-slate-800/40 transition-all duration-200 hover:bg-slate-800/70",
      isRunning
        ? "border-l-4 border-l-green-500 border-t-slate-700/50 border-r-slate-700/50 border-b-slate-700/50"
        : "border-slate-700/50 hover:border-slate-600/50"
    )}>
      <div className="p-4">
        {/* Top row: icon/badge + status dot */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {/* App icon or type icon */}
            {app.icon ? (
              <img
                src={getIconUrl(app.id)}
                alt=""
                className="h-8 w-8 rounded-lg object-cover bg-slate-700"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <div className="h-8 w-8 rounded-lg bg-slate-700/60 flex items-center justify-center">
                <TypeIcon className="h-4 w-4 text-slate-400" />
              </div>
            )}
            <span className={cn("text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full", typeColor)}>
              {typeLabel}
            </span>
          </div>
          <div className={cn(
            "h-2.5 w-2.5 rounded-full flex-shrink-0",
            isRunning ? "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.4)]" : "bg-slate-600"
          )} />
        </div>

        {/* Name */}
        <h3 className="text-base font-semibold text-slate-100 mb-0.5 truncate">{app.name}</h3>

        {/* Description */}
        <p className="text-xs text-slate-500 mb-2 line-clamp-1">
          {app.description || typeLabel + ' application'}
        </p>

        {/* Path */}
        <button
          onClick={handleOpenTerminal}
          className="group text-[11px] text-slate-500 font-mono hover:text-blue-400 flex items-center gap-1 transition-colors mb-3 truncate max-w-full"
          title={app.path}
        >
          <span className="truncate">{truncatePath(app.path)}</span>
          <ExternalLink className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
        </button>

        {/* Services (multi-service apps) */}
        {app.services && app.services.length > 1 && (
          <div className="mb-3 space-y-1">
            {app.services.map((svc) => {
              const RoleIcon = ROLE_ICONS[svc.role] || Package;
              return (
                <div key={svc.role} className="flex items-center gap-2 text-xs">
                  <RoleIcon className="h-3 w-3 text-slate-500 flex-shrink-0" />
                  <span className="text-slate-400 capitalize">{svc.role}</span>
                  {svc.isRunning && svc.port && (
                    <span className="text-slate-500 font-mono">:{svc.port}</span>
                  )}
                  <div className={cn(
                    "h-1.5 w-1.5 rounded-full ml-auto flex-shrink-0",
                    svc.isRunning ? "bg-green-400" : "bg-slate-600"
                  )} />
                </div>
              );
            })}
          </div>
        )}

        {/* Info row */}
        <div className="flex items-center gap-3 mb-3 text-xs text-slate-500">
          {(isRunning && app.port) && (
            <span className="flex items-center gap-1">
              <Network className="h-3 w-3" />
              <span className="font-mono text-slate-300">{app.port}</span>
            </span>
          )}
          {(!isRunning && app.preferredPort) && (
            <span className="flex items-center gap-1">
              <Network className="h-3 w-3" />
              <span className="font-mono">{app.preferredPort}</span>
            </span>
          )}
          {isRunning && uptime && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {uptime}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {!isRunning ? (
            <button
              onClick={() => onStart(app.id)}
              disabled={isLoading}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                "bg-blue-600/80 text-white hover:bg-blue-500",
                "disabled:opacity-40 disabled:cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Starting...</>
              ) : (
                <><Play className="h-3.5 w-3.5" /> Launch</>
              )}
            </button>
          ) : (
            <>
              <button
                onClick={() => app.port && window.open(`http://localhost:${app.port}`, '_blank')}
                disabled={!app.port}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-green-600/20 text-green-400 hover:bg-green-600/30 disabled:opacity-40 transition-colors"
              >
                Open
              </button>
              <button
                onClick={handleOpenTerminal}
                className="flex items-center justify-center px-2.5 py-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 transition-colors"
                title="Open Terminal"
              >
                <TerminalSquare className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onStop(app.id)}
                disabled={isLoading}
                className="flex items-center justify-center px-2.5 py-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 disabled:opacity-40 transition-colors"
              >
                {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Square className="h-3.5 w-3.5" />}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
