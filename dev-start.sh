#!/bin/sh
set -eu

LOCK_FILE="package-lock.json"
HASH_FILE="/app/node_modules/.package-lock.sha256"

hash_file() {
  target="$1"
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$target" | awk '{print $1}'
  else
    shasum -a 256 "$target" | awk '{print $1}'
  fi
}

LOCK_HASH="$(hash_file "$LOCK_FILE")"
CURRENT_HASH=""
if [ -f "$HASH_FILE" ]; then
  CURRENT_HASH="$(cat "$HASH_FILE" || true)"
fi

if [ ! -d "/app/node_modules" ] || [ ! -f "$HASH_FILE" ] || [ "$LOCK_HASH" != "$CURRENT_HASH" ]; then
  npm install
  mkdir -p "/app/node_modules"
  echo "$LOCK_HASH" > "$HASH_FILE"
fi

exec npm run dev -- --hostname 0.0.0.0 --port 3000

