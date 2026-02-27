const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');
const { calculateBreakEven, generateInsights, formatCurrency } = require('../lib/break-even-engine');

const router = express.Router();

// ============================================================
// 📊 BREAK-EVEN API — حساب نقطة التعادل
// ============================================================

// ========== POST: Calculate Break-Even for an entity ==========
router.post('/calculate/:entityId', verifyToken, async (req, res) => {
    try {
        const { entityId } = req.params;

        // 1. Get entity with sector config
        const entity = await prisma.entity.findUnique({
            where: { id: entityId },
            include: { sectorConfig: true }
        });

        if (!entity) {
            return res.status(404).json({ error: 'الكيان غير موجود' });
        }

        if (!entity.sectorConfig) {
            return res.status(400).json({
                error: 'لم يتم ربط الكيان بقطاع. يرجى اختيار القطاع أولاً.',
                needsSectorConfig: true
            });
        }

        const sectorConfig = entity.sectorConfig;
        const formulas = sectorConfig.formulas ? JSON.parse(sectorConfig.formulas) : null;

        if (!formulas) {
            return res.status(400).json({ error: 'لا توجد معادلات محددة لهذا القطاع' });
        }

        // 2. Get CFO department data
        const financeDept = await prisma.department.findFirst({
            where: {
                entityId: entityId,
                code: 'FINANCE'
            }
        });

        if (!financeDept || !financeDept.dataSummary) {
            return res.status(400).json({
                error: 'لم يتم ملء البيانات المالية بعد. أكمل الاستبيان أولاً.',
                needsData: true,
                missingDepartment: 'FINANCE'
            });
        }

        // 3. Parse answers
        let answers;
        try {
            const dataSummary = JSON.parse(financeDept.dataSummary);
            // Remove _meta from answers
            const { _meta, ...rawAnswers } = dataSummary;
            answers = rawAnswers;
        } catch (e) {
            return res.status(400).json({ error: 'فشل في قراءة البيانات المالية المحفوظة' });
        }

        // 4. Check required fields
        const breakEvenFields = sectorConfig.breakEvenFields
            ? JSON.parse(sectorConfig.breakEvenFields)
            : Object.keys(formulas);

        const missingFields = breakEvenFields.filter(f => !answers[f] || answers[f] === '');
        if (missingFields.length > 0) {
            return res.status(400).json({
                error: `بيانات ناقصة: ${missingFields.length} حقل مطلوب لم يُملأ`,
                missingFields,
                completion: Math.round(((breakEvenFields.length - missingFields.length) / breakEvenFields.length) * 100)
            });
        }

        // 5. Calculate Break-Even
        const calculation = calculateBreakEven(formulas, answers);

        if (!calculation.success && !calculation.results?.breakEvenRevenue) {
            return res.status(500).json({
                error: 'فشل في حساب نقطة التعادل',
                details: calculation.errors
            });
        }

        // 6. Generate insights
        const insights = generateInsights(
            calculation.results,
            sectorConfig.benchmarks,
            sectorConfig
        );

        // 7. Save result to department (for dashboard access)
        const breakEvenResult = {
            calculatedAt: new Date().toISOString(),
            sectorCode: sectorConfig.code,
            sectorName: sectorConfig.nameAr,
            unitLabel: sectorConfig.unitLabelAr,
            results: calculation.results,
            insights,
            inputAnswers: answers,
        };

        await prisma.department.update({
            where: { id: financeDept.id },
            data: {
                dataSummary: JSON.stringify({
                    ...answers,
                    _meta: {
                        savedBy: req.user.id,
                        savedAt: new Date().toISOString(),
                        breakEvenCalculated: true
                    },
                    _breakEvenResult: breakEvenResult
                })
            }
        });

        // 8. Response
        res.json({
            success: true,
            entityName: entity.displayName || entity.legalName,
            sectorName: sectorConfig.nameAr,
            sectorIcon: sectorConfig.icon,
            unitLabel: sectorConfig.unitLabelAr,
            results: {
                breakEvenRevenue: calculation.results.breakEvenRevenue,
                breakEvenRevenueFormatted: formatCurrency(calculation.results.breakEvenRevenue),
                breakEvenUnits: calculation.results.breakEvenUnits ? Math.ceil(calculation.results.breakEvenUnits) : null,
                fixedCosts: calculation.results.fixedCosts,
                fixedCostsFormatted: formatCurrency(calculation.results.fixedCosts),
                contributionMarginPct: calculation.results.contributionMarginPct,
                annualRevenue: calculation.results.annualRevenue,
                annualRevenueFormatted: formatCurrency(calculation.results.annualRevenue),
                safetyMargin: calculation.results.safetyMargin,
                ...calculation.results
            },
            insights,
            calculationErrors: calculation.errors || []
        });

    } catch (error) {
        console.error('Break-Even calculation error:', error);
        res.status(500).json({ error: 'خطأ في حساب نقطة التعادل', details: error.message });
    }
});

// ========== GET: Get last Break-Even result ==========
router.get('/result/:entityId', verifyToken, async (req, res) => {
    try {
        const { entityId } = req.params;

        const financeDept = await prisma.department.findFirst({
            where: { entityId, code: 'FINANCE' }
        });

        if (!financeDept || !financeDept.dataSummary) {
            return res.status(404).json({ error: 'لا توجد نتائج محفوظة' });
        }

        const data = JSON.parse(financeDept.dataSummary);
        const result = data._breakEvenResult;

        if (!result) {
            return res.status(404).json({
                error: 'لم يتم حساب نقطة التعادل بعد',
                needsCalculation: true
            });
        }

        res.json(result);
    } catch (error) {
        console.error('Error fetching break-even result:', error);
        res.status(500).json({ error: 'خطأ في جلب النتائج' });
    }
});

module.exports = router;
