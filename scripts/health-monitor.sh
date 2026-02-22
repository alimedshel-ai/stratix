#!/bin/bash
# ============================================
# Stratix — Health Monitor
# مراقبة صحة النظام كل دقيقة لمدة ساعة
# ============================================

echo "🏥 [Health Monitor] بدأت المراقبة: $(date '+%Y-%m-%d %H:%M:%S')"
echo "================================================"

TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@stratix.com","password":"Admin123!"}' | \
  python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "❌ فشل الحصول على Token!"
  exit 1
fi

for i in $(seq 1 60); do
  TIMESTAMP=$(date '+%H:%M:%S')
  echo ""
  echo "--- فحص #$i | $TIMESTAMP ---"
  
  # 1. فحص السيرفر
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -m5 http://localhost:3000/login)
  if [ "$HTTP_CODE" = "200" ]; then
    echo "  ✅ السيرفر: HTTP $HTTP_CODE"
  else
    echo "  ❌ السيرفر: HTTP $HTTP_CODE"
  fi
  
  # 2. فحص API
  API_CODE=$(curl -s -o /dev/null -w "%{http_code}" -m5 \
    http://localhost:3000/api/dashboard/stats \
    -H "Authorization: Bearer $TOKEN")
  if [ "$API_CODE" = "200" ]; then
    echo "  ✅ API: HTTP $API_CODE"
  else
    echo "  ⚠️ API: HTTP $API_CODE"
  fi
  
  # 3. فحص قاعدة البيانات
  DB_SIZE=$(du -h "$(dirname "$0")/../prisma/dev.db" 2>/dev/null | cut -f1)
  RECORD_COUNT=$(sqlite3 "$(dirname "$0")/../prisma/dev.db" "SELECT COUNT(*) FROM users;" 2>/dev/null)
  echo "  📊 قاعدة البيانات: $DB_SIZE | المستخدمون: $RECORD_COUNT"
  
  # 4. فحص الذاكرة + المعالج
  MEM=$(ps aux | grep "node server.js" | grep -v grep | awk '{print $4}')
  CPU=$(ps aux | grep "node server.js" | grep -v grep | awk '{print $3}')
  echo "  🖥️  Node: CPU=${CPU:-0}% | RAM=${MEM:-0}%"
  
  # 5. فحص المساحة
  DISK=$(df -h / | tail -1 | awk '{print $4}')
  echo "  💾 المساحة المتاحة: $DISK"
  
  sleep 60
done

echo ""
echo "================================================"
echo "✅ [Health Monitor] انتهت المراقبة: $(date '+%Y-%m-%d %H:%M:%S')"
