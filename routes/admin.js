const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');
const { requireSuperAdmin } = require('../middleware/authorization');

const router = express.Router();

// كل routes الأدمن تحتاج SUPER_ADMIN
router.use(verifyToken, requireSuperAdmin);

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: إحصائيات النظام الشاملة (SUPER_ADMIN فقط)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: إحصائيات الشركات والمستخدمين والكيانات والتقييمات
 *       403:
 *         description: غير مسموح (ليس SUPER_ADMIN)
 */

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: جلب جميع المستخدمين مع بيانات العضوية (SUPER_ADMIN)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, inactive, disabled] }
 *     responses:
 *       200:
 *         description: قائمة المستخدمين
 *   post:
 *     summary: إنشاء مستخدم جديد (SUPER_ADMIN)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, name]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *               name: { type: string }
 *               entityId: { type: string }
 *               role: { type: string, enum: [OWNER, ADMIN, EDITOR, VIEWER] }
 *     responses:
 *       201:
 *         description: تم إنشاء المستخدم
 */

/**
 * @swagger
 * /api/admin/users/{id}:
 *   patch:
 *     summary: تعديل مستخدم (SUPER_ADMIN)
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: تم التعديل
 *   delete:
 *     summary: حذف مستخدم (SUPER_ADMIN)
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: تم الحذف
 */

/**
 * @swagger
 * /api/admin/alerts:
 *   get:
 *     summary: تنبيهات النظام (SUPER_ADMIN)
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: قائمة التنبيهات النشطة
 */

// ═══════════════════════════════════════════
// 📊 GET /api/admin/stats — إحصائيات النظام الشاملة
// ═══════════════════════════════════════════
router.get('/stats', async (req, res) => {
    try {
        const now = new Date();
        const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const [
            totalUsers, totalCompanies, totalEntities,
            newUsersThisMonth, newCompaniesThisMonth,
            activeToday, totalAssessments,
            totalObjectives, totalKpis, totalInitiatives,
            expiringSubscriptions
        ] = await Promise.all([
            prisma.user.count(),
            prisma.company.count(),
            prisma.entity.count(),
            prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
            prisma.company.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
            prisma.user.count({ where: { lastLogin: { gte: todayStart } } }).catch(() => 0),
            prisma.assessment.count().catch(() => 0),
            prisma.strategicObjective.count().catch(() => 0),
            prisma.kPI.count().catch(() => 0),
            prisma.strategicInitiative.count().catch(() => 0),
            prisma.subscription.count({
                where: {
                    endDate: { lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), gte: now }
                }
            }).catch(() => 0)
        ]);

        // حساب معدل النمو
        const previousUsers = totalUsers - newUsersThisMonth;
        const usersGrowth = previousUsers > 0 ? Math.round((newUsersThisMonth / previousUsers) * 100) : 100;
        const previousCompanies = totalCompanies - newCompaniesThisMonth;
        const companiesGrowth = previousCompanies > 0 ? Math.round((newCompaniesThisMonth / previousCompanies) * 100) : 100;

        // إحصائيات التقدم الاستراتيجي
        let swotCompleted = 0, inDiagnosis = 0, stuck = 0, notStarted = 0;
        try {
            const entities = await prisma.entity.findMany({
                include: {
                    strategyVersions: {
                        take: 1,
                        orderBy: { createdAt: 'desc' },
                        include: {
                            _count: {
                                select: { objectives: true, kpis: true, initiatives: true }
                            }
                        }
                    }
                }
            });

            entities.forEach(entity => {
                const v = entity.strategyVersions[0];
                if (!v) { notStarted++; return; }
                const c = v._count;
                if (c.objectives > 0 && c.kpis > 0) swotCompleted++;
                else if (c.objectives > 0 || c.kpis > 0) inDiagnosis++;
                else notStarted++;
            });

            // الشركات المتعثرة (عندها أهداف لكن بدون KPIs أو مبادرات)
            stuck = entities.filter(e => {
                const v = e.strategyVersions[0];
                return v && v._count.objectives > 0 && v._count.kpis === 0;
            }).length;
        } catch (e) {
            console.warn('Progress stats error:', e.message);
        }

        res.json({
            success: true,
            data: {
                totalUsers,
                totalCompanies,
                totalEntities,
                totalAssessments,
                totalObjectives,
                totalKpis,
                totalInitiatives,
                newUsersThisMonth,
                newCompaniesThisMonth,
                usersGrowth,
                companiesGrowth,
                activeToday,
                expiringSubscriptions,
                swotCompleted,
                inDiagnosis,
                stuck,
                notStarted
            }
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ═══════════════════════════════════════════
// 👥 GET /api/admin/users — قائمة المستخدمين
// ═══════════════════════════════════════════
router.get('/users', async (req, res) => {
    try {
        const { search, role, status, page = 1, limit = 50 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search } },
                { email: { contains: search } },
            ];
        }
        // userType is on Member, not User — filter via membership
        if (role) {
            where.memberships = { some: { userType: role } };
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: parseInt(limit),
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    systemRole: true,
                    lastLogin: true,
                    disabled: true,
                    createdAt: true,
                    memberships: {
                        include: {
                            entity: {
                                include: { company: { select: { nameAr: true, nameEn: true } } }
                            }
                        },
                        take: 1
                    }
                }
            }),
            prisma.user.count({ where })
        ]);

        const formatted = users.map(u => {
            const membership = u.memberships[0];
            const isActive = u.lastLogin && (new Date() - new Date(u.lastLogin)) < 7 * 24 * 60 * 60 * 1000;
            return {
                id: u.id,
                name: u.name,
                email: u.email,
                role: membership?.userType || u.systemRole,
                systemRole: u.systemRole,
                company: membership?.entity?.company?.nameAr || '-',
                entity: membership?.entity?.displayName || membership?.entity?.legalName || '-',
                lastLogin: u.lastLogin,
                disabled: u.disabled,
                createdAt: u.createdAt,
                status: u.disabled ? 'disabled' : (isActive ? 'active' : 'inactive')
            };
        });

        res.json({
            success: true,
            data: formatted,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
        });
    } catch (error) {
        console.error('Admin users error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ═══════════════════════════════════════════
// 🏢 GET /api/admin/companies — قائمة الشركات مع تقدمها
// ═══════════════════════════════════════════
router.get('/companies', async (req, res) => {
    try {
        const { search, status, page = 1, limit = 50 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const where = {};
        if (search) {
            where.OR = [
                { nameAr: { contains: search } },
                { nameEn: { contains: search } },
            ];
        }
        if (status) where.status = status;

        const [companies, total] = await Promise.all([
            prisma.company.findMany({
                where,
                skip,
                take: parseInt(limit),
                orderBy: { createdAt: 'desc' },
                include: {
                    subscription: true,
                    _count: { select: { entities: true } },
                    entities: {
                        include: {
                            members: { take: 1, where: { role: 'OWNER' }, include: { user: { select: { name: true } } } },
                            strategyVersions: {
                                take: 1,
                                orderBy: { createdAt: 'desc' },
                                include: {
                                    _count: { select: { objectives: true, kpis: true, initiatives: true } }
                                }
                            }
                        }
                    }
                }
            }),
            prisma.company.count({ where })
        ]);

        const formatted = companies.map(c => {
            const mainEntity = c.entities[0];
            const version = mainEntity?.strategyVersions?.[0];
            const counts = version?._count || {};
            const totalTools = (counts.objectives > 0 ? 1 : 0) +
                (counts.kpis > 0 ? 1 : 0) + (counts.initiatives > 0 ? 1 : 0);
            const progress = Math.round((totalTools / 3) * 100);

            let stage = 'لم تبدأ';
            if (progress >= 100) stage = 'مكتملة';
            else if (progress >= 75) stage = 'متقدمة';
            else if (progress >= 50) stage = 'منتصف الطريق';
            else if (progress >= 25) stage = 'بداية';
            else if (progress > 0) stage = 'تشخيص';

            let companyStatus = 'inactive';
            if (c.status === 'SUSPENDED') companyStatus = 'SUSPENDED';
            else if (c.status === 'ACTIVE' && progress > 0) companyStatus = 'active';
            else if (c.status === 'ACTIVE' && progress === 0) companyStatus = 'inactive';
            if (companyStatus !== 'SUSPENDED' && progress > 0 && progress < 50 && counts.kpis === 0) companyStatus = 'stuck';

            return {
                id: c.id,
                name: c.nameAr || c.nameEn,
                nameEn: c.nameEn,
                type: c.subscription?.plan || 'TRIAL',
                owner: mainEntity?.members?.[0]?.user?.name || '-',
                progress,
                stage,
                status: companyStatus,
                companyStatus: c.status, // الحالة الأصلية من قاعدة البيانات
                entitiesCount: c._count.entities,
                subscription: c.subscription,
                suspendedAt: c.suspendedAt,
                suspendReason: c.suspendReason,
                createdAt: c.createdAt
            };
        });

        res.json({
            success: true,
            data: formatted,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
        });
    } catch (error) {
        console.error('Admin companies error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ═══════════════════════════════════════════
// 🔔 GET /api/admin/alerts — التنبيهات المركزية
// ═══════════════════════════════════════════
router.get('/alerts', async (req, res) => {
    try {
        const alerts = [];

        // 1. اشتراكات تنتهي قريباً
        const expiring = await prisma.subscription.findMany({
            where: {
                endDate: {
                    lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    gte: new Date()
                }
            },
            include: { company: { select: { nameAr: true } } }
        }).catch(() => []);

        expiring.forEach(sub => {
            alerts.push({
                id: `exp-${sub.id}`,
                level: 'critical',
                title: `اشتراك "${sub.company?.nameAr}" ينتهي قريباً`,
                description: `ينتهي في ${new Date(sub.endDate).toLocaleDateString('ar-SA')}`,
                date: sub.endDate,
                type: 'subscription'
            });
        });

        // 2. اشتراكات منتهية
        const expired = await prisma.subscription.findMany({
            where: { endDate: { lt: new Date() }, status: 'ACTIVE' },
            include: { company: { select: { nameAr: true } } }
        }).catch(() => []);

        expired.forEach(sub => {
            alerts.push({
                id: `expired-${sub.id}`,
                level: 'critical',
                title: `اشتراك "${sub.company?.nameAr}" منتهي`,
                description: `انتهى في ${new Date(sub.endDate).toLocaleDateString('ar-SA')} — يحتاج تجديد`,
                date: sub.endDate,
                type: 'subscription'
            });
        });

        // 3. مستخدمين ما سجلوا دخول من فترة
        const inactiveUsers = await prisma.user.count({
            where: {
                OR: [
                    { lastLogin: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
                    { lastLogin: null }
                ],
                systemRole: 'USER',
                disabled: false
            }
        }).catch(() => 0);

        if (inactiveUsers > 0) {
            alerts.push({
                id: 'inactive-users',
                level: 'warning',
                title: `${inactiveUsers} مستخدم غير نشط`,
                description: 'مستخدمين لم يسجلوا دخول منذ أكثر من 30 يوماً',
                date: new Date(),
                type: 'users'
            });
        }

        // 4. شركات بدون كيانات
        const companiesNoEntities = await prisma.company.count({
            where: { entities: { none: {} } }
        }).catch(() => 0);

        if (companiesNoEntities > 0) {
            alerts.push({
                id: 'no-entities',
                level: 'warning',
                title: `${companiesNoEntities} شركة بدون كيانات`,
                description: 'شركات مسجلة لكن لم تنشئ أي كيان بعد',
                date: new Date(),
                type: 'companies'
            });
        }

        // 5. معلومة — إحصائية عامة
        const totalUsers = await prisma.user.count();
        alerts.push({
            id: 'system-info',
            level: 'info',
            title: `النظام يعمل بشكل طبيعي`,
            description: `${totalUsers} مستخدم مسجل في النظام`,
            date: new Date(),
            type: 'system'
        });

        // ترتيب حسب الأهمية
        const levelOrder = { critical: 0, warning: 1, info: 2 };
        alerts.sort((a, b) => levelOrder[a.level] - levelOrder[b.level]);

        res.json({ success: true, data: alerts });
    } catch (error) {
        console.error('Admin alerts error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ═══════════════════════════════════════════
// ➕ POST /api/admin/users — إضافة مستخدم جديد
// ═══════════════════════════════════════════
router.post('/users', async (req, res) => {
    try {
        const { name, email, password, role, entityId } = req.body;

        if (!name || !email) {
            return res.status(400).json({ success: false, message: 'الاسم والبريد مطلوبين' });
        }

        // تحقق من عدم التكرار
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(400).json({ success: false, message: 'البريد الإلكتروني مستخدم مسبقاً' });
        }

        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(password || 'Stratix@2026', 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                systemRole: 'USER',
            }
        });

        // إضافة عضوية إذا تم تحديد كيان
        if (entityId) {
            await prisma.member.create({
                data: {
                    userId: user.id,
                    entityId,
                    role: role === 'OWNER' ? 'OWNER' : 'VIEWER',
                    userType: role || 'EXPLORER'
                }
            });
        }

        res.status(201).json({ success: true, data: { id: user.id, name: user.name, email: user.email } });
    } catch (error) {
        console.error('Admin add user error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ═══════════════════════════════════════════
// ✏️ PATCH /api/admin/users/:id — تعديل / تعطيل مستخدم
// ═══════════════════════════════════════════
router.patch('/users/:id', async (req, res) => {
    try {
        const { name, email, userType, systemRole, disabled } = req.body;

        const updateData = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (systemRole) updateData.systemRole = systemRole;
        if (disabled !== undefined) updateData.disabled = disabled;

        // تحديث userType في Member إذا موجود
        if (userType) {
            await prisma.member.updateMany({
                where: { userId: req.params.id },
                data: { userType }
            }).catch(() => { });
        }

        const user = await prisma.user.update({
            where: { id: req.params.id },
            data: updateData,
            select: { id: true, name: true, email: true, systemRole: true, disabled: true }
        });

        res.json({ success: true, data: user });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
});

// ═══════════════════════════════════════════
// 🗑️ DELETE /api/admin/users/:id — حذف مستخدم
// ═══════════════════════════════════════════
router.delete('/users/:id', async (req, res) => {
    try {
        // لا تسمح بحذف SUPER_ADMIN
        const user = await prisma.user.findUnique({ where: { id: req.params.id } });
        if (!user) return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
        if (user.systemRole === 'SUPER_ADMIN') {
            return res.status(403).json({ success: false, message: 'لا يمكن حذف مدير النظام' });
        }

        // حذف العضويات أولاً
        await prisma.member.deleteMany({ where: { userId: req.params.id } });
        await prisma.user.delete({ where: { id: req.params.id } });

        res.json({ success: true, message: 'تم حذف المستخدم' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ═══════════════════════════════════════════
// ⏸️ PATCH /api/admin/companies/:id/suspend — تعليق حساب شركة
// ═══════════════════════════════════════════
router.patch('/companies/:id/suspend', async (req, res) => {
    try {
        const { reason } = req.body;
        const company = await prisma.company.findUnique({ where: { id: req.params.id } });
        if (!company) return res.status(404).json({ success: false, message: 'الشركة غير موجودة' });
        if (company.status === 'SUSPENDED') {
            return res.status(400).json({ success: false, message: 'الشركة معلقة بالفعل' });
        }

        const updated = await prisma.company.update({
            where: { id: req.params.id },
            data: {
                status: 'SUSPENDED',
                suspendedAt: new Date(),
                suspendReason: reason || 'تجاوز حدود الباقة',
                suspendedBy: req.user.id
            }
        });

        console.log(`[ADMIN] Company ${company.nameAr} (${company.id}) SUSPENDED by ${req.user.id}. Reason: ${reason || 'N/A'}`);
        res.json({ success: true, message: `تم تعليق حساب "${company.nameAr}"`, data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ═══════════════════════════════════════════
// ✅ PATCH /api/admin/companies/:id/activate — إعادة تفعيل حساب شركة
// ═══════════════════════════════════════════
router.patch('/companies/:id/activate', async (req, res) => {
    try {
        const company = await prisma.company.findUnique({ where: { id: req.params.id } });
        if (!company) return res.status(404).json({ success: false, message: 'الشركة غير موجودة' });
        if (company.status === 'ACTIVE') {
            return res.status(400).json({ success: false, message: 'الشركة نشطة بالفعل' });
        }

        const updated = await prisma.company.update({
            where: { id: req.params.id },
            data: {
                status: 'ACTIVE',
                suspendedAt: null,
                suspendReason: null,
                suspendedBy: null
            }
        });

        console.log(`[ADMIN] Company ${company.nameAr} (${company.id}) ACTIVATED by ${req.user.id}`);
        res.json({ success: true, message: `تم تفعيل حساب "${company.nameAr}"`, data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ═══════════════════════════════════════════
// 🚧 GET /api/admin/stalled — العملاء المتوقفين
// ═══════════════════════════════════════════
router.get('/stalled', async (req, res) => {
    try {
        const now = new Date();

        // جلب كل المستخدمين (غير SUPER_ADMIN) مع بياناتهم
        const users = await prisma.user.findMany({
            where: {
                systemRole: { not: 'SUPER_ADMIN' },
                disabled: false
            },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                createdAt: true,
                lastLogin: true,
                onboardingCompleted: true,
                userCategory: true,
                memberships: {
                    include: {
                        entity: {
                            include: {
                                company: { select: { id: true, nameAr: true, nameEn: true, status: true } },
                                sectorConfig: { select: { code: true, nameAr: true, icon: true } },
                                strategyVersions: {
                                    take: 1,
                                    orderBy: { createdAt: 'desc' },
                                    include: {
                                        _count: { select: { objectives: true, kpis: true, initiatives: true } }
                                    }
                                },
                                departments: {
                                    select: { code: true, dataStatus: true }
                                }
                            }
                        }
                    },
                    take: 1
                }
            }
        });

        const stalledUsers = [];

        users.forEach(u => {
            const daysSinceSignup = Math.floor((now - new Date(u.createdAt)) / (1000 * 60 * 60 * 24));
            const daysSinceLogin = u.lastLogin
                ? Math.floor((now - new Date(u.lastLogin)) / (1000 * 60 * 60 * 24))
                : daysSinceSignup;
            const membership = u.memberships[0];
            const entity = membership?.entity;
            const company = entity?.company;
            const version = entity?.strategyVersions?.[0];
            const counts = version?._count || {};
            const departments = entity?.departments || [];
            const hasDeptData = departments.some(d => d.dataStatus !== 'EMPTY');
            const sector = entity?.sectorConfig;

            // تحديد مرحلة التوقف
            let stallStage = '';
            let stallCode = '';
            let severity = 'info';
            let isStalled = false;

            if (!u.onboardingCompleted) {
                // ——— المرحلة 1: لم يكمل التسجيل (Onboarding) ———
                stallStage = '🔴 لم يكمل التسجيل';
                stallCode = 'NO_ONBOARDING';
                severity = 'critical';
                isStalled = true;
            } else if (!company) {
                // ——— المرحلة 2: أكمل التسجيل لكن بدون شركة ———
                stallStage = '🟠 بدون شركة / كيان';
                stallCode = 'NO_COMPANY';
                severity = 'high';
                isStalled = true;
            } else if (counts.objectives === 0 && !hasDeptData) {
                // ——— المرحلة 3: عنده شركة لكن ما بدأ أي نشاط ———
                if (daysSinceSignup >= 3) {
                    stallStage = '🟡 لم يبدأ أي نشاط';
                    stallCode = 'NO_ACTIVITY';
                    severity = daysSinceSignup >= 7 ? 'high' : 'medium';
                    isStalled = true;
                }
            } else if (counts.objectives > 0 && counts.kpis === 0) {
                // ——— المرحلة 4: أهداف بدون مؤشرات ———
                if (daysSinceLogin >= 7) {
                    stallStage = '🟡 متوقف عند الأهداف';
                    stallCode = 'STUCK_OBJECTIVES';
                    severity = 'medium';
                    isStalled = true;
                }
            } else if (daysSinceLogin >= 14) {
                // ——— المرحلة 5: كان نشط ثم توقف ———
                stallStage = '⚪ غير نشط (14+ يوم)';
                stallCode = 'INACTIVE';
                severity = 'low';
                isStalled = true;
            }

            if (isStalled) {
                stalledUsers.push({
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    phone: u.phone || null,
                    createdAt: u.createdAt,
                    lastLogin: u.lastLogin,
                    daysSinceSignup,
                    daysSinceLogin,
                    onboardingCompleted: u.onboardingCompleted,
                    userCategory: u.userCategory,
                    company: company?.nameAr || null,
                    companyId: company?.id || null,
                    sector: sector ? `${sector.icon} ${sector.nameAr}` : null,
                    stallStage,
                    stallCode,
                    severity,
                    progress: {
                        hasCompany: !!company,
                        hasObjectives: (counts.objectives || 0) > 0,
                        hasKpis: (counts.kpis || 0) > 0,
                        hasInitiatives: (counts.initiatives || 0) > 0,
                        hasDeptData: hasDeptData,
                        hasSector: !!sector
                    }
                });
            }
        });

        // ترتيب: الأكثر خطورة أولاً ثم الأقدم
        const sevOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
        stalledUsers.sort((a, b) => {
            const diff = (sevOrder[a.severity] || 4) - (sevOrder[b.severity] || 4);
            return diff !== 0 ? diff : b.daysSinceSignup - a.daysSinceSignup;
        });

        // إحصائيات ملخصة
        const summary = {
            total: stalledUsers.length,
            noOnboarding: stalledUsers.filter(u => u.stallCode === 'NO_ONBOARDING').length,
            noCompany: stalledUsers.filter(u => u.stallCode === 'NO_COMPANY').length,
            noActivity: stalledUsers.filter(u => u.stallCode === 'NO_ACTIVITY').length,
            stuckObjectives: stalledUsers.filter(u => u.stallCode === 'STUCK_OBJECTIVES').length,
            inactive: stalledUsers.filter(u => u.stallCode === 'INACTIVE').length,
        };

        res.json({ success: true, data: stalledUsers, summary });
    } catch (error) {
        console.error('Admin stalled error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
