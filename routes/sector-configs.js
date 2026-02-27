const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// ============================================================
// 🏭 SECTOR CONFIGS API — إعدادات القطاعات الذكية
// ============================================================

// ========== GET all sector configs ==========
router.get('/', async (req, res) => {
    try {
        const configs = await prisma.sectorConfig.findMany({
            where: { isActive: true },
            select: {
                id: true,
                code: true,
                nameAr: true,
                nameEn: true,
                icon: true,
                color: true,
                unitLabelAr: true,
                unitLabelEn: true,
                cfoQuestions: true,
                cmoQuestions: true,
                cooQuestions: true,
                _count: { select: { entities: true } }
            },
            orderBy: { nameAr: 'asc' }
        });

        res.json({
            total: configs.length,
            configs
        });
    } catch (error) {
        console.error('Error fetching sector configs:', error);
        res.status(500).json({ error: 'فشل في جلب إعدادات القطاعات' });
    }
});

// ========== GET single sector config by code ==========
router.get('/:code', async (req, res) => {
    try {
        const { code } = req.params;

        const config = await prisma.sectorConfig.findUnique({
            where: { code: code.toUpperCase() }
        });

        if (!config) {
            return res.status(404).json({
                error: 'القطاع غير موجود',
                availableCodes: await prisma.sectorConfig.findMany({
                    where: { isActive: true },
                    select: { code: true, nameAr: true }
                })
            });
        }

        // Parse JSON fields
        res.json({
            id: config.id,
            code: config.code,
            nameAr: config.nameAr,
            nameEn: config.nameEn,
            icon: config.icon,
            color: config.color,
            unitLabelAr: config.unitLabelAr,
            unitLabelEn: config.unitLabelEn,
            cfoQuestions: config.cfoQuestions ? JSON.parse(config.cfoQuestions) : null,
            cmoQuestions: config.cmoQuestions ? JSON.parse(config.cmoQuestions) : null,
            cooQuestions: config.cooQuestions ? JSON.parse(config.cooQuestions) : null,
            formulas: config.formulas ? JSON.parse(config.formulas) : null,
            benchmarks: config.benchmarks ? JSON.parse(config.benchmarks) : null,
            breakEvenFields: config.breakEvenFields ? JSON.parse(config.breakEvenFields) : null,
        });
    } catch (error) {
        console.error('Error fetching sector config:', error);
        res.status(500).json({ error: 'فشل في جلب إعداد القطاع' });
    }
});

// ========== GET sector-specific questionnaire for a role ==========
router.get('/:code/questionnaire/:role', verifyToken, async (req, res) => {
    try {
        const { code, role } = req.params;

        const config = await prisma.sectorConfig.findUnique({
            where: { code: code.toUpperCase() }
        });

        if (!config) {
            return res.status(404).json({ error: 'القطاع غير موجود' });
        }

        // Map role to the correct questions field
        const roleFieldMap = {
            CFO: 'cfoQuestions',
            CMO: 'cmoQuestions',
            COO: 'cooQuestions',
        };

        const fieldName = roleFieldMap[role.toUpperCase()];
        if (!fieldName) {
            return res.status(400).json({
                error: 'الدور غير مدعوم للأسئلة المخصصة',
                supportedRoles: Object.keys(roleFieldMap)
            });
        }

        const questionsRaw = config[fieldName];
        if (!questionsRaw) {
            return res.status(404).json({
                error: `لا توجد أسئلة مخصصة لـ ${role} في قطاع ${config.nameAr}`,
                fallback: true // Signal frontend to use generic questions
            });
        }

        const questions = JSON.parse(questionsRaw);

        res.json({
            ...questions,
            sectorCode: config.code,
            sectorName: config.nameAr,
            sectorIcon: config.icon,
            unitLabel: config.unitLabelAr,
            benchmarks: config.benchmarks ? JSON.parse(config.benchmarks) : {},
            formulas: config.formulas ? JSON.parse(config.formulas) : null,
        });
    } catch (error) {
        console.error('Error fetching sector questionnaire:', error);
        res.status(500).json({ error: 'فشل في جلب الاستبيان المخصص' });
    }
});

// ========== Link entity to sector config ==========
router.post('/link-entity', verifyToken, async (req, res) => {
    try {
        const { entityId, sectorConfigCode } = req.body;

        if (!entityId || !sectorConfigCode) {
            return res.status(400).json({ error: 'entityId و sectorConfigCode مطلوبة' });
        }

        // Find the sector config
        const config = await prisma.sectorConfig.findUnique({
            where: { code: sectorConfigCode.toUpperCase() }
        });

        if (!config) {
            return res.status(404).json({ error: 'القطاع غير موجود' });
        }

        // Update entity
        const entity = await prisma.entity.update({
            where: { id: entityId },
            data: { sectorConfigId: config.id },
            select: {
                id: true,
                legalName: true,
                sectorConfigId: true,
                sectorConfig: {
                    select: { code: true, nameAr: true, icon: true, unitLabelAr: true }
                }
            }
        });

        res.json({
            message: `✅ تم ربط "${entity.legalName}" بقطاع ${config.nameAr}`,
            entity
        });
    } catch (error) {
        console.error('Error linking entity to sector:', error);
        res.status(500).json({ error: 'فشل في ربط الكيان بالقطاع' });
    }
});

module.exports = router;
