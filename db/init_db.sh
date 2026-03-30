#!/usr/bin/env bash
set -euo pipefail

ENV_PATH="${1:-.env}"
SCHEMA_SQL_PATH="${2:-db/sql/init_db_schema.sql}"
PSQL_BIN="${PSQL_BIN:-psql}"

if ! command -v "$PSQL_BIN" >/dev/null 2>&1; then
  echo "psql not found. Install PostgreSQL client or set PSQL_BIN." >&2
  exit 1
fi

if [[ ! -f "$ENV_PATH" ]]; then
  echo "Env file not found: $ENV_PATH" >&2
  exit 1
fi

if [[ ! -f "$SCHEMA_SQL_PATH" ]]; then
  echo "Schema SQL file not found: $SCHEMA_SQL_PATH" >&2
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

quote_literal() {
  printf "'%s'" "$(printf "%s" "$1" | sed "s/'/''/g")"
}

run_sql() {
  local db="$1"
  local user="$2"
  local pass="$3"
  local sql="$4"
  PGPASSWORD="$pass" "$PSQL_BIN" \
    -v ON_ERROR_STOP=1 \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$user" \
    -d "$db" \
    -c "$sql"
}

run_file() {
  local db="$1"
  local user="$2"
  local pass="$3"
  local file="$4"
  PGPASSWORD="$pass" "$PSQL_BIN" \
    -v ON_ERROR_STOP=1 \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$user" \
    -d "$db" \
    -v "admin_user=$DB_ADMIN_USER" \
    -v "app_user=$DB_APP_USER" \
    -f "$file"
}

load_env "$ENV_PATH"

echo "Resetting database '$DB_NAME' and recreating roles..."

run_sql "$DB_BOOTSTRAP_NAME" "$DB_BOOTSTRAP_USER" "$DB_BOOTSTRAP_PASSWORD" \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();"
run_sql "$DB_BOOTSTRAP_NAME" "$DB_BOOTSTRAP_USER" "$DB_BOOTSTRAP_PASSWORD" "DROP DATABASE IF EXISTS $DB_NAME;"
run_sql "$DB_BOOTSTRAP_NAME" "$DB_BOOTSTRAP_USER" "$DB_BOOTSTRAP_PASSWORD" "DROP ROLE IF EXISTS $DB_APP_USER;"
run_sql "$DB_BOOTSTRAP_NAME" "$DB_BOOTSTRAP_USER" "$DB_BOOTSTRAP_PASSWORD" "DROP ROLE IF EXISTS $DB_ADMIN_USER;"
run_sql "$DB_BOOTSTRAP_NAME" "$DB_BOOTSTRAP_USER" "$DB_BOOTSTRAP_PASSWORD" \
  "CREATE ROLE $DB_ADMIN_USER LOGIN PASSWORD $(quote_literal "$DB_ADMIN_PASSWORD");"
run_sql "$DB_BOOTSTRAP_NAME" "$DB_BOOTSTRAP_USER" "$DB_BOOTSTRAP_PASSWORD" \
  "CREATE ROLE $DB_APP_USER LOGIN PASSWORD $(quote_literal "$DB_APP_PASSWORD");"
run_sql "$DB_BOOTSTRAP_NAME" "$DB_BOOTSTRAP_USER" "$DB_BOOTSTRAP_PASSWORD" "CREATE DATABASE $DB_NAME OWNER $DB_ADMIN_USER;"
run_sql "$DB_BOOTSTRAP_NAME" "$DB_BOOTSTRAP_USER" "$DB_BOOTSTRAP_PASSWORD" "REVOKE ALL ON DATABASE $DB_NAME FROM PUBLIC;"
run_sql "$DB_BOOTSTRAP_NAME" "$DB_BOOTSTRAP_USER" "$DB_BOOTSTRAP_PASSWORD" "GRANT CONNECT, TEMPORARY ON DATABASE $DB_NAME TO $DB_ADMIN_USER;"
run_sql "$DB_BOOTSTRAP_NAME" "$DB_BOOTSTRAP_USER" "$DB_BOOTSTRAP_PASSWORD" "GRANT CONNECT ON DATABASE $DB_NAME TO $DB_APP_USER;"

run_file "$DB_NAME" "$DB_ADMIN_USER" "$DB_ADMIN_PASSWORD" "$SCHEMA_SQL_PATH"

echo "Database '$DB_NAME' is ready."
