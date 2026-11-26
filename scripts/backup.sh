#!/usr/bin/env bash
# Backs up the database and the uploaded images into ./backups (keep copies OFF the server too).
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p backups
stamp="$(date +%Y-%m-%d_%H%M%S)"

echo "Dumping the database..."
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner' | gzip > "backups/db_${stamp}.sql.gz"

echo "Archiving uploaded images..."
docker run --rm -v portfolio_uploads:/data:ro -v "$PWD/backups":/backup alpine \
  tar czf "/backup/uploads_${stamp}.tar.gz" -C /data .

echo "Done:"
ls -lh "backups/db_${stamp}.sql.gz" "backups/uploads_${stamp}.tar.gz"
