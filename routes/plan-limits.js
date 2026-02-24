/**
 * routes/plan-limits.js — API لفحص حدود الباقة واستهلاك الكيان
 * GET /api/plan-limits?entityId=xxx
 */

const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');
const { PLAN_LIMITS, RESOURCE_LABELS } = require('../config/plans');

const router = express.Router();

// =========================================================
// GET /api/plan-limits — جلب حدود الباقة والاستهلاك الحالي
// =========================================================

/**
 * @swagger
 * /api/plan-limits:
 *   get:
 *     summary: جلب حدود الباقة والاستهلاك الحالي للكيان
 *     description: يرجع قائمة بجميع الموارد المحدودة مع نسبة الاستهلاك والحالة (blocked/available)
 *     tags: [Plan Limits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: entityId
 *         schema: { type: string }
 *         description: معرّف الكيان (اختياري — يُؤخذ من الـ token تلقائياً)
 *     responses:
 *       200:
 *         description: بيانات الباقة والاستهلاك
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PlanLimits'
 *       400:
 *         description: entityId مطلوب
 *       404:
 *         description: الكيان غير موجود
 */
router.get('/', verifyToken, async (req, res) => {
    try {
        const entityId = req.query.entityId || req.user?.activeEntityId || req.user?.entityId;

        if (!entityId) {
            return res.status(400).json({ error: 'entityId مطلوب' });
        }

        // 1. جلب الكيان والاشتراك
        const entity = await prisma.entity.findUnique({
            where: { id: entityId },
            select: {
                id: true,
                legalName: true,
                companyId: true,
                company: {
                    select: {
                        nameAr: true,
                        subscription: {
                            select: { plan: true, status: true, startDate: true, endDate: true }
                        }
                    }
                }
            }
        });

        if (!entity) {
            return res.status(404).json({ error: 'الكيان غير موجود' });
        }

        const subscription = entity.company?.subscription;
        const plan = subscription?.plan || 'TRIAL';
        const planLimits = PLAN_LIMITS[plan] || PLAN_LIMITS.TRIAL;

        // 2. حساب الاستهلاك الفعلي
        const activeVersion = await prisma.strategyVersion.findFirst({
            where: { entityId, isActive: true },
            select: { id: true }
        });

        const versionId = activeVersion?.id;

        const [
            usersCount,
            objectivesCount,
            kpisCount,
            initiativesCount,
            assessmentsCount,
            integrationsCount,
            entitiesCount,
        ] = await Promise.all([
            prisma.member.count({ where: { entityId } }),
            versionId ? prisma.strategicObjective.count({ where: { versionId } }) : 0,
            versionId ? prisma.kPI.count({ where: { versionId } }) : 0,
            versionId ? prisma.strategicInitiative.count({ where: { versionId } }) : 0,
            prisma.assessment.count({ where: { entityId } }),
            prisma.integration.count({ where: { entityId } }),
            entity.companyId ? prisma.entity.count({ where: { companyId: entity.companyId } }) : 1,
        ]);

        const usage = {
            maxUsers: usersCount,
            maxObjectives: objectivesCount,
            maxKpis: kpisCount,
            maxInitiatives: initiativesCount,
            maxAssessments: assessmentsCount,
            maxIntegrations: integrationsCount,
            maxEntities: entitiesCount,
        };

        // 3. بناء الاستجابة
        const resources = {};
        for (const [key, limit] of Object.entries(planLimits)) {
            const current = usage[key] || 0;
            resources[key] = {
                label: RESOURCE_LABELS[key] || key,
                limit: limit === Infinity ? 'unlimited' : limit,
                current,
                remaining: limit === Infinity ? 'unlimited' : Math.max(0, limit - current),
                percentage: limit === Infinity ? 0 : Math.round((current / limit) * 100),
                blocked: limit !== Infinity && current >= limit,
            };
        }

        res.json({
            plan,
            planName: plan === 'TRIAL' ? 'مجاني' : plan === 'BASIC' ? 'أساسي' : plan === 'PRO' ? 'احترافي' : 'مؤسسات',
            status: subscription?.status || 'ACTIVE',
            startDate: subscription?.startDate || null,
            endDate: subscription?.endDate || null,
            entityId,
            entityName: entity.legalName,
            companyName: entity.company?.nameAr || null,
            resources,
        });

    } catch (error) {
        console.error('[plan-limits] Error:', error.message);
        res.status(500).json({ error: 'خطأ في جلب حدود الباقة' });
    }
});

module.exports = router;
