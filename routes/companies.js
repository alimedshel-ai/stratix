const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');
const { requireSuperAdmin } = require('../middleware/authorization');

const router = express.Router();

// كل routes الشركات تحتاج SUPER_ADMIN
router.use(verifyToken, requireSuperAdmin);

// ========== GET /api/companies — قائمة الشركات ==========
router.get('/', async (req, res) => {
    try {
        const { search, status } = req.query;

        const where = {};
        if (status) where.status = status;
        if (search) {
            where.OR = [
                { nameAr: { contains: search } },
                { nameEn: { contains: search } },
                { code: { contains: search } },
            ];
        }

        const companies = await prisma.company.findMany({
            where,
            include: {
                subscription: true,
                _count: { select: { entities: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json({ success: true, data: companies });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== GET /api/companies/:id — تفاصيل شركة ==========
router.get('/:id', async (req, res) => {
    try {
        const company = await prisma.company.findUnique({
            where: { id: req.params.id },
            include: {
                subscription: true,
                entities: {
                    include: {
                        _count: { select: { members: true, strategyVersions: true } },
                    },
                },
            },
        });

        if (!company) {
            return res.status(404).json({ success: false, message: 'الشركة غير موجودة' });
        }

        res.json({ success: true, data: company });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== POST /api/companies — إنشاء شركة جديدة ==========
router.post('/', async (req, res) => {
    try {
        const { nameAr, nameEn, code, email, phone, website, logoUrl, plan } = req.body;

        if (!nameAr) {
            return res.status(400).json({ success: false, message: 'اسم الشركة بالعربي مطلوب' });
        }

        const company = await prisma.company.create({
            data: {
                nameAr,
                nameEn,
                code,
                email,
                phone,
                website,
                logoUrl,
                status: 'ACTIVE',
                subscription: {
                    create: {
                        plan: plan || 'TRIAL',
                        status: 'ACTIVE',
                        startDate: new Date(),
                        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 يوم تجريبي
                        maxUsers: plan === 'ENTERPRISE' ? 100 : plan === 'PRO' ? 25 : plan === 'BASIC' ? 10 : 5,
                        maxEntities: plan === 'ENTERPRISE' ? 20 : plan === 'PRO' ? 5 : plan === 'BASIC' ? 2 : 1,
                    },
                },
            },
            include: { subscription: true },
        });

        res.status(201).json({ success: true, data: company });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ success: false, message: 'كود الشركة مستخدم مسبقاً' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== PATCH /api/companies/:id — تعديل شركة ==========
router.patch('/:id', async (req, res) => {
    try {
        const { nameAr, nameEn, code, email, phone, website, logoUrl, status } = req.body;

        const company = await prisma.company.update({
            where: { id: req.params.id },
            data: {
                ...(nameAr && { nameAr }),
                ...(nameEn && { nameEn }),
                ...(code !== undefined && { code }),
                ...(email !== undefined && { email }),
                ...(phone !== undefined && { phone }),
                ...(website !== undefined && { website }),
                ...(logoUrl !== undefined && { logoUrl }),
                ...(status && { status }),
            },
            include: { subscription: true },
        });

        res.json({ success: true, data: company });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, message: 'الشركة غير موجودة' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== DELETE /api/companies/:id — حذف شركة ==========
router.delete('/:id', async (req, res) => {
    try {
        // تحقق من وجود كيانات مرتبطة
        const entityCount = await prisma.entity.count({
            where: { companyId: req.params.id },
        });

        if (entityCount > 0) {
            return res.status(400).json({
                success: false,
                message: `لا يمكن حذف الشركة — مرتبطة بـ ${entityCount} كيان. احذف الكيانات أولاً.`,
            });
        }

        await prisma.company.delete({ where: { id: req.params.id } });

        res.json({ success: true, message: 'تم حذف الشركة بنجاح' });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, message: 'الشركة غير موجودة' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== PATCH /api/companies/:id/subscription — تعديل الاشتراك ==========
router.patch('/:id/subscription', async (req, res) => {
    try {
        const { plan, status, endDate, maxUsers, maxEntities } = req.body;

        const subscription = await prisma.subscription.upsert({
            where: { companyId: req.params.id },
            update: {
                ...(plan && { plan }),
                ...(status && { status }),
                ...(endDate && { endDate: new Date(endDate) }),
                ...(maxUsers && { maxUsers }),
                ...(maxEntities && { maxEntities }),
            },
            create: {
                companyId: req.params.id,
                plan: plan || 'TRIAL',
                status: status || 'ACTIVE',
                startDate: new Date(),
                endDate: endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                maxUsers: maxUsers || 5,
                maxEntities: maxEntities || 1,
            },
        });

        res.json({ success: true, data: subscription });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== GET /api/companies/stats/overview — إحصائيات عامة ==========
router.get('/stats/overview', async (req, res) => {
    try {
        const [totalCompanies, activeCompanies, trialCompanies, totalEntities, totalUsers] = await Promise.all([
            prisma.company.count(),
            prisma.company.count({ where: { status: 'ACTIVE' } }),
            prisma.subscription.count({ where: { plan: 'TRIAL' } }),
            prisma.entity.count(),
            prisma.user.count({ where: { systemRole: 'USER' } }),
        ]);

        // اشتراكات تنتهي خلال 7 أيام
        const expiringSubscriptions = await prisma.subscription.count({
            where: {
                endDate: {
                    lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    gte: new Date(),
                },
            },
        });

        res.json({
            success: true,
            data: {
                totalCompanies,
                activeCompanies,
                trialCompanies,
                totalEntities,
                totalUsers,
                expiringSubscriptions,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
