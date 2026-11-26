#!/usr/bin/env bash
# Creates .env with freshly generated secrets.
#   ./scripts/init-env.sh local                      -> try the stack on http://localhost:8080
#   ./scripts/init-env.sh production example.com     -> real server with a domain (HTTPS via Caddy)
set -euo pipefail
cd "$(dirname "$0")/.."

mode="${1:-}"
domain="${2:-}"
if [[ "$mode" != "local" && "$mode" != "production" ]] || [[ "$mode" == "production" && -z "$domain" ]]; then
  echo "Usage: $0 local | $0 production <your-domain>" >&2
  exit 1
fi
if [[ -f .env ]]; then
  echo ".env already exists. Refusing to overwrite it. Delete it first if you really want a new one." >&2
  exit 1
fi

# Letters and digits only: safe in .env files, shells and URLs.
# Explicitly use /usr/bin/head to avoid colliding with Perl's HTTP head utility (e.g. from XAMPP).
rand() { LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | /usr/bin/head -c "$1"; }

if [[ "$mode" == "local" ]]; then
  site_url="http://localhost:8080"; cookie_secure="false"; domain_line="TODO_REPLACE"
else
  site_url="https://${domain}"; cookie_secure="true"; domain_line="${domain}"
fi

cat > .env <<ENV
POSTGRES_DB=portfolio
POSTGRES_USER=portfolio
POSTGRES_PASSWORD=$(rand 32)

IP_HASH_SECRET=$(rand 48)

SITE_BASE_URL=${site_url}
DOMAIN=${domain_line}

ADMIN_EMAIL=TODO_REPLACE
ADMIN_PASSWORD=TODO_REPLACE

HTTP_BIND=127.0.0.1
HTTP_PORT=8080
SESSION_COOKIE_SECURE=${cookie_secure}
ENV
chmod 600 .env

echo "Created .env (mode: $mode). Database password and IP-hash secret were generated for you."
echo
echo "NEXT: open .env and replace the two TODO_REPLACE lines:"
echo "  ADMIN_EMAIL     your login email"
echo "  ADMIN_PASSWORD  at least 12 characters; wrap it in single quotes if it contains \$ or #"
