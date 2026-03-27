const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

// ===============================================
// GET /api/issues
// جلب قائمة المشاكل مع دعم الفلاتر
// ===============================================
router.get('/', verifyToken, async (req, res) => {
    try {
        const { companyId, type, status, priority, department, investorId } = req.query;
        let where = {};

        // الحماية: يجب على المستخدم العادي أن يرى فقط مشاكل شركته (أو التي هو مسؤول عنها)
        const activeEntity = req.headers['x-entity-id'];

        if (req.user.systemRole !== 'SUPER_ADMIN') {
            // المستثمر يمكنه رؤية ما يرتبط به
            if (req.user.userType === 'INVESTOR') {
                where.investorId = req.user.id;
            } else {
                // المستخدم الموظف/المدير يمكنه رؤية مشاكل منشأته النشطة أو التي تم تكليفه بها
                where.OR = [
                    { companyId: activeEntity },
                    { assignedTo: req.user.id }
                ];
            }
        }

        // تطبيق الفلاتر الإضافية
        if (companyId && req.user.systemRole === 'SUPER_ADMIN') where.companyId = companyId;
        if (type) where.type = type;
        if (status) where.status = status;
        if (priority) where.priority = priority;
        if (department) where.department = department;
        if (investorId && req.user.systemRole === 'SUPER_ADMIN') where.investorId = investorId;

        const issues = await prisma.issue.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                assignedUser: { select: { id: true, name: true, email: true } },
                createdBy: { select: { id: true, name: true } },
                company: { select: { id: true, legalName: true, displayName: true } }
            }
        });

        res.json(issues);
    } catch (err) {
        console.error('[GET /api/issues]', err);
        res.status(500).json({ error: 'Failed to fetch issues' });
    }
});

// ===============================================
// POST /api/issues
// إنشاء مشكلة جديدة
// ===============================================
router.post('/', verifyToken, async (req, res) => {
    try {
        const { title, description, type, priority, companyId, department, assignedTo, source, investorId } = req.body;

        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }

        const activeEntity = req.headers['x-entity-id'];
        const targetCompanyId = companyId || activeEntity;

        const newIssue = await prisma.issue.create({
            data: {
                title,
                description,
                type: type || 'STRATEGIC',
                priority: priority || 'MEDIUM',
                department,
                source: source || 'MANUAL',
                companyId: targetCompanyId,
                assignedTo,
                investorId,
                createdById: req.user.id
            }
        });

        res.status(201).json(newIssue);
    } catch (err) {
        console.error('[POST /api/issues]', err);
        res.status(500).json({ error: 'Failed to create issue' });
    }
});

// ===============================================
// PATCH /api/issues/:id
// تحديث خصائص المشكلة (الحالة، الأولوية، إلخ)
// ===============================================
router.patch('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // التحقق من الصلاحية (أن المشكلة تابعة لشركته أو هو مكلف بها) يضاف هنا مستقبلاً

        const updatedIssue = await prisma.issue.update({
            where: { id },
            data: updates
        });

        res.json(updatedIssue);
    } catch (err) {
        console.error('[PATCH /api/issues/:id]', err);
        res.status(500).json({ error: 'Failed to update issue' });
    }
});

// ===============================================
// POST /api/issues/:id/resolve
// حل المشكلة وإغلاقها
// ===============================================
router.post('/:id/resolve', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { resolution } = req.body;

        const resolvedIssue = await prisma.issue.update({
            where: { id },
            data: {
                status: 'RESOLVED',
                resolution,
                resolvedAt: new Date()
            }
        });

        res.json(resolvedIssue);
    } catch (err) {
        console.error('[POST /api/issues/:id/resolve]', err);
        res.status(500).json({ error: 'Failed to resolve issue' });
    }
});

module.exports = router;
