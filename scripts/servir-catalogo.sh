#!/usr/bin/env bash
# Garante o catalogo estatico no ar em http://localhost:4173 (idempotente).
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT=4173
DIST="$ROOT/apps/catalog/dist"

if curl -s -o /dev/null --max-time 3 "http://localhost:$PORT/"; then
  echo "catalogo ja no ar em http://localhost:$PORT/"
  exit 0
fi

if [ ! -f "$DIST/index.html" ]; then
  echo "build ausente — rode: npm run build && npm run build:app" >&2
  exit 1
fi

cd "$DIST" || exit 1
setsid nohup python3 -m http.server "$PORT" >/tmp/catalogo-$PORT.log 2>&1 &
disown 2>/dev/null || true

for i in $(seq 1 15); do
  if curl -s -o /dev/null --max-time 2 "http://localhost:$PORT/"; then
    echo "catalogo no ar em http://localhost:$PORT/"
    exit 0
  fi
  sleep 1
done

echo "falha ao subir o catalogo" >&2
exit 1
