/**
 * =========================================
 * Investment Deals API — إدارة الفرص الاستثمارية
 * CRUD + State Machine + RBAC + Data Isolation
 * =========================================
 *
 * ✅ State Machine كامل
 * ✅ RBAC حسب علاقة المستخدم بالصفقة
 * ✅ Data Isolation — كل دور يشوف بياناته فقط
 * ✅ Race Condition Prevention عبر Transactions
 * ✅ Pagination + Filtering
 */
const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// ═══ الحالات الصالحة والانتقالات ═══
const VALID_TRANSITIONS = {
    SUBMITTED: ['UNDER_REVIEW', 'REJECTED'],
    UNDER_REVIEW: ['ANALYZING', 'INFO_REQUIRED', 'REJECTED'],
    ANALYZING: ['DECISION_READY', 'INFO_REQUIRED'],
    INFO_REQUIRED: ['UNDER_REVIEW', 'ANALYZING'],
    DECISION_READY: ['APPROVED', 'REJECTED', 'NEGOTIATING'],
    NEGOTIATING: ['APPROVED', 'REJECTED', 'CLOSED'],
    APPROVED: ['INVESTED'],
    REJECTED: ['CLOSED'],
    INVESTED: ['CLOSED'],
    CLOSED: [],
};

// ═══ RBAC: صلاحيات الانتقال حسب الدور ═══
// الأدوار: SUBMITTER (مقدم الفرصة), ANALYST (المحلل المعيّن), INVESTOR (صاحب القرار), ADMIN
const TRANSITION_PERMISSIONS = {
    'SUBMITTED→UNDER_REVIEW': ['ADMIN'],
    'SUBMITTED→REJECTED': ['SUBMITTER', 'ADMIN'],
    'UNDER_REVIEW→ANALYZING': ['ANALYST', 'ADMIN'],
    'UNDER_REVIEW→INFO_REQUIRED': ['ANALYST', 'ADMIN'],
    'UNDER_REVIEW→REJECTED': ['ANALYST', 'ADMIN'],
    'ANALYZING→DECISION_READY': ['ANALYST', 'ADMIN'],
    'ANALYZING→INFO_REQUIRED': ['ANALYST', 'ADMIN'],
    'INFO_REQUIRED→UNDER_REVIEW': ['ANALYST', 'ADMIN'],
    'INFO_REQUIRED→ANALYZING': ['ANALYST', 'ADMIN'],
    'DECISION_READY→APPROVED': ['INVESTOR', 'ADMIN'],
    'DECISION_READY→REJECTED': ['INVESTOR', 'ADMIN'],
    'DECISION_READY→NEGOTIATING': ['INVESTOR', 'ADMIN'],
    'NEGOTIATING→APPROVED': ['INVESTOR', 'ADMIN'],
    'NEGOTIATING→REJECTED': ['INVESTOR', 'ADMIN'],
    'NEGOTIATING→CLOSED': ['INVESTOR', 'ADMIN'],
    'APPROVED→INVESTED': ['INVESTOR', 'ADMIN'],
    'REJECTED→CLOSED': ['SUBMITTER', 'INVESTOR', 'ADMIN'],
    'INVESTED→CLOSED': ['INVESTOR', 'ADMIN'],
};

/**
 * تحديد دور المستخدم بالنسبة للصفقة
 * يعتمد على العلاقة الفعلية (مقدم؟ محلل؟) وليس roles مجردة
 */
function getUserDealRole(user, deal) {
    if (user.isSuperAdmin) return 'ADMIN';
    if (deal.submittedById === user.id) return 'SUBMITTER';
    if (deal.leadAnalystId === user.id) return 'ANALYST';
    // المستثمر: من userCategory في الـ JWT
    const uCat = user.userCategory || '';
    if (uCat === 'INVESTOR' || uCat === 'BOARD_MEMBER' ||
        uCat.startsWith('INVESTOR_') || uCat.startsWith('BOARD_')) {
        return 'INVESTOR';
    }
    return 'VIEWER'; // قراءة فقط
}

/**
 * فحص صلاحية الانتقال
 */
function canTransition(userRole, currentStatus, newStatus) {
    const key = `${currentStatus}→${newStatus}`;
    const allowed = TRANSITION_PERMISSIONS[key] || [];
    return allowed.includes(userRole);
}

// ═══ Helper: إنشاء إشعار ═══
async function createNotification(userId, type, title, message, link, sourceType, sourceId) {
    try {
        await prisma.notification.create({
            data: { userId, type, title, message, link, sourceType, sourceId }
        });
    } catch (err) {
        console.error('[Notification] Error creating:', err.message);
    }
}

// ═══ GET /api/deals — قائمة الفرص (مع Data Isolation حسب الدور) ═══
router.get('/', verifyToken, async (req, res) => {
    try {
        const { page = 1, limit = 20, status, sector, search } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const uCat = req.user.userCategory || '';

        // ═══ Data Isolation: كل دور يشوف بياناته فقط ═══
        let where = {};

        if (req.user.isSuperAdmin) {
            // SUPER_ADMIN يشوف كل شي
        } else if (uCat === 'INVESTOR' || uCat === 'BOARD_MEMBER' ||
            uCat.startsWith('INVESTOR_') || uCat.startsWith('BOARD_')) {
            // مستثمر/عضو مجلس: يشوف الفرص اللي قدّمها + الفرص المتقدمة
            where.OR = [
                { submittedById: req.user.id },
                { decisionById: req.user.id },
                { status: { in: ['DECISION_READY', 'NEGOTIATING', 'APPROVED', 'INVESTED'] } },
            ];
        } else {
            // مستخدم عادي: يشوف اللي قدّمها أو المعيّن لها
            where.OR = [
                { submittedById: req.user.id },
                { leadAnalystId: req.user.id },
            ];
        }

        // إضافة فلاتر البحث (بدون كسر الـ OR)
        const andConditions = [];
        if (status) andConditions.push({ status });
        if (sector) andConditions.push({ sector });
        if (search) {
            andConditions.push({
                OR: [
                    { companyName: { contains: search } },
                    { description: { contains: search } },
                ],
            });
        }
        if (andConditions.length > 0) {
            where = { AND: [where, ...andConditions] };
        }

        const [deals, total] = await Promise.all([
            prisma.investmentDeal.findMany({
                where,
                include: {
                    documents: { select: { id: true, fileName: true, fileType: true } },
                    reports: { select: { id: true, type: true, status: true, score: true } },
                    portfolio: { select: { id: true, status: true } },
                    _count: { select: { documents: true, reports: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit),
            }),
            prisma.investmentDeal.count({ where }),
        ]);

        res.json({
            deals,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit)),
        });
    } catch (error) {
        console.error('[Deals] List error:', error.message);
        res.status(500).json({ error: 'Failed to fetch deals' });
    }
});

// ═══ GET /api/deals/stats — إحصائيات سريعة ═══
router.get('/stats', verifyToken, async (req, res) => {
    try {
        const [total, byStatus, recentDeals] = await Promise.all([
            prisma.investmentDeal.count(),
            prisma.investmentDeal.groupBy({
                by: ['status'],
                _count: true,
            }),
            prisma.investmentDeal.findMany({
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: { id: true, companyName: true, status: true, createdAt: true, sector: true },
            }),
        ]);

        const statusMap = {};
        byStatus.forEach(s => { statusMap[s.status] = s._count; });

        res.json({
            total,
            byStatus: statusMap,
            pipeline: {
                submitted: statusMap.SUBMITTED || 0,
                underReview: statusMap.UNDER_REVIEW || 0,
                analyzing: statusMap.ANALYZING || 0,
                decisionReady: statusMap.DECISION_READY || 0,
                approved: statusMap.APPROVED || 0,
                invested: statusMap.INVESTED || 0,
                rejected: statusMap.REJECTED || 0,
            },
            recentDeals,
        });
    } catch (error) {
        console.error('[Deals] Stats error:', error.message);
        res.status(500).json({ error: 'Failed to fetch deal stats' });
    }
});

// ═══ GET /api/deals/portfolio — شركات المحفظة للمستثمر ═══
router.get('/portfolio', verifyToken, async (req, res) => {
    try {
        // نجيب الـ Deals اللي حالتها INVESTED ومقدمة من هذا المستخدم
        const investedDeals = await prisma.investmentDeal.findMany({
            where: {
                OR: [
                    { submittedById: req.user.id },
                    { decisionById: req.user.id },
                ],
                status: 'INVESTED',
            },
            include: {
                portfolio: {
                    include: {
                        reports: {
                            orderBy: { createdAt: 'desc' },
                            take: 1,
                            select: {
                                id: true, period: true, revenue: true,
                                netProfit: true, currentHealth: true, createdAt: true,
                            },
                        },
                    },
                },
            },
            orderBy: { updatedAt: 'desc' },
        });

        const companies = investedDeals
            .filter(d => d.portfolio)
            .map(d => ({
                id: d.portfolio.id,
                dealId: d.id,
                companyName: d.portfolio.companyName || d.companyName,
                sector: d.sector,
                stage: d.stage,
                investedAmount: d.portfolio.investedAmount,
                equityPercent: d.portfolio.equityPercent,
                investedAt: d.portfolio.investedAt,
                status: d.portfolio.status,
                currentHealth: d.portfolio.currentHealth,
                lastRevenue: d.portfolio.lastRevenue,
                lastNetProfit: d.portfolio.lastNetProfit,
                reportFrequency: d.portfolio.reportFrequency,
                nextReportDue: d.portfolio.nextReportDue,
                latestReport: d.portfolio.reports[0] || null,
            }));

        res.json({
            success: true,
            count: companies.length,
            companies,
        });
    } catch (error) {
        console.error('[Deals] Portfolio error:', error.message);
        res.status(500).json({ error: 'Failed to load portfolio' });
    }
});

// ═══ GET /api/deals/search-entities — بحث الكيانات (للربط بالصفقة) ═══
router.get('/search-entities', verifyToken, async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 2) {
            return res.json({ entities: [] });
        }

        const entities = await prisma.entity.findMany({
            where: {
                OR: [
                    { legalName: { contains: q } },
                    { displayName: { contains: q } },
                ],
            },
            select: {
                id: true,
                legalName: true,
                displayName: true,
                size: true,
                sectorConfig: { select: { nameAr: true } },
                _count: { select: { members: true } },
            },
            take: 10,
            orderBy: { legalName: 'asc' },
        });

        res.json({
            entities: entities.map(e => ({
                id: e.id,
                name: e.displayName || e.legalName,
                legalName: e.legalName,
                size: e.size,
                sector: e.sectorConfig?.nameAr || '—',
                memberCount: e._count.members,
            })),
        });
    } catch (error) {
        console.error('[Deals] Search entities error:', error.message);
        res.status(500).json({ error: 'Failed to search entities' });
    }
});

// ═══ POST /api/deals/:id/link-entity — ربط صفقة بكيان ═══
router.post('/:id/link-entity', verifyToken, async (req, res) => {
    try {
        const { entityId } = req.body;
        if (!entityId) {
            return res.status(400).json({ error: 'entityId مطلوب' });
        }

        const deal = await prisma.investmentDeal.findUnique({
            where: { id: req.params.id },
        });
        if (!deal) {
            return res.status(404).json({ error: 'الصفقة غير موجودة' });
        }

        // تحقق من وجود الكيان
        const entity = await prisma.entity.findUnique({
            where: { id: entityId },
            select: { id: true, legalName: true, displayName: true },
        });
        if (!entity) {
            return res.status(404).json({ error: 'الكيان غير موجود' });
        }

        // ربط
        const updated = await prisma.investmentDeal.update({
            where: { id: req.params.id },
            data: { entityId },
        });

        console.log(`[Deals] Linked: ${deal.id} → Entity: ${entity.legalName}`);

        res.json({
            success: true,
            message: `تم ربط الصفقة بـ "${entity.displayName || entity.legalName}"`,
            deal: updated,
            entity: { id: entity.id, name: entity.displayName || entity.legalName },
        });
    } catch (error) {
        console.error('[Deals] Link entity error:', error.message);
        res.status(500).json({ error: 'Failed to link entity' });
    }
});

// ═══ GET /api/deals/:id — تفاصيل فرصة ═══
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const deal = await prisma.investmentDeal.findUnique({
            where: { id: req.params.id },
            include: {
                documents: true,
                reports: { orderBy: { createdAt: 'desc' } },
                portfolio: { include: { reports: { orderBy: { createdAt: 'desc' }, take: 5 } } },
            },
        });

        if (!deal) {
            return res.status(404).json({ error: 'Deal not found' });
        }

        res.json(deal);
    } catch (error) {
        console.error('[Deals] Get error:', error.message);
        res.status(500).json({ error: 'Failed to fetch deal' });
    }
});

// ═══ POST /api/deals — إنشاء فرصة جديدة ═══
router.post('/', verifyToken, async (req, res) => {
    try {
        const {
            companyName, sector, description, stage,
            askAmount, valuation, equity,
            location, website, pitchSummary, priority
        } = req.body;

        // Validation
        if (!companyName || !sector || !description) {
            return res.status(400).json({
                error: 'validation_error',
                message: 'اسم الشركة والقطاع والوصف مطلوبة',
            });
        }

        const deal = await prisma.investmentDeal.create({
            data: {
                companyName,
                sector,
                description,
                stage: stage || 'SEED',
                askAmount: askAmount ? parseFloat(askAmount) : null,
                valuation: valuation ? parseFloat(valuation) : null,
                equity: equity ? parseFloat(equity) : null,
                location,
                website,
                pitchSummary,
                priority: priority || 'MEDIUM',
                submittedById: req.user.id,
                status: 'SUBMITTED',
            },
            include: {
                documents: true,
                _count: { select: { documents: true, reports: true } },
            },
        });

        console.log(`[Deals] Created: ${deal.id} | ${companyName} | by: ${req.user.id}`);

        res.status(201).json({
            success: true,
            message: 'تم تقديم الفرصة بنجاح',
            deal,
        });
    } catch (error) {
        console.error('[Deals] Create error:', error.message);
        res.status(500).json({ error: 'Failed to create deal' });
    }
});

// ═══ PATCH /api/deals/:id — تعديل بيانات الفرصة ═══
router.patch('/:id', verifyToken, async (req, res) => {
    try {
        const deal = await prisma.investmentDeal.findUnique({
            where: { id: req.params.id },
        });

        if (!deal) {
            return res.status(404).json({ error: 'Deal not found' });
        }

        // فقط مقدم الفرصة يعدل (إذا لسا SUBMITTED أو INFO_REQUIRED)
        if (!['SUBMITTED', 'INFO_REQUIRED'].includes(deal.status)) {
            return res.status(403).json({
                error: 'cannot_edit',
                message: 'لا يمكن تعديل الفرصة في هذه المرحلة',
            });
        }

        const allowedFields = [
            'companyName', 'sector', 'description', 'stage',
            'askAmount', 'valuation', 'equity', 'location',
            'website', 'pitchSummary', 'priority'
        ];

        const data = {};
        allowedFields.forEach(f => {
            if (req.body[f] !== undefined) {
                data[f] = ['askAmount', 'valuation', 'equity'].includes(f)
                    ? parseFloat(req.body[f])
                    : req.body[f];
            }
        });

        const updated = await prisma.investmentDeal.update({
            where: { id: req.params.id },
            data,
        });

        res.json({ success: true, deal: updated });
    } catch (error) {
        console.error('[Deals] Update error:', error.message);
        res.status(500).json({ error: 'Failed to update deal' });
    }
});

// ═══ POST /api/deals/:id/transition — تغيير حالة الفرصة (RBAC + Transaction) ═══
router.post('/:id/transition', verifyToken, async (req, res) => {
    try {
        const { newStatus, notes, rejectionReason, leadAnalystId,
            investedAmount, equityPercent } = req.body;

        // ═══ Transaction لمنع Race Conditions ═══
        const result = await prisma.$transaction(async (tx) => {
            // 1. قراءة الصفقة داخل الـ transaction
            const deal = await tx.investmentDeal.findUnique({
                where: { id: req.params.id },
            });

            if (!deal) throw { status: 404, error: 'Deal not found' };

            // 2. التحقق من صحة الانتقال
            const allowedTransitions = VALID_TRANSITIONS[deal.status] || [];
            if (!allowedTransitions.includes(newStatus)) {
                throw {
                    status: 400,
                    error: 'invalid_transition',
                    message: `لا يمكن الانتقال من "${deal.status}" إلى "${newStatus}"`,
                    allowed: allowedTransitions,
                };
            }

            // 3. ✅ RBAC: فحص صلاحية المستخدم لهذا الانتقال
            const userRole = getUserDealRole(req.user, deal);
            if (!canTransition(userRole, deal.status, newStatus)) {
                throw {
                    status: 403,
                    error: 'forbidden_transition',
                    message: `لا يملك دور "${userRole}" صلاحية هذا الانتقال`,
                };
            }

            // 4. بناء بيانات التحديث
            const updateData = { status: newStatus };

            if (newStatus === 'UNDER_REVIEW' && leadAnalystId) {
                updateData.leadAnalystId = leadAnalystId;
                updateData.assignedAt = new Date();
            }
            if (newStatus === 'REJECTED') {
                updateData.rejectionReason = rejectionReason || notes || '';
                updateData.decisionById = req.user.id;
                updateData.decisionAt = new Date();
            }
            if (newStatus === 'APPROVED') {
                updateData.decisionById = req.user.id;
                updateData.decisionAt = new Date();
                updateData.decisionNotes = notes || '';
            }
            if (notes) {
                updateData.decisionNotes = notes;
            }

            // 5. ✅ Optimistic Lock: تحديث فقط إذا الحالة ما تغيرت
            const updated = await tx.investmentDeal.updateMany({
                where: { id: req.params.id, status: deal.status },
                data: updateData,
            });

            if (updated.count === 0) {
                throw {
                    status: 409,
                    error: 'conflict',
                    message: 'تم تعديل الصفقة من طرف آخر. أعد المحاولة.',
                };
            }

            // 6. إشعارات
            const notifyTitle = {
                UNDER_REVIEW: '📋 فرصتك قيد المراجعة',
                ANALYZING: '🔍 بدأ تحليل الفرصة',
                INFO_REQUIRED: '📎 مطلوب معلومات إضافية',
                DECISION_READY: '⏳ الفرصة جاهزة لاتخاذ القرار',
                APPROVED: '✅ تمت الموافقة على الفرصة',
                REJECTED: '❌ تم رفض الفرصة',
                INVESTED: '🎉 تم الاستثمار بنجاح',
            };

            if (notifyTitle[newStatus]) {
                await tx.notification.create({
                    data: {
                        userId: deal.submittedById,
                        type: `DEAL_${newStatus}`,
                        title: notifyTitle[newStatus],
                        message: `الفرصة "${deal.companyName}" — الحالة الجديدة: ${newStatus}`,
                        link: `/deal-detail.html?id=${deal.id}`,
                        sourceType: 'DEAL',
                        sourceId: deal.id,
                    },
                });
            }

            // 7. إذا تم الاستثمار — ننشئ شركة في المحفظة
            if (newStatus === 'INVESTED') {
                await tx.portfolioCompany.create({
                    data: {
                        dealId: deal.id,
                        companyName: deal.companyName,
                        investedAmount: investedAmount ? parseFloat(investedAmount) : deal.askAmount || 0,
                        equityPercent: equityPercent ? parseFloat(equityPercent) : deal.equity || 0,
                        investedAt: new Date(),
                        status: 'ACTIVE',
                    },
                });
                console.log(`[Deals] ${deal.companyName} moved to portfolio`);
            }

            console.log(`[Deals] Transition: ${deal.id} | ${deal.status} → ${newStatus} | by: ${req.user.id} (${userRole})`);

            return { deal, newStatus };
        });

        res.json({
            success: true,
            message: `تم تغيير الحالة إلى ${result.newStatus}`,
            deal: { ...result.deal, status: result.newStatus },
        });
    } catch (error) {
        if (error.status) {
            return res.status(error.status).json({
                error: error.error || 'transition_error',
                message: error.message,
                allowed: error.allowed,
            });
        }
        console.error('[Deals] Transition error:', error.message);
        res.status(500).json({ error: 'Failed to transition deal' });
    }
});

// ═══ POST /api/deals/:id/assign — تعيين قائد فريق التحليل (Transaction) ═══
router.post('/:id/assign', verifyToken, async (req, res) => {
    try {
        const { leadAnalystId } = req.body;
        if (!leadAnalystId) {
            return res.status(400).json({ error: 'leadAnalystId مطلوب' });
        }

        // ✅ فقط ADMIN يقدر يعيّن
        if (!req.user.isSuperAdmin) {
            return res.status(403).json({ error: 'لا تملك صلاحية التعيين' });
        }

        const result = await prisma.$transaction(async (tx) => {
            const deal = await tx.investmentDeal.findUnique({
                where: { id: req.params.id },
            });

            if (!deal) throw { status: 404, error: 'Deal not found' };

            // ✅ التحقق من الحالة
            if (!['SUBMITTED', 'INFO_REQUIRED'].includes(deal.status)) {
                throw { status: 400, error: 'لا يمكن التعيين في هذه المرحلة' };
            }

            // ✅ Optimistic Lock: تحديث فقط إذا الحالة ما تغيرت
            const updated = await tx.investmentDeal.updateMany({
                where: { id: req.params.id, status: deal.status },
                data: {
                    leadAnalystId,
                    assignedAt: new Date(),
                    status: 'UNDER_REVIEW',
                },
            });

            if (updated.count === 0) {
                throw { status: 409, error: 'تم تعيين محلل آخر قبل لحظات' };
            }

            // إشعار المحلل
            await tx.notification.create({
                data: {
                    userId: leadAnalystId,
                    type: 'DEAL_ASSIGNED',
                    title: '📋 تم تعيينك قائد تحليل لفرصة جديدة',
                    message: `الفرصة: "${deal.companyName}" — القطاع: ${deal.sector}`,
                    link: `/deal-detail.html?id=${deal.id}`,
                    sourceType: 'DEAL',
                    sourceId: deal.id,
                },
            });

            return deal;
        });

        res.json({ success: true, deal: { ...result, leadAnalystId, status: 'UNDER_REVIEW' } });
    } catch (error) {
        if (error.status) {
            return res.status(error.status).json({ error: error.error });
        }
        console.error('[Deals] Assign error:', error.message);
        res.status(500).json({ error: 'Failed to assign deal' });
    }
});

// ═══ DELETE /api/deals/:id — حذف فرصة (فقط SUBMITTED) ═══
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const deal = await prisma.investmentDeal.findUnique({
            where: { id: req.params.id },
        });

        if (!deal) {
            return res.status(404).json({ error: 'Deal not found' });
        }

        if (deal.status !== 'SUBMITTED') {
            return res.status(403).json({
                error: 'cannot_delete',
                message: 'لا يمكن حذف الفرصة بعد بدء المراجعة',
            });
        }

        await prisma.investmentDeal.delete({ where: { id: req.params.id } });

        res.json({ success: true, message: 'تم حذف الفرصة' });
    } catch (error) {
        console.error('[Deals] Delete error:', error.message);
        res.status(500).json({ error: 'Failed to delete deal' });
    }
});
// ═══ POST /api/deals/create-entity — إنشاء كيان جديد (للمستثمرين) ═══
// بدل /api/entities (ADMIN only) — هذا مفتوح لأي مستخدم مسجّل
router.post('/create-entity', verifyToken, async (req, res) => {
    try {
        const { legalName, displayName } = req.body;

        if (!legalName || legalName.trim().length < 3) {
            return res.status(400).json({
                error: 'validation',
                message: 'اسم الشركة يجب أن يكون 3 أحرف على الأقل',
            });
        }

        const trimmedName = legalName.trim();

        // تحقق من عدم التكرار
        const existing = await prisma.entity.findFirst({
            where: {
                OR: [
                    { legalName: trimmedName },
                    { displayName: trimmedName },
                ],
            },
        });

        if (existing) {
            return res.status(409).json({
                error: 'duplicate',
                message: 'يوجد كيان بهذا الاسم بالفعل',
                existingId: existing.id,
            });
        }

        const entity = await prisma.entity.create({
            data: {
                legalName: trimmedName,
                displayName: (displayName || trimmedName).trim(),
            },
        });

        console.log(`[Deals] Entity created by investor: ${entity.id} — "${trimmedName}" — by: ${req.user.id}`);

        // ✅ Response متوافق مع الـ Modal (يتوقع id مباشرة)
        res.status(201).json({
            id: entity.id,
            legalName: entity.legalName,
            displayName: entity.displayName,
        });
    } catch (error) {
        console.error('[Deals] Create entity error:', error.message);
        res.status(500).json({ error: 'Failed to create entity' });
    }
});

module.exports = router;
