#!/usr/bin/env bash
set -euo pipefail

ENV_PATH="${1:-.env}"
SEED_SQL_PATH="${2:-db/sql/init_testdata.sql}"
PSQL_BIN="${PSQL_BIN:-psql}"

if ! command -v "$PSQL_BIN" >/dev/null 2>&1; then
  echo "psql not found. Install PostgreSQL client or set PSQL_BIN." >&2
  exit 1
fi

if [[ ! -f "$ENV_PATH" ]]; then
  echo "Env file not found: $ENV_PATH" >&2
  exit 1
fi

if [[ ! -f "$SEED_SQL_PATH" ]]; then
  echo "Seed SQL file not found: $SEED_SQL_PATH" >&2
  exit 1
fi

load_env() {
  local path="$1"
  while IFS='=' read -r raw_key raw_value; do
    [[ -z "${raw_key// /}" ]] && continue
    [[ "${raw_key#"${raw_key%%[![:space:]]*}"}" == \#* ]] && continue

    local key value
    key="$(echo "$raw_key" | xargs)"
    value="$(echo "${raw_value:-}" | xargs)"
    [[ -z "$key" ]] && continue
    export "$key=$value"
  done < "$path"
}

load_env "$ENV_PATH"

PGPASSWORD="$DB_ADMIN_PASSWORD" "$PSQL_BIN" \
  -v ON_ERROR_STOP=1 \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_ADMIN_USER" \
  -d "$DB_NAME" \
  -f "$SEED_SQL_PATH"

echo "Test data inserted into '$DB_NAME'."
