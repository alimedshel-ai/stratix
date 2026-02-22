#!/bin/bash
# ============================================
# Stratix — Alert Scanner
# فحص التنبيهات وتوليد تقارير كل 10 دقائق لمدة ساعة
# ============================================

echo "🔔 [Alert Scanner] بدأ الفحص: $(date '+%Y-%m-%d %H:%M:%S')"
echo "================================================"

# Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@stratix.com","password":"Admin123!"}' | \
  python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "❌ فشل تسجيل الدخول!"
  exit 1
fi
echo "  ✅ تسجيل الدخول ناجح"

for i in $(seq 1 6); do
  echo ""
  echo "--- فحص #$i | $(date '+%H:%M:%S') ---"
  
  # 1. Trigger alert engine scan
  SCAN_RESULT=$(curl -s -m30 -X POST http://localhost:3000/api/alert-engine/scan \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" 2>/dev/null)
  
  if [ -n "$SCAN_RESULT" ]; then
    ALERTS_GEN=$(echo "$SCAN_RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('alertsGenerated', 0))" 2>/dev/null)
    SCANNED=$(echo "$SCAN_RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('scanned', 0))" 2>/dev/null)
    echo "  🔍 فحص $SCANNED كيان → $ALERTS_GEN تنبيه جديد"
  else
    echo "  ⚠️ فشل الفحص"
  fi
  
  # 2. Get current alert count
  ALERTS=$(curl -s -m10 "http://localhost:3000/api/alerts?limit=100" \
    -H "Authorization: Bearer $TOKEN" 2>/dev/null)
  TOTAL=$(echo "$ALERTS" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('total', 0))" 2>/dev/null)
  UNREAD=$(echo "$ALERTS" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('unreadCount', 0))" 2>/dev/null)
  echo "  📊 إجمالي التنبيهات: $TOTAL | غير مقروءة: $UNREAD"
  
  # 3. Get system stats
  STATS=$(curl -s -m10 "http://localhost:3000/api/dashboard/stats" \
    -H "Authorization: Bearer $TOKEN" 2>/dev/null)
  if [ -n "$STATS" ]; then
    OBJ=$(echo "$STATS" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('objectives', 0))" 2>/dev/null)
    KPIS=$(echo "$STATS" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('kpis', 0))" 2>/dev/null)
    INI=$(echo "$STATS" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('initiatives', 0))" 2>/dev/null)
    echo "  📈 أهداف: $OBJ | مؤشرات: $KPIS | مبادرات: $INI"
  fi
  
  if [ $i -lt 6 ]; then
    sleep 600  # 10 دقائق
  fi
done

echo ""
echo "================================================"
echo "✅ [Alert Scanner] انتهى: $(date '+%Y-%m-%d %H:%M:%S')"
