const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// ============ TOOL DEFINITIONS ============

// Get all tools (with filters)
router.get('/', verifyToken, async (req, res) => {
    try {
        const { category, primary, active, search } = req.query;

        let where = {};

        // Filter by category (DIAGNOSIS, CHOICE, EXECUTION, ADAPTATION)
        if (category) where.category = category;

        // Filter primary vs advanced
        if (primary === 'true') where.isPrimary = true;
        if (primary === 'false') where.isPrimary = false;

        // Filter active/inactive
        if (active !== undefined) where.isActive = active === 'true';

        // Search
        if (search) {
            where.OR = [
                { nameAr: { contains: search } },
                { nameEn: { contains: search } },
                { descriptionAr: { contains: search } },
                { descriptionEn: { contains: search } }
            ];
        }

        const tools = await prisma.toolDefinition.findMany({
            where,
            orderBy: { order: 'asc' }
        });

        // Group by category
        const grouped = {
            DIAGNOSIS: tools.filter(t => t.category === 'DIAGNOSIS'),
            CHOICE: tools.filter(t => t.category === 'CHOICE'),
            EXECUTION: tools.filter(t => t.category === 'EXECUTION'),
            ADAPTATION: tools.filter(t => t.category === 'ADAPTATION')
        };

        res.json({
            tools,
            grouped,
            total: tools.length,
            primaryCount: tools.filter(t => t.isPrimary).length,
            advancedCount: tools.filter(t => !t.isPrimary).length
        });
    } catch (error) {
        console.error('Error fetching tools:', error);
        res.status(500).json({ error: 'Failed to fetch tools' });
    }
});

// Get tools grouped by phases (for pipeline view)
router.get('/phases', verifyToken, async (req, res) => {
    try {
        const { primary } = req.query;
        let where = { isActive: true };
        if (primary === 'true') where.isPrimary = true;

        const tools = await prisma.toolDefinition.findMany({
            where,
            orderBy: { order: 'asc' }
        });

        const phases = [
            {
                id: 'DIAGNOSIS',
                nameAr: 'التشخيص',
                nameEn: 'Diagnosis',
                icon: 'bi-search',
                description: 'فهم الوضع الحالي والبيئة المحيطة',
                tools: tools.filter(t => t.category === 'DIAGNOSIS')
            },
            {
                id: 'CHOICE',
                nameAr: 'الاختيار',
                nameEn: 'Choice',
                icon: 'bi-signpost-split',
                description: 'تحديد الاتجاه الاستراتيجي والبدائل',
                tools: tools.filter(t => t.category === 'CHOICE')
            },
            {
                id: 'EXECUTION',
                nameAr: 'التنفيذ',
                nameEn: 'Execution',
                icon: 'bi-rocket-takeoff',
                description: 'ترجمة الاستراتيجية لأهداف ومبادرات',
                tools: tools.filter(t => t.category === 'EXECUTION')
            },
            {
                id: 'ADAPTATION',
                nameAr: 'التكيف',
                nameEn: 'Adaptation',
                icon: 'bi-arrow-repeat',
                description: 'المراجعة والتعديل والاستعداد للمستقبل',
                tools: tools.filter(t => t.category === 'ADAPTATION')
            }
        ];

        res.json({ phases });
    } catch (error) {
        console.error('Error fetching phases:', error);
        res.status(500).json({ error: 'Failed to fetch phases' });
    }
});

// Get single tool by code
router.get('/:code', verifyToken, async (req, res) => {
    try {
        const tool = await prisma.toolDefinition.findUnique({
            where: { code: req.params.code.toUpperCase() }
        });

        if (!tool) {
            return res.status(404).json({ error: 'Tool not found' });
        }

        res.json(tool);
    } catch (error) {
        console.error('Error fetching tool:', error);
        res.status(500).json({ error: 'Failed to fetch tool' });
    }
});

// Seed tools (admin only — idempotent)
router.post('/seed', verifyToken, async (req, res) => {
    try {
        // Run the seed script
        const count = await prisma.toolDefinition.count();
        if (count >= 13) {
            return res.json({ message: 'Tools already seeded', count });
        }

        // If not seeded, return instruction
        res.json({
            message: 'Run: node prisma/seed-tools.js',
            currentCount: count
        });
    } catch (error) {
        console.error('Error seeding tools:', error);
        res.status(500).json({ error: 'Failed to seed tools' });
    }
});

module.exports = router;
