#!/bin/bash
set -e

echo "💾 Creating backup..."

BACKUP_DIR=./backups
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
echo "Backing up database..."
docker-compose exec -T db pg_dump -U postgres app_db | gzip > "${BACKUP_DIR}/db_${TIMESTAMP}.sql.gz"

# Backup volumes
echo "Backing up volumes..."
docker-compose exec -T app tar czf - /app/uploads > "${BACKUP_DIR}/uploads_${TIMESTAMP}.tar.gz"

# Clean old backups (keep last 7 days)
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "✅ Backup complete: ${TIMESTAMP}"
echo "Files:"
ls -lh ${BACKUP_DIR}/*${TIMESTAMP}*
