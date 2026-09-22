#!/usr/bin/env sh
set -eu

if [ "$#" -ne 2 ]; then
  echo "usage: $0 /secure/path/server-qc.env /secure/backup/directory" >&2
  exit 64
fi

env_file=$1
backup_dir=$2
compose_file=${COMPOSE_FILE:-compose.server-qc.yml}
timestamp=$(date -u +%Y%m%dT%H%M%SZ)

umask 077
mkdir -p "$backup_dir"

backup_database() {
  service=$1
  label=$2
  target="$backup_dir/$label-$timestamp.dump"
  temporary="$target.partial"

  docker compose --env-file "$env_file" -f "$compose_file" exec -T "$service" \
    sh -c 'exec pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$temporary"
  test -s "$temporary"
  docker compose --env-file "$env_file" -f "$compose_file" exec -T "$service" \
    sh -c 'exec pg_restore --list' < "$temporary" >/dev/null
  mv "$temporary" "$target"
  sha256sum "$target" > "$target.sha256"
  printf '%s\n' "$target"
}

healthcare_backup=$(backup_database healthcare-postgres-qc healthcare)
lab_lite_backup=$(backup_database lab-lite-postgres-qc lab-lite)

printf 'backup_timestamp_utc=%s\nhealthcare_backup=%s\nlab_lite_backup=%s\n' \
  "$timestamp" "$healthcare_backup" "$lab_lite_backup"
