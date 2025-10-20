import { Play, Square, Circle, CheckCircle2, Loader2, ExternalLink } from 'lucide-react';
import { cn } from '../lib/utils';
import { openTerminal } from '../api';

export function AppCard({ app, onStart, onStop, isLoading }) {
  const isRunning = app.isRunning;

  const handleOpenTerminal = async () => {
    try {
      await openTerminal(app.id);
    } catch (error) {
      console.error('Failed to open Terminal:', error.message);
    }
  };

  return (
    <div className={cn(
      "relative rounded-lg border bg-white shadow-sm transition-all hover:shadow-md",
      isRunning ? "border-green-200 bg-green-50/30" : "border-slate-200"
    )}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 mb-1">
              {app.name}
            </h3>
            <button
              onClick={handleOpenTerminal}
              className="group text-sm text-slate-500 font-mono break-all hover:text-blue-600 hover:underline flex items-center gap-1 transition-colors"
              title={`Open Terminal at ${app.path}`}
            >
              <span>{app.path}</span>
              <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </button>
          </div>
          <div className="ml-4">
            {isRunning ? (
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            ) : (
              <Circle className="h-6 w-6 text-slate-300" />
            )}
          </div>
        </div>

        {/* Status Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Status:</span>
            <span className={cn(
              "font-medium",
              isRunning ? "text-green-600" : "text-slate-400"
            )}>
              {isRunning ? 'Running' : 'Stopped'}
            </span>
          </div>
          {isRunning && app.port && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Port:</span>
              <span className="font-mono font-medium text-slate-900">
                {app.port}
              </span>
            </div>
          )}
          {!isRunning && app.preferredPort && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Preferred Port:</span>
              <span className="font-mono text-slate-500">
                {app.preferredPort}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {!isRunning ? (
            <button
              onClick={() => onStart(app.id)}
              disabled={isLoading}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-medium transition-colors",
                "bg-blue-600 text-white hover:bg-blue-700",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Start
                </>
              )}
            </button>
          ) : (
            <>
              <button
                onClick={() => window.open(`http://localhost:${app.port}`, '_blank')}
                disabled={!app.port}
                className={cn(
                  "flex-1 px-4 py-2.5 rounded-md font-medium transition-colors",
                  "bg-green-600 text-white hover:bg-green-700",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                Open App
              </button>
              <button
                onClick={() => onStop(app.id)}
                disabled={isLoading}
                className={cn(
                  "flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-medium transition-colors",
                  "bg-red-600 text-white hover:bg-red-700",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
