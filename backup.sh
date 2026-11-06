#!/bin/bash
# Backup Script for Makeupi Store (مكياجي – منبع الجمال)
# Saves SQLite database and uploads into timestamped tarball

BACKUP_DIR="/var/backups/makeupi-store"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="makeupi_backup_${TIMESTAMP}.tar.gz"

mkdir -p "$BACKUP_DIR"

echo "🌸 Starting backup at $(date)..."

# Safe SQLite snapshot
sqlite3 "$APP_DIR/server/data/makeupi.db" ".backup '$BACKUP_DIR/makeupi_snapshot_${TIMESTAMP}.db'"

# Archive database snapshot and uploads
tar -czf "$BACKUP_DIR/$FILENAME" \
    -C "$BACKUP_DIR" "makeupi_snapshot_${TIMESTAMP}.db" \
    -C "$APP_DIR/server" "uploads"

# Remove temporary snapshot
rm "$BACKUP_DIR/makeupi_snapshot_${TIMESTAMP}.db"

# Delete backups older than 30 days
find "$BACKUP_DIR" -type f -name "makeupi_backup_*.tar.gz" -mtime +30 -exec rm {} \;

echo "✅ Backup completed successfully: $BACKUP_DIR/$FILENAME"
