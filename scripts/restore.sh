#!/usr/bin/env bash
# Restores a backup made by backup.sh. THIS REPLACES the current database and images.
#   ./scripts/restore.sh backups/db_2026-11-23_101500.sql.gz backups/uploads_2026-11-23_101500.tar.gz
set -euo pipefail
cd "$(dirname "$0")/.."

db_file="${1:-}"; uploads_file="${2:-}"
if [[ ! -f "$db_file" || ! -f "$uploads_file" ]]; then
  echo "Usage: $0 <db_backup.sql.gz> <uploads_backup.tar.gz>" >&2
  exit 1
fi
read -r -p "This will REPLACE the current database and images. Type 'restore' to continue: " answer
[[ "$answer" == "restore" ]] || { echo "Cancelled."; exit 1; }

echo "Stopping the app (the database keeps running)..."
docker compose stop frontend backend

echo "Restoring the database..."
docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"'
gunzip -c "$db_file" | docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1'

echo "Restoring images..."
docker run --rm -v portfolio_uploads:/data -v "$PWD/$(dirname "$uploads_file")":/backup:ro alpine \
  sh -c "rm -rf /data/* /data/.[!.]* 2>/dev/null; tar xzf /backup/$(basename "$uploads_file") -C /data && chown -R 10001:10001 /data"

echo "Starting the app..."
docker compose up -d backend frontend
echo "Restored."
