#!/bin/bash
# ============================================
# Stratix — Hourly Backup Service
# نسخ احتياطي كل 5 دقائق لمدة ساعة
# ============================================

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="$PROJECT_DIR/backups/$(date +%Y%m%d)"
mkdir -p "$BACKUP_DIR"

echo "💾 [Backup Service] بدأ النسخ الاحتياطي: $(date '+%Y-%m-%d %H:%M:%S')"
echo "  📁 المجلد: $BACKUP_DIR"
echo "================================================"

for i in $(seq 1 12); do
  TIMESTAMP=$(date +%H%M%S)
  
  # 1. نسخ قاعدة البيانات (SQLite)
  cp "$PROJECT_DIR/prisma/dev.db" "$BACKUP_DIR/dev-$TIMESTAMP.db" 2>/dev/null
  DB_SIZE=$(du -h "$BACKUP_DIR/dev-$TIMESTAMP.db" 2>/dev/null | cut -f1)
  
  # 2. نسخ ملفات الإعداد المهمة
  tar -czf "$BACKUP_DIR/config-$TIMESTAMP.tar.gz" \
    -C "$PROJECT_DIR" \
    prisma/schema.prisma \
    .env \
    server.js \
    package.json \
    2>/dev/null
  CONFIG_SIZE=$(du -h "$BACKUP_DIR/config-$TIMESTAMP.tar.gz" 2>/dev/null | cut -f1)
  
  echo ""
  echo "  📦 نسخة #$i | $(date '+%H:%M:%S')"
  echo "     قاعدة البيانات: $DB_SIZE"
  echo "     الإعدادات: $CONFIG_SIZE"
  
  # Show total backup size
  TOTAL_SIZE=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
  echo "     إجمالي المجلد: $TOTAL_SIZE"
  
  if [ $i -lt 12 ]; then
    sleep 300  # 5 دقائق
  fi
done

echo ""
echo "================================================"
# Cleanup: keep only last 3 backups
BACKUP_COUNT=$(ls "$BACKUP_DIR"/dev-*.db 2>/dev/null | wc -l)
echo "  📊 عدد النسخ: $BACKUP_COUNT"
FINAL_SIZE=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
echo "  💾 الحجم الإجمالي: $FINAL_SIZE"
echo "✅ [Backup Service] انتهى: $(date '+%Y-%m-%d %H:%M:%S')"
