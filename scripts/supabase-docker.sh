#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT/supabase/docker-compose.yml"
ENV_FILE="$ROOT/supabase/.env.docker"

if [[ ! -f "$ENV_FILE" ]];  then
  echo "Supabase docker env file missing. Copy supabase/.env.docker.example to supabase/.env.docker and edit values."
  exit 1
fi

case "${1:-start}" in
  start)
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
    ;;
  stop)
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down
    ;;
  restart)
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
    ;;
  *)
    echo "Usage: $0 {start|stop|restart}"
    exit 1
    ;;
esac
