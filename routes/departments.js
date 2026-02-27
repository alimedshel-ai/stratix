const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');

const router = express.Router();

// ============ DEPARTMENTS API ============

// الأقسام الافتراضية الثمانية
const DEFAULT_DEPARTMENTS = [
    { code: 'FINANCE', name: 'المالية', icon: 'bi-cash-coin', color: '#f59e0b' },
    { code: 'MARKETING', name: 'التسويق', icon: 'bi-megaphone', color: '#8b5cf6' },
    { code: 'OPERATIONS', name: 'العمليات', icon: 'bi-gear', color: '#3b82f6' },
    { code: 'HR', name: 'الموارد البشرية', icon: 'bi-people', color: '#10b981' },
    { code: 'TECH', name: 'التقنية', icon: 'bi-cpu', color: '#06b6d4' },
    { code: 'SALES', name: 'المبيعات', icon: 'bi-cart3', color: '#ef4444' },
    { code: 'SUPPORT', name: 'خدمة العملاء', icon: 'bi-headset', color: '#ec4899' },
    { code: 'LEGAL', name: 'الشؤون القانونية والإدارية', icon: 'bi-shield-check', color: '#6366f1' },
];

// الأدوار الوظيفية المقابلة لكل قسم
const DEPT_ROLE_MAP = {
    FINANCE: 'CFO',
    MARKETING: 'CMO',
    OPERATIONS: 'COO',
    HR: 'CHRO',
    TECH: 'CTO',
    SALES: 'CSO',
    SUPPORT: 'CCO',
    LEGAL: 'CLO',
};

// ========== GET departments for entity ==========
router.get('/:entityId', verifyToken, async (req, res) => {
    try {
        const { entityId } = req.params;

        let departments = await prisma.department.findMany({
            where: { entityId },
            include: {
                members: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true, avatarUrl: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        // لو ما فيه أقسام، ننشئها تلقائياً
        if (departments.length === 0) {
            const created = await prisma.$transaction(
                DEFAULT_DEPARTMENTS.map(dept =>
                    prisma.department.create({
                        data: {
                            entityId,
                            ...dept
                        }
                    })
                )
            );
            departments = created.map(d => ({ ...d, members: [] }));
        }

        res.json(departments);
    } catch (error) {
        console.error('Error fetching departments:', error);
        res.status(500).json({ error: 'Failed to fetch departments' });
    }
});

// ========== GET team overview (for CEO) ==========
router.get('/:entityId/team-overview', verifyToken, async (req, res) => {
    try {
        const { entityId } = req.params;

        const departments = await prisma.department.findMany({
            where: { entityId },
            include: {
                members: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true, avatarUrl: true, lastLogin: true }
                        }
                    }
                }
            }
        });

        const invitations = await prisma.invitation.findMany({
            where: { entityId, status: 'PENDING' }
        });

        const totalDepts = departments.length;
        const filledDepts = departments.filter(d => d.members.length > 0).length;
        const completedDepts = departments.filter(d => d.dataStatus === 'COMPLETED').length;
        const avgProgress = totalDepts > 0
            ? Math.round(departments.reduce((s, d) => s + d.dataPercent, 0) / totalDepts)
            : 0;

        res.json({
            departments: departments.map(d => ({
                id: d.id,
                code: d.code,
                name: d.name,
                icon: d.icon,
                color: d.color,
                dataStatus: d.dataStatus,
                dataPercent: d.dataPercent,
                dataSummary: d.dataSummary ? JSON.parse(d.dataSummary) : null,
                members: d.members.map(m => ({
                    id: m.id,
                    departmentRole: m.departmentRole,
                    role: m.role,
                    user: m.user,
                    joinedAt: m.joinedAt
                })),
                hasMember: d.members.length > 0,
                expectedRole: DEPT_ROLE_MAP[d.code] || null
            })),
            pendingInvitations: invitations,
            summary: {
                totalDepartments: totalDepts,
                filledDepartments: filledDepts,
                completedDepartments: completedDepts,
                averageProgress: avgProgress,
                pendingInvitations: invitations.length
            }
        });
    } catch (error) {
        console.error('Error fetching team overview:', error);
        res.status(500).json({ error: 'Failed to fetch team overview' });
    }
});

// ========== UPDATE department data status ==========
router.patch('/:departmentId/data', verifyToken, async (req, res) => {
    try {
        const { departmentId } = req.params;
        const { dataStatus, dataPercent, dataSummary } = req.body;

        const updateData = {};
        if (dataStatus) updateData.dataStatus = dataStatus;
        if (dataPercent !== undefined) updateData.dataPercent = Math.min(100, Math.max(0, dataPercent));
        if (dataSummary) updateData.dataSummary = typeof dataSummary === 'string' ? dataSummary : JSON.stringify(dataSummary);

        const dept = await prisma.department.update({
            where: { id: departmentId },
            data: updateData
        });

        res.json(dept);
    } catch (error) {
        console.error('Error updating department data:', error);
        res.status(500).json({ error: 'Failed to update department data' });
    }
});

module.exports = router;
