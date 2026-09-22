#!/usr/bin/env sh
set -eu

if [ "$#" -ne 2 ]; then
  echo "usage: $0 /secure/path/server-qc.env healthcare.albarakasoft.com" >&2
  exit 64
fi

env_file=$1
hostname=$2
compose_file=${COMPOSE_FILE:-compose.server-qc.yml}
failed=0

check() {
  label=$1
  shift
  if "$@" >/dev/null 2>&1; then
    printf 'PASS %s\n' "$label"
  else
    printf 'FAIL %s\n' "$label" >&2
    failed=1
  fi
}

running_services=$(docker compose --env-file "$env_file" -f "$compose_file" ps --status running --services | wc -l | tr -d ' ')
if [ "${running_services:-0}" -ge 4 ]; then
  printf 'PASS compose-services running=%s\n' "$running_services"
else
  printf 'FAIL compose-services running=%s expected-at-least=4\n' "${running_services:-0}" >&2
  failed=1
fi
check healthcare-health curl --fail --silent --show-error --max-time 15 http://127.0.0.1:3000/api/health
check lab-lite-health curl --fail --silent --show-error --max-time 15 http://127.0.0.1:3100/api/health
check healthcare-postgres docker compose --env-file "$env_file" -f "$compose_file" exec -T healthcare-postgres-qc sh -c 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
check lab-lite-postgres docker compose --env-file "$env_file" -f "$compose_file" exec -T lab-lite-postgres-qc sh -c 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
check public-https curl --fail --silent --show-error --max-time 20 "https://$hostname/api/health"
check tls-expiry sh -c "echo | openssl s_client -servername '$hostname' -connect '$hostname:443' 2>/dev/null | openssl x509 -noout -checkend 1209600"

disk_percent=$(df -P / | awk 'NR==2 {gsub(/%/,"",$5); print $5}')
if [ "${disk_percent:-100}" -lt 85 ]; then
  printf 'PASS disk-usage percent=%s\n' "$disk_percent"
else
  printf 'FAIL disk-usage percent=%s\n' "${disk_percent:-unknown}" >&2
  failed=1
fi

if [ "$failed" -ne 0 ]; then
  logger -p daemon.err -t abs-healthcare-qc-monitor "one or more pilot health checks failed"
fi
exit "$failed"
