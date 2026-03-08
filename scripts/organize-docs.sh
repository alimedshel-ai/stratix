#!/bin/bash
# ═══════════════════════════════════════════════
# 📁 سكربت ترتيب مجلد docs/
# ═══════════════════════════════════════════════
# ينقل 48 ملف يتيم من docs/ إلى مجلداتهم المناسبة
# آمن 100% — لا يمس أي كود (HTML/JS/CSS)

set -e
DOCS_DIR="$(cd "$(dirname "$0")/../docs" && pwd)"
echo "📁 مجلد الوثائق: $DOCS_DIR"
echo ""

# ─── 1. الرؤية (01-vision) ───
echo "📌 1/7 — نقل ملفات الرؤية إلى 01-vision/"
for f in compliance-ai-vision.md compliance-vision.md finance-vision.md sales-vision.md vision-gap-analysis.md; do
  [ -f "$DOCS_DIR/$f" ] && mv "$DOCS_DIR/$f" "$DOCS_DIR/01-vision/" && echo "  ✅ $f" || echo "  ⏭️ $f (غير موجود)"
done

# ─── 2. الخطط (02-plans) ───
echo ""
echo "📌 2/7 — نقل ملفات الخطط إلى 02-plans/"
for f in 5-day-plan.md implementation-plan-4levels.md implementation-plan-final.md journey-implementation-plan.md launch-readiness.md phase6-11-plan.md smart-paths-implementation-plan.md steps-6a-to-8.md three-paths-plan.md unified-implementation-plan.md; do
  [ -f "$DOCS_DIR/$f" ] && mv "$DOCS_DIR/$f" "$DOCS_DIR/02-plans/" && echo "  ✅ $f" || echo "  ⏭️ $f (غير موجود)"
done

# ─── 3. التنفيذ (03-implementation) ───
echo ""
echo "📌 3/7 — نقل ملفات التنفيذ إلى 03-implementation/"
for f in onboarding-script.md platform-workflow.md; do
  [ -f "$DOCS_DIR/$f" ] && mv "$DOCS_DIR/$f" "$DOCS_DIR/03-implementation/" && echo "  ✅ $f" || echo "  ⏭️ $f (غير موجود)"
done

# ─── 4. التحليل (04-analysis) ───
echo ""
echo "📌 4/7 — نقل ملفات التحليل إلى 04-analysis/"
for f in blueprint-analysis.md blueprint-v3-analysis.md cfo-board-pitch-analysis.md flow-audit.md journey-analysis.md master-blueprint-analysis.md new-model-analysis.md pain-driven-path-analysis.md paths-reality-check.md paths-reality-check-v2.md review-observations.md rules-engine-analysis.md scenario-analysis.md smart-links-matrix.md strategic-loop-analysis.md strategic-path.md; do
  [ -f "$DOCS_DIR/$f" ] && mv "$DOCS_DIR/$f" "$DOCS_DIR/04-analysis/" && echo "  ✅ $f" || echo "  ⏭️ $f (غير موجود)"
done

# ─── 5. المنهجيات (05-methodology) ───
echo ""
echo "📌 5/7 — نقل ملفات المنهجيات إلى 05-methodology/"
for f in compliance-framework.md gov-fees.md strategic-methodology.md; do
  [ -f "$DOCS_DIR/$f" ] && mv "$DOCS_DIR/$f" "$DOCS_DIR/05-methodology/" && echo "  ✅ $f" || echo "  ⏭️ $f (غير موجود)"
done

# ─── 6. مسارات المستخدم (05-user-scenarios) ───
echo ""
echo "📌 6/7 — نقل ملفات مسارات المستخدم إلى 05-user-scenarios/"
for f in USER_JOURNEY_PLAN.md customer-journey-phases.md customer-journey-v2.md deep-dive-discovery-flow.md flowchart-complete.md full-customer-journey.md full-journey-0-to-11.md user-flow-detailed.md user-journey-map.md v10-roles-to-paths-mapping.md; do
  [ -f "$DOCS_DIR/$f" ] && mv "$DOCS_DIR/$f" "$DOCS_DIR/05-user-scenarios/" && echo "  ✅ $f" || echo "  ⏭️ $f (غير موجود)"
done

# ─── 7. المراجع (07-reference) ───
echo ""
echo "📌 7/7 — نقل ملفات المراجع إلى 07-reference/"
for f in test-matrix-and-dependencies.md testing-checklist.md; do
  [ -f "$DOCS_DIR/$f" ] && mv "$DOCS_DIR/$f" "$DOCS_DIR/07-reference/" && echo "  ✅ $f" || echo "  ⏭️ $f (غير موجود)"
done

# ─── النتيجة ───
echo ""
echo "═══════════════════════════════════════"
echo "📊 النتيجة — الملفات المتبقية في docs/:"
echo "═══════════════════════════════════════"
ls "$DOCS_DIR"/*.md 2>/dev/null || echo "  🎯 لا توجد ملفات يتيمة — الجذر نظيف!"
echo ""
echo "✅ تم الترتيب بنجاح!"
