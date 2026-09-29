#!/bin/sh
set -e

# ==============================================================================
# MATRIX - Automated PostgreSQL Backup Script
# ==============================================================================

BACKUP_DIR="${BACKUP_DIR:-/var/www/html/storage/backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/matrix_backup_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_DATABASE:-matrix}"
DB_USER="${DB_USERNAME:-postgres}"
export PGPASSWORD="${DB_PASSWORD:-}"

echo "[$(date)] Starting PostgreSQL backup for database '${DB_NAME}'..."

pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" --clean --if-exists --no-owner | gzip > "${BACKUP_FILE}"

echo "[$(date)] Backup completed successfully: ${BACKUP_FILE} ($(du -h "${BACKUP_FILE}" | cut -f1))"

# Retention: keep last 7 days of backups
find "${BACKUP_DIR}" -name "matrix_backup_*.sql.gz" -mtime +7 -exec rm {} \;
echo "[$(date)] Retention policy applied (older than 7 days removed)."
