#!/usr/bin/env bash
set -euo pipefail
shopt -s nullglob

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SUPABASE_DIR="$ROOT_DIR/supabase"
COMPOSE_FILE="$SUPABASE_DIR/docker-compose.yml"
ENV_FILE="$SUPABASE_DIR/.env.docker"
MIGRATIONS_DIR="$SUPABASE_DIR/migrations"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required to run Supabase locally." >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "docker compose plugin is required (Docker Desktop 3.4+)." >&2
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing Supabase env file at $ENV_FILE. Copy supabase/.env.docker.example first." >&2
  exit 1
fi

if [[ ! -d "$MIGRATIONS_DIR" ]]; then
  echo "Missing migrations directory at $MIGRATIONS_DIR." >&2
  exit 1
fi

MIGRATION_FILES=("$MIGRATIONS_DIR"/*.sql)
if (( ${#MIGRATION_FILES[@]} == 0 )); then
  echo "No migration files found locally in $MIGRATIONS_DIR"
  exit 0
fi

compose_cmd=(docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE")

if ! "${compose_cmd[@]}" ps >/dev/null 2>&1; then
  echo "Unable to reach Supabase docker stack. Start it via ./scripts/supabase-docker.sh start." >&2
  exit 1
fi

if ! "${compose_cmd[@]}" ps --status running --services | grep -qx "db"; then
  echo "The Supabase database container is not running. Start it before applying migrations." >&2
  echo "Hint: ./scripts/supabase-docker.sh start" >&2
  exit 1
fi

echo "Applying Supabase migrations from $MIGRATIONS_DIR"
for file in "${MIGRATION_FILES[@]}"; do
  base="$(basename "$file")"
  echo "==> Running $base"
  if ! cat "$file" | "${compose_cmd[@]}" exec -T db bash -c 'psql -X -v ON_ERROR_STOP=1 \
    -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-postgres}" -f -'; then
    echo "Migration $base failed." >&2
    exit 1
  fi
  echo "✓ $base applied"
done

echo "Running validation query..."
"${compose_cmd[@]}" exec -T db bash -c 'psql -X -v ON_ERROR_STOP=1 \
  -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-postgres}" \
  -c "select current_database() as database, count(1) as total_tables from pg_tables where schemaname = '\''public'\'';"'
echo "✓ Schema validated"
echo "All Supabase migrations applied successfully."
