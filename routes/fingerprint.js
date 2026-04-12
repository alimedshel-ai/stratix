/**
 * routes/fingerprint.js
 * نظام البصمة الاستراتيجية — تحديث السيولة + إعادة التقييم التلقائي
 *
 * Endpoints:
 *   PATCH /api/fingerprint/liquidity   — تحديث السيولة + re-eval إذا تغير النمط
 *   GET   /api/fingerprint/:entityId   — قراءة البصمة الحالية + النمط + Risk Score
 */

const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// ═══════════════════════════════════════════════════════════
// الدوال المساعدة
// ═══════════════════════════════════════════════════════════

/**
 * تحويل عدد الأشهر إلى فئة نصية
 */
function calculateLiquidityCategory(months) {
  const m = parseFloat(months) || 0;
  if (m <= 0.5)  return 'critical';
  if (m <= 1.5)  return 'danger';
  if (m <= 3)    return 'tight';
  if (m <= 6)    return 'stable';
  if (m <= 12)   return 'comfortable';
  return 'abundant';
}

/**
 * حساب Risk Score (0-10) باستخدام sigmoid
 * C = السيولة (أشهر)، K = نضج القيادة (1-5)، G = الهدف (1-5)
 */
function calculateRiskScore({ liquidityExact = 6, leadershipLevel = 3, goalLevel = 3 }) {
  const C = parseFloat(liquidityExact) || 6;
  const K = parseInt(leadershipLevel)  || 3;
  const G = parseInt(goalLevel)        || 3;

  const liquidityRisk   = Math.max(0, 5 - C / 3);       // 0–5
  const leadershipRisk  = (5 - K) * 0.6;                // 0–2.4
  const goalRisk        = G === 5 ? 1 : 0;              // طموح مفرط

  const raw = liquidityRisk + leadershipRisk + goalRisk;
  const sigmoid = 10 / (1 + Math.exp(-(raw - 5) * 0.5));
  return Math.min(Math.round(sigmoid * 10) / 10, 10);
}

/**
 * تشغيل محرك القواعد على أبعاد بصمة واحدة
 * يُعيد أول قاعدة تنطبق شروطها (الأعلى أولوية)
 */
function matchRules(rules, dimensions) {
  for (const rule of rules) {
    let cond;
    try { cond = typeof rule.condition === 'string' ? JSON.parse(rule.condition) : rule.condition; }
    catch { continue; }

    if (evaluateCondition(cond, dimensions)) return rule;
  }
  return null;
}

function evaluateCondition(cond, dims) {
  // قاعدة بسيطة: { key, value }
  if (cond.key && cond.value !== undefined) {
    return compareValue(dims[cond.key], '=', cond.value);
  }

  // قاعدة بسيطة مع operator: { key, operator, value }
  if (cond.key && cond.operator) {
    return compareValue(dims[cond.key], cond.operator, cond.value);
  }

  // منطق OR
  if (cond.logic === 'OR' && Array.isArray(cond.conditions)) {
    return cond.conditions.some(c => evaluateCondition(c, dims));
  }

  // منطق AND
  if (cond.logic === 'AND' && Array.isArray(cond.conditions)) {
    return cond.conditions.every(c => evaluateCondition(c, dims));
  }

  // in: []
  if (cond.key && Array.isArray(cond.in)) {
    return cond.in.includes(dims[cond.key]);
  }

  return false;
}

function compareValue(actual, operator, expected) {
  if (actual === undefined || actual === null) return false;
  const a = isNaN(actual)   ? actual   : parseFloat(actual);
  const b = isNaN(expected) ? expected : parseFloat(expected);
  switch (operator) {
    case '=':   case 'eq':  return a === b || actual === expected;
    case '<':   case 'lt':  return a < b;
    case '<=':  case 'lte': return a <= b;
    case '>':   case 'gt':  return a > b;
    case '>=':  case 'gte': return a >= b;
    default: return actual === expected;
  }
}

// ═══════════════════════════════════════════════════════════
// PATCH /api/fingerprint/liquidity
// تحديث السيولة + re-eval + تنبيه إذا تغير النمط
// ═══════════════════════════════════════════════════════════
router.patch('/liquidity', verifyToken, async (req, res) => {
  try {
    const { liquidityExact } = req.body;
    const userId   = req.user.id;
    const entityId = req.user.activeEntityId || req.user.entityId;

    if (liquidityExact === undefined || liquidityExact === null) {
      return res.status(400).json({ error: 'liquidityExact مطلوب' });
    }

    const months = parseFloat(liquidityExact);
    if (isNaN(months) || months < 0) {
      return res.status(400).json({ error: 'قيمة liquidityExact غير صالحة' });
    }

    // 1. قراءة الحالة الحالية
    const entity = await prisma.entity.findUnique({
      where: { id: entityId },
      select: { id: true, liquidityExact: true, metadata: true }
    });
    if (!entity) return res.status(404).json({ error: 'الكيان غير موجود' });

    const oldMonths   = entity.liquidityExact || 0;
    const oldCategory = calculateLiquidityCategory(oldMonths);
    const newCategory = calculateLiquidityCategory(months);

    // 2. تحديث قيمة السيولة في DB
    await prisma.entity.update({
      where: { id: entityId },
      data:  { liquidityExact: months }
    });

    // 3. استخراج باقي أبعاد البصمة من metadata
    let meta = {};
    try { meta = entity.metadata ? JSON.parse(entity.metadata) : {}; } catch {}

    const dimensions = {
      liquidityExact: months,
      liquidityCategory: newCategory,
      stage:  meta.stage  || meta.stageKey  || 'startup',
      res:    newCategory === 'critical' || newCategory === 'danger' ? 'critical' : (meta.res || 'medium'),
      fin:    meta.fin    || 'medium',
      gov:    meta.gov    || 'partial',
      scale:  meta.scale  || 'hard'
    };

    // 4. تشغيل محرك القواعد
    const rules      = await prisma.journeyRule.findMany({
      where:   { isActive: true },
      orderBy: { priority: 'desc' }
    });
    const matchedRule = matchRules(rules, dimensions);
    const newPattern  = matchedRule?.patternKey || null;

    // 5. قراءة النمط القديم من CompanyPattern
    const company = await prisma.company.findFirst({
      where: { entities: { some: { id: entityId } } },
      select: { id: true, pattern: true }
    });

    const oldPattern = company?.pattern?.patternKey || null;
    const patternChanged = newPattern && newPattern !== oldPattern;

    // 6. تحديث CompanyPattern إذا تغير النمط
    if (patternChanged && company) {
      await prisma.companyPattern.upsert({
        where:  { companyId: company.id },
        update: { patternKey: newPattern },
        create: {
          companyId:    company.id,
          patternKey:   newPattern,
          pain:         meta.pain     || '',
          ambition:     meta.ambition || ''
        }
      });
    }

    // 7. حساب Risk Score المحدث
    const riskScore = calculateRiskScore({ liquidityExact: months });

    // 8. تحديد نوع التنبيه
    const CRITICAL_CATEGORIES = ['critical', 'danger'];
    const isCriticalNow  = CRITICAL_CATEGORIES.includes(newCategory);
    const wasCritical    = CRITICAL_CATEGORIES.includes(oldCategory);

    let alert = null;
    if (isCriticalNow && !wasCritical) {
      alert = {
        type:    'emergency',
        level:   newCategory === 'critical' ? 'critical' : 'high',
        titleAr: newCategory === 'critical'
          ? '🚨 تنبيه حرج: السيولة أقل من أسبوعين'
          : '⚠️ تحذير: السيولة دون شهر ونصف',
        messageAr: matchedRule?.reasonAr || 'يُنصح بمراجعة خطة المنشأة فوراً',
        action: 'emergency_plan_required'
      };
    } else if (patternChanged) {
      alert = {
        type:     'strategic_shift',
        level:    'medium',
        titleAr:  '📊 تحول استراتيجي مُكتشف',
        messageAr: `تغير مسار منشأتك من "${oldPattern}" إلى "${newPattern}". ${matchedRule?.reasonAr || ''}`,
        action:   'review_journey'
      };
    }

    return res.json({
      success: true,
      liquidity: {
        old:      { months: oldMonths,  category: oldCategory },
        new:      { months,             category: newCategory }
      },
      pattern: {
        old:     oldPattern,
        new:     newPattern,
        changed: patternChanged
      },
      riskScore,
      matchedRule: matchedRule ? {
        id:         matchedRule.id,
        patternKey: matchedRule.patternKey,
        reasonAr:   matchedRule.reasonAr,
        priority:   matchedRule.priority
      } : null,
      alert
    });

  } catch (err) {
    console.error('[fingerprint/liquidity]', err);
    return res.status(500).json({ error: 'خطأ في تحديث السيولة' });
  }
});

// ═══════════════════════════════════════════════════════════
// GET /api/fingerprint/:entityId
// قراءة البصمة الكاملة + النمط + Risk Score
// ═══════════════════════════════════════════════════════════
router.get('/:entityId', verifyToken, async (req, res) => {
  try {
    const { entityId } = req.params;

    const entity = await prisma.entity.findUnique({
      where:  { id: entityId },
      select: { id: true, liquidityExact: true, metadata: true,
                sectorKey: true, stageKey: true, teamSizeKey: true }
    });
    if (!entity) return res.status(404).json({ error: 'الكيان غير موجود' });

    const months   = entity.liquidityExact || 0;
    const category = calculateLiquidityCategory(months);
    let meta = {};
    try { meta = entity.metadata ? JSON.parse(entity.metadata) : {}; } catch {}

    const dimensions = {
      liquidityExact:   months,
      liquidityCategory: category,
      stage:  entity.stageKey || meta.stage  || 'startup',
      res:    category === 'critical' || category === 'danger' ? 'critical' : (meta.res || 'medium'),
      fin:    meta.fin   || 'medium',
      gov:    meta.gov   || 'partial',
      scale:  meta.scale || 'hard'
    };

    const rules      = await prisma.journeyRule.findMany({
      where:   { isActive: true },
      orderBy: { priority: 'desc' }
    });
    const matchedRule = matchRules(rules, dimensions);
    const riskScore   = calculateRiskScore({ liquidityExact: months });

    const company = await prisma.company.findFirst({
      where:  { entities: { some: { id: entityId } } },
      select: { id: true, pattern: true }
    });

    return res.json({
      success: true,
      fingerprint: {
        entityId,
        dimensions,
        riskScore,
        riskLevel: riskScore >= 7 ? 'high' : riskScore >= 4 ? 'medium' : 'low'
      },
      currentPattern: company?.pattern?.patternKey || null,
      matchedRule: matchedRule ? {
        patternKey: matchedRule.patternKey,
        reasonAr:   matchedRule.reasonAr,
        category:   matchedRule.category
      } : null
    });

  } catch (err) {
    console.error('[fingerprint/get]', err);
    return res.status(500).json({ error: 'خطأ في قراءة البصمة' });
  }
});

module.exports = router;
