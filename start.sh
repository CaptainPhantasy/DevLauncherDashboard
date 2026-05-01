#!/bin/bash
set -euo pipefail

# Dev Launcher single-instance startup script.
# Default mode keeps logs in this terminal. --detached starts/reuses services without Terminal.

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
RUNTIME_DIR="$ROOT_DIR/.floyd/runtime"
LOG_DIR="$RUNTIME_DIR/logs"
PID_FILE="$RUNTIME_DIR/launcher.pid"
BACKEND_PID_FILE="$RUNTIME_DIR/backend.pid"
FRONTEND_PID_FILE="$RUNTIME_DIR/frontend.pid"
BACKEND_PORT=4500
FRONTEND_PORT=4501
BACKEND_URL="http://127.0.0.1:${BACKEND_PORT}/health"
FRONTEND_URL="http://127.0.0.1:${FRONTEND_PORT}"
MODE="foreground"

mkdir -p "$LOG_DIR"

usage() {
  cat <<USAGE
Dev Launcher
Usage: ./start.sh [--detached|--foreground|--stop|--status|--restart]

  --detached   Start/reuse one background launcher instance and return immediately.
  --foreground Start/reuse services and stream logs in this terminal. Default.
  --stop       Stop launcher-owned backend/frontend processes.
  --status     Print service status.
  --restart    Stop launcher-owned processes, then start foreground.
USAGE
}

for arg in "$@"; do
  case "$arg" in
    --detached) MODE="detached" ;;
    --foreground) MODE="foreground" ;;
    --stop) MODE="stop" ;;
    --status) MODE="status" ;;
    --restart) MODE="restart" ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown argument: $arg"; usage; exit 2 ;;
  esac
done

pid_alive() {
  local pid="${1:-}"
  [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null
}

read_pid_file() {
  local file="$1"
  [[ -f "$file" ]] && tr -d '[:space:]' < "$file" || true
}

service_ok() {
  local url="$1"
  python3 - "$url" <<'PY' >/dev/null 2>&1
import sys
from urllib.request import urlopen
try:
    with urlopen(sys.argv[1], timeout=2) as response:
        raise SystemExit(0 if 200 <= response.status < 500 else 1)
except Exception:
    raise SystemExit(1)
PY
}

port_pids() {
  local port="$1"
  lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true
}

adopt_single_listener() {
  local port="$1"
  local file="$2"
  local label="$3"
  local listeners listener_count
  listeners="$(port_pids "$port")"
  listener_count="$(printf '%s\n' "$listeners" | sed '/^$/d' | wc -l | tr -d ' ')"
  if [[ "$listener_count" == "1" ]]; then
    printf '%s\n' "$listeners" | sed '/^$/d' > "$file"
    echo "Adopted existing $label listener (PID $(cat "$file"))"
    return 0
  fi
  if [[ "$listener_count" == "0" ]]; then
    return 1
  fi
  echo "Refusing to adopt multiple $label listeners on port $port: $(printf '%s' "$listeners" | tr '\n' ' ')"
  return 1
}

adopt_existing_if_healthy() {
  local adopted=0
  if service_ok "$BACKEND_URL"; then
    adopt_single_listener "$BACKEND_PORT" "$BACKEND_PID_FILE" "backend" && adopted=1 || true
  fi
  if service_ok "$FRONTEND_URL"; then
    adopt_single_listener "$FRONTEND_PORT" "$FRONTEND_PID_FILE" "frontend" && adopted=1 || true
  fi
  return 0
}

stop_pid_file() {
  local file="$1"
  local label="$2"
  local pid
  pid="$(read_pid_file "$file")"
  if pid_alive "$pid"; then
    echo "Stopping $label (PID $pid)"
    kill "$pid" 2>/dev/null || true
    for _ in {1..20}; do
      pid_alive "$pid" || break
      sleep 0.2
    done
    if pid_alive "$pid"; then
      echo "Force stopping $label (PID $pid)"
      kill -9 "$pid" 2>/dev/null || true
    fi
  fi
  rm -f "$file"
}

stop_launcher_owned() {
  stop_pid_file "$FRONTEND_PID_FILE" "frontend"
  stop_pid_file "$BACKEND_PID_FILE" "backend"
  rm -f "$PID_FILE"
}

status() {
  local backend_pid frontend_pid
  backend_pid="$(read_pid_file "$BACKEND_PID_FILE")"
  frontend_pid="$(read_pid_file "$FRONTEND_PID_FILE")"
  echo "Backend PID:  ${backend_pid:-none}"
  echo "Frontend PID: ${frontend_pid:-none}"
  if service_ok "$BACKEND_URL"; then echo "Backend:  healthy ${BACKEND_URL}"; else echo "Backend:  not healthy"; fi
  if service_ok "$FRONTEND_URL"; then echo "Frontend: healthy ${FRONTEND_URL}"; else echo "Frontend: not healthy"; fi
  echo "Backend listeners on ${BACKEND_PORT}: $(port_pids "$BACKEND_PORT" | tr '\n' ' ')"
  echo "Frontend listeners on ${FRONTEND_PORT}: $(port_pids "$FRONTEND_PORT" | tr '\n' ' ')"
}

ensure_dependencies() {
  if [[ ! -d "$ROOT_DIR/backend/node_modules" ]]; then
    echo "Installing backend dependencies..."
    (cd "$ROOT_DIR/backend" && npm install --legacy-peer-deps)
  fi

  if [[ ! -d "$ROOT_DIR/frontend/node_modules" ]]; then
    echo "Installing frontend dependencies..."
    (cd "$ROOT_DIR/frontend" && npm install --legacy-peer-deps)
  fi
}

start_backend() {
  local pid
  pid="$(read_pid_file "$BACKEND_PID_FILE")"
  if pid_alive "$pid" && service_ok "$BACKEND_URL"; then
    echo "Backend already running (PID $pid)"
    return
  fi

  local listeners
  listeners="$(port_pids "$BACKEND_PORT" | tr '\n' ' ')"
  if [[ -n "${listeners// /}" ]]; then
    if service_ok "$BACKEND_URL" && adopt_single_listener "$BACKEND_PORT" "$BACKEND_PID_FILE" "backend"; then
      return 0
    fi
    echo "Backend port ${BACKEND_PORT} is occupied by non-managed PID(s): $listeners"
    echo "Run ./start.sh --status to inspect, or ./start.sh --stop after adoption if these are stale launcher copies."
    return 1
  fi

  echo "Starting backend on ${BACKEND_URL}"
  (cd "$ROOT_DIR/backend" && nohup node server.js > "$LOG_DIR/backend.log" 2>&1 & echo $! > "$BACKEND_PID_FILE")
}

start_frontend() {
  local pid
  pid="$(read_pid_file "$FRONTEND_PID_FILE")"
  if pid_alive "$pid" && service_ok "$FRONTEND_URL"; then
    echo "Frontend already running (PID $pid)"
    return
  fi

  local listeners
  listeners="$(port_pids "$FRONTEND_PORT" | tr '\n' ' ')"
  if [[ -n "${listeners// /}" ]]; then
    if service_ok "$FRONTEND_URL" && adopt_single_listener "$FRONTEND_PORT" "$FRONTEND_PID_FILE" "frontend"; then
      return 0
    fi
    echo "Frontend port ${FRONTEND_PORT} is occupied by non-managed PID(s): $listeners"
    echo "Run ./start.sh --status to inspect, or ./start.sh --stop after adoption if these are stale launcher copies."
    return 1
  fi

  echo "Starting frontend on ${FRONTEND_URL}"
  (cd "$ROOT_DIR/frontend" && nohup npm run dev -- --host 127.0.0.1 > "$LOG_DIR/frontend.log" 2>&1 & echo $! > "$FRONTEND_PID_FILE")
}

wait_for_service() {
  local label="$1"
  local url="$2"
  for _ in {1..40}; do
    if service_ok "$url"; then
      echo "$label ready: $url"
      return 0
    fi
    sleep 0.25
  done
  echo "$label did not become ready: $url"
  return 1
}

start_services() {
  echo $$ > "$PID_FILE"
  ensure_dependencies
  start_backend
  wait_for_service "Backend" "$BACKEND_URL"
  start_frontend
  wait_for_service "Frontend" "$FRONTEND_URL"
  echo "Dev Launcher ready"
  echo "  Backend:  http://127.0.0.1:${BACKEND_PORT}"
  echo "  Frontend: http://127.0.0.1:${FRONTEND_PORT}"
}

adopt_existing_if_healthy
case "$MODE" in
  stop)
    stop_launcher_owned
    exit 0
    ;;
  status)
    status
    exit 0
    ;;
  restart)
    stop_launcher_owned
    MODE="foreground"
    ;;
esac

adopt_existing_if_healthy
if service_ok "$BACKEND_URL" && service_ok "$FRONTEND_URL"; then
  echo "Dev Launcher is already running. Reusing the existing instance."
  open "$FRONTEND_URL" >/dev/null 2>&1 || true
  status
  exit 0
fi

if [[ "$MODE" == "detached" ]]; then
  (
    cd "$ROOT_DIR"
    ./start.sh --foreground > "$LOG_DIR/launcher.log" 2>&1
  ) &
  echo "Dev Launcher starting in background. Logs: $LOG_DIR/launcher.log"
  exit 0
fi

trap 'echo "Stopping Dev Launcher"; stop_launcher_owned' INT TERM
start_services
open "$FRONTEND_URL" >/dev/null 2>&1 || true

echo "Streaming logs. Press Ctrl+C to stop launcher-owned services."
tail -n 80 -f "$LOG_DIR/backend.log" "$LOG_DIR/frontend.log"
