/**
 * Stratix — Company Health Reports API
 * ═══════════════════════════════════════
 * "صحة الشركة كلوحة أم" — كل إدارة تغذي جزء معين:
 *   المالية → البعد المالي
 *   العمليات → البعد التشغيلي
 *   الموارد البشرية → البعد البشري + الثقافي
 *   التسويق → البعد التسويقي
 *   القيادة (executive) → كل الأبعاد
 *
 * أمان:
 *   - company_id من JWT فقط (لا query params)
 *   - textContent style (لا escapeHtml regex)
 *   - التحقق من صلاحية الإدارة server-side
 */

const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');

const router = express.Router();

// ═══════════════════════════════════════
// الأبعاد المسموحة + ربط الإدارة بالبعد
// ═══════════════════════════════════════
const VALID_DIMENSIONS = ['financial', 'operational', 'cultural', 'marketing', 'hr'];
const VALID_UNITS = ['percent', 'currency', 'number', 'hours', 'days'];

// أي إدارة تقدر تدخل على أي بعد
const DEPT_TO_DIMENSIONS = {
    finance: ['financial'],
    operations: ['operational'],
    hr: ['hr', 'cultural'],
    marketing: ['marketing'],
    executive: VALID_DIMENSIONS,  // القيادة تقدر على كل شي
};

/**
 * GET /api/company-health/latest
 * آخر تقرير لكل بُعد — يستخدم entityId من JWT
 */
router.get('/latest', verifyToken, async (req, res) => {
    try {
        const entityId = req.user.activeEntityId;
        if (!entityId) {
            return res.status(400).json({ error: 'لا يوجد كيان نشط' });
        }

        // جلب آخر تقرير لكل بعد
        const reports = await prisma.companyHealthReport.findMany({
            where: { entityId },
            orderBy: { reportDate: 'desc' },
        });

        // تجميع حسب البعد — أول واحد (الأحدث) لكل بعد
        const latestByDimension = {};
        for (const r of reports) {
            if (!latestByDimension[r.dimension]) {
                latestByDimension[r.dimension] = r;
            }
        }

        res.json({
            entityId,
            dimensions: VALID_DIMENSIONS.map(dim => ({
                dimension: dim,
                report: latestByDimension[dim] || null,
            })),
        });
    } catch (error) {
        console.error('[company-health/latest] Error:', error.message);
        res.status(500).json({ error: 'فشل جلب بيانات صحة الشركة' });
    }
});

/**
 * GET /api/company-health/history
 * تاريخ التقارير مع فلترة (dimension, limit)
 */
router.get('/history', verifyToken, async (req, res) => {
    try {
        const entityId = req.user.activeEntityId;
        if (!entityId) {
            return res.status(400).json({ error: 'لا يوجد كيان نشط' });
        }

        const { dimension, limit = 20 } = req.query;
        const where = { entityId };
        if (dimension && VALID_DIMENSIONS.includes(dimension)) {
            where.dimension = dimension;
        }

        const reports = await prisma.companyHealthReport.findMany({
            where,
            orderBy: { reportDate: 'desc' },
            take: Math.min(parseInt(limit) || 20, 100),
            include: {
                reporter: {
                    select: { id: true, name: true }
                }
            }
        });

        res.json({ reports, total: reports.length });
    } catch (error) {
        console.error('[company-health/history] Error:', error.message);
        res.status(500).json({ error: 'فشل جلب التاريخ' });
    }
});

/**
 * POST /api/company-health/report
 * إدخال تقرير جديد — مع تحقق من صلاحية الإدارة
 */
router.post('/report', verifyToken, checkPermission('EDITOR'), async (req, res) => {
    try {
        const entityId = req.user.activeEntityId;
        if (!entityId) {
            return res.status(400).json({ error: 'لا يوجد كيان نشط' });
        }

        const {
            dimension,
            indicatorName,
            indicatorValue,
            targetValue,
            unit,
            department,
            reportDate,
            notes,
        } = req.body;

        // ── Validation ──
        if (!dimension || !indicatorName || indicatorValue === undefined ||
            targetValue === undefined || !unit || !department || !reportDate) {
            return res.status(400).json({
                error: 'الحقول المطلوبة: dimension, indicatorName, indicatorValue, targetValue, unit, department, reportDate'
            });
        }

        if (!VALID_DIMENSIONS.includes(dimension)) {
            return res.status(400).json({ error: `البعد غير صالح. المتاح: ${VALID_DIMENSIONS.join(', ')}` });
        }

        if (!VALID_UNITS.includes(unit)) {
            return res.status(400).json({ error: `الوحدة غير صالحة. المتاح: ${VALID_UNITS.join(', ')}` });
        }

        // ── صلاحية الإدارة ──
        const allowedDimensions = DEPT_TO_DIMENSIONS[department];
        if (!allowedDimensions) {
            return res.status(400).json({ error: `الإدارة غير صالحة: ${department}` });
        }
        if (!allowedDimensions.includes(dimension)) {
            return res.status(403).json({
                error: `إدارة ${department} غير مسموح لها بإدخال بيانات للبعد ${dimension}`,
                allowed: allowedDimensions,
            });
        }

        // ── حفظ ──
        const report = await prisma.companyHealthReport.create({
            data: {
                entityId,
                dimension,
                indicatorName,
                indicatorValue: parseFloat(indicatorValue),
                targetValue: parseFloat(targetValue),
                unit,
                department,
                reportDate: new Date(reportDate),
                notes: notes || null,
                reporterId: req.user.id,
            },
        });

        console.log(`✅ [company-health] ${department} → ${dimension}: ${indicatorName} = ${indicatorValue}/${targetValue}`);

        res.status(201).json({
            success: true,
            report: {
                id: report.id,
                dimension: report.dimension,
                indicatorName: report.indicatorName,
                indicatorValue: report.indicatorValue,
                targetValue: report.targetValue,
            },
        });
    } catch (error) {
        console.error('[company-health/report] Error:', error.message);
        res.status(500).json({ error: 'فشل حفظ التقرير' });
    }
});

/**
 * GET /api/company-health/summary
 * ملخص صحة الشركة — نسبة تحقق كل بعد
 */
router.get('/summary', verifyToken, async (req, res) => {
    try {
        const entityId = req.user.activeEntityId;
        if (!entityId) {
            return res.status(400).json({ error: 'لا يوجد كيان نشط' });
        }

        const reports = await prisma.companyHealthReport.findMany({
            where: { entityId },
            orderBy: { reportDate: 'desc' },
        });

        // أحدث تقرير لكل (dimension + indicatorName)
        const latestIndicators = {};
        for (const r of reports) {
            const key = `${r.dimension}::${r.indicatorName}`;
            if (!latestIndicators[key]) {
                latestIndicators[key] = r;
            }
        }

        // حساب نسبة التحقق لكل بعد
        const dimensionNames = {
            financial: 'المالي',
            operational: 'التشغيلي',
            cultural: 'الثقافي',
            marketing: 'التسويقي',
            hr: 'البشري',
        };
        const dimensionIcons = {
            financial: '💰',
            operational: '⚙️',
            cultural: '🧬',
            marketing: '📢',
            hr: '👥',
        };

        const summary = VALID_DIMENSIONS.map(dim => {
            const indicators = Object.values(latestIndicators)
                .filter(r => r.dimension === dim);

            if (indicators.length === 0) {
                return {
                    dimension: dim,
                    name: dimensionNames[dim],
                    icon: dimensionIcons[dim],
                    score: 0,
                    indicatorCount: 0,
                    status: 'no_data',
                    lastUpdate: null,
                };
            }

            // متوسط نسبة التحقق
            const avgScore = indicators.reduce((sum, r) => {
                const pct = r.targetValue > 0 ? (r.indicatorValue / r.targetValue) * 100 : 0;
                return sum + Math.min(pct, 150); // cap at 150% لتجنب التشويه
            }, 0) / indicators.length;

            const lastUpdate = indicators.reduce((latest, r) => {
                return r.reportDate > latest ? r.reportDate : latest;
            }, indicators[0].reportDate);

            let status = 'critical';
            if (avgScore >= 90) status = 'excellent';
            else if (avgScore >= 70) status = 'good';
            else if (avgScore >= 50) status = 'warning';

            return {
                dimension: dim,
                name: dimensionNames[dim],
                icon: dimensionIcons[dim],
                score: Math.round(avgScore * 10) / 10,
                indicatorCount: indicators.length,
                status,
                lastUpdate,
            };
        });

        // النتيجة الكلية
        const activeScores = summary.filter(s => s.status !== 'no_data');
        const overallScore = activeScores.length > 0
            ? Math.round(activeScores.reduce((sum, s) => sum + s.score, 0) / activeScores.length * 10) / 10
            : 0;

        res.json({
            entityId,
            overallScore,
            activeDimensions: activeScores.length,
            totalDimensions: VALID_DIMENSIONS.length,
            dimensions: summary,
        });
    } catch (error) {
        console.error('[company-health/summary] Error:', error.message);
        res.status(500).json({ error: 'فشل حساب الملخص' });
    }
});

module.exports = router;
