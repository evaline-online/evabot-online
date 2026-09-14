#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
echo "[sync-modules] Fetching latest from module repos..."
for repo in eva-docs eva-reports eva-brain eva-voice eva-face eva-db eva-history eva-memory evaline-consilium evabot-server eva-server evaline-server; do
  path="/var/www/$repo"
  if [ -d "$path/.git" ]; then
    echo "  -> $repo"
    (cd "$path" && git fetch --quiet && git reset --quiet --hard origin/main)
  else
    echo "  !! $path not found or not a git repo"
  fi
done
echo "[sync-modules] done."
