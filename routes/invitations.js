const express = require('express');
const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');
const { verifyToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');
const { sendMail, invitationEmail } = require('../lib/mailer');

const router = express.Router();

// ============ INVITATIONS API ============
// نظام دعوة أعضاء الفريق الاستراتيجي

// الأدوار الوظيفية المتاحة
const DEPARTMENT_ROLES = {
    CEO: { label: 'المدير التنفيذي', icon: '👤', deptCode: null },
    CFO: { label: 'المدير المالي', icon: '💰', deptCode: 'FINANCE' },
    CMO: { label: 'مدير التسويق', icon: '📢', deptCode: 'MARKETING' },
    COO: { label: 'مدير العمليات', icon: '⚙️', deptCode: 'OPERATIONS' },
    CTO: { label: 'مدير التقنية', icon: '💻', deptCode: 'TECH' },
    CHRO: { label: 'مدير الموارد البشرية', icon: '👥', deptCode: 'HR' },
    CSO: { label: 'مدير المبيعات', icon: '📦', deptCode: 'SALES' },
    CCO: { label: 'مدير خدمة العملاء', icon: '🎧', deptCode: 'SUPPORT' },
    CLO: { label: 'مدير الشؤون القانونية', icon: '📋', deptCode: 'LEGAL' },
};

// ========== CREATE invitation ==========
router.post('/', verifyToken, checkPermission('ADMIN'), async (req, res) => {
    try {
        const { entityId, email, name, departmentRole, role, message } = req.body;

        if (!entityId || !email || !departmentRole) {
            return res.status(400).json({
                error: 'البريد الإلكتروني والدور الوظيفي والكيان مطلوبة'
            });
        }

        // تحقق: الدور موجود
        if (!DEPARTMENT_ROLES[departmentRole]) {
            return res.status(400).json({
                error: 'دور وظيفي غير صالح',
                validRoles: Object.keys(DEPARTMENT_ROLES)
            });
        }

        // تحقق: هل يوجد دعوة سابقة نشطة لنفس البريد
        const existing = await prisma.invitation.findFirst({
            where: {
                entityId,
                email: email.toLowerCase().trim(),
                status: 'PENDING'
            }
        });

        if (existing) {
            return res.status(409).json({
                error: 'يوجد دعوة فعّالة لهذا البريد الإلكتروني بالفعل'
            });
        }

        // تحقق: هل المستخدم مسجل ومنضم للكيان أصلاً
        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() }
        });

        if (existingUser) {
            const existingMembership = await prisma.member.findUnique({
                where: {
                    userId_entityId: {
                        userId: existingUser.id,
                        entityId
                    }
                }
            });

            if (existingMembership) {
                return res.status(409).json({
                    error: 'هذا المستخدم منضم للكيان بالفعل'
                });
            }
        }

        // إنشاء الدعوة (صلاحية 7 أيام)
        const invitation = await prisma.invitation.create({
            data: {
                entityId,
                email: email.toLowerCase().trim(),
                name: name || null,
                departmentRole,
                role: role || 'EDITOR',
                invitedBy: req.user.id,
                message: message || null,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 أيام
            },
            include: { entity: { select: { displayName: true, legalName: true } } }
        });

        // بناء رابط الدعوة
        const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
        const inviteLink = `${baseUrl}/join?token=${invitation.token}`;

        // Send invitation email (non-blocking)
        const roleLabel = DEPARTMENT_ROLES[departmentRole]?.label || departmentRole;
        const entityName = invitation.entity?.displayName || invitation.entity?.legalName || 'الشركة';
        const inviterName = req.user?.name || 'أحد الأعضاء';
        const tmpl = invitationEmail({
            inviteeName: name || '',
            invitedByName: inviterName,
            entityName,
            role: roleLabel,
            inviteLink,
            message: message || null,
            expiresAt: invitation.expiresAt,
        });
        sendMail({ to: email, ...tmpl }).catch(() => {});

        res.status(201).json({
            invitation,
            inviteLink,
            roleInfo: DEPARTMENT_ROLES[departmentRole],
            message: `تم إنشاء دعوة لـ ${email} بدور ${DEPARTMENT_ROLES[departmentRole].label}`
        });
    } catch (error) {
        console.error('Error creating invitation:', error);
        res.status(500).json({ error: 'فشل في إنشاء الدعوة' });
    }
});

// ========== GET invitations for entity ==========
router.get('/entity/:entityId', verifyToken, async (req, res) => {
    try {
        const { entityId } = req.params;
        const { status } = req.query;

        const where = { entityId };
        if (status) where.status = status;

        const invitations = await prisma.invitation.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });

        // إضافة معلومات الدور
        const enriched = invitations.map(inv => ({
            ...inv,
            roleInfo: DEPARTMENT_ROLES[inv.departmentRole] || {},
            isExpired: new Date(inv.expiresAt) < new Date() && inv.status === 'PENDING'
        }));

        res.json(enriched);
    } catch (error) {
        console.error('Error fetching invitations:', error);
        res.status(500).json({ error: 'فشل في جلب الدعوات' });
    }
});

// ========== VIEW invitation by token (public) ==========
router.get('/view/:token', async (req, res) => {
    try {
        const { token } = req.params;

        const invitation = await prisma.invitation.findUnique({
            where: { token },
            include: {
                entity: {
                    select: { id: true, legalName: true, displayName: true, logoUrl: true }
                }
            }
        });

        if (!invitation) {
            return res.status(404).json({ error: 'الدعوة غير موجودة' });
        }

        if (invitation.status !== 'PENDING') {
            return res.status(410).json({
                error: invitation.status === 'ACCEPTED' ? 'تم قبول هذه الدعوة مسبقاً' : 'هذه الدعوة ملغية',
                status: invitation.status
            });
        }

        if (new Date(invitation.expiresAt) < new Date()) {
            // تحديث الحالة لمنتهية
            await prisma.invitation.update({
                where: { id: invitation.id },
                data: { status: 'EXPIRED' }
            });
            return res.status(410).json({ error: 'انتهت صلاحية هذه الدعوة', status: 'EXPIRED' });
        }

        res.json({
            id: invitation.id,
            entity: invitation.entity,
            departmentRole: invitation.departmentRole,
            roleInfo: DEPARTMENT_ROLES[invitation.departmentRole],
            email: invitation.email,
            name: invitation.name,
            message: invitation.message,
            expiresAt: invitation.expiresAt
        });
    } catch (error) {
        console.error('Error viewing invitation:', error);
        res.status(500).json({ error: 'فشل في عرض الدعوة' });
    }
});

// ========== ACCEPT invitation ==========
router.post('/accept/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const { name, password } = req.body;

        const invitation = await prisma.invitation.findUnique({
            where: { token },
            include: { entity: true }
        });

        if (!invitation) {
            return res.status(404).json({ error: 'الدعوة غير موجودة' });
        }

        if (invitation.status !== 'PENDING') {
            return res.status(410).json({ error: 'هذه الدعوة لم تعد صالحة' });
        }

        if (new Date(invitation.expiresAt) < new Date()) {
            await prisma.invitation.update({
                where: { id: invitation.id },
                data: { status: 'EXPIRED' }
            });
            return res.status(410).json({ error: 'انتهت صلاحية هذه الدعوة' });
        }

        // هل المستخدم مسجل؟
        let user = await prisma.user.findUnique({
            where: { email: invitation.email }
        });

        if (!user) {
            // تسجيل جديد
            if (!password || password.length < 6) {
                return res.status(400).json({
                    error: 'كلمة المرور مطلوبة (6 أحرف على الأقل)',
                    requiresRegistration: true
                });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            user = await prisma.user.create({
                data: {
                    email: invitation.email,
                    password: hashedPassword,
                    name: name || invitation.name || invitation.email.split('@')[0],
                    onboardingCompleted: true
                }
            });
        }

        // ربط بالقسم المناسب
        const deptCode = DEPARTMENT_ROLES[invitation.departmentRole]?.deptCode;
        let departmentId = null;

        if (deptCode) {
            const dept = await prisma.department.findFirst({
                where: { entityId: invitation.entityId, code: deptCode }
            });
            if (dept) departmentId = dept.id;
        }

        // إنشاء العضوية
        const membership = await prisma.member.create({
            data: {
                userId: user.id,
                entityId: invitation.entityId,
                role: invitation.role,
                userType: 'DEPT_MANAGER',
                departmentRole: invitation.departmentRole,
                departmentId,
                invitedBy: invitation.invitedBy
            }
        });

        // تحديث حالة الدعوة
        await prisma.invitation.update({
            where: { id: invitation.id },
            data: {
                status: 'ACCEPTED',
                acceptedAt: new Date()
            }
        });

        // Generate JWT token for auto-login
        const jwt = require('jsonwebtoken');
        const jwtToken = jwt.sign(
            {
                id: user.id,
                email: user.email,
                name: user.name,
                systemRole: user.systemRole || 'USER'
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: `مرحباً ${user.name}! تم انضمامك بنجاح كـ ${DEPARTMENT_ROLES[invitation.departmentRole]?.label}`,
            user: { id: user.id, name: user.name, email: user.email },
            membership,
            token: jwtToken,
            redirectTo: '/dashboard.html'
        });
    } catch (error) {
        console.error('Error accepting invitation:', error);
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'أنت منضم لهذا الكيان بالفعل' });
        }
        res.status(500).json({ error: 'فشل في قبول الدعوة' });
    }
});

// ========== CANCEL invitation ==========
router.delete('/:id', verifyToken, checkPermission('ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.invitation.update({
            where: { id },
            data: { status: 'CANCELLED' }
        });

        res.json({ message: 'تم إلغاء الدعوة بنجاح' });
    } catch (error) {
        console.error('Error cancelling invitation:', error);
        res.status(500).json({ error: 'فشل في إلغاء الدعوة' });
    }
});

// ========== RESEND invitation (reset expiry) ==========
router.post('/:id/resend', verifyToken, checkPermission('ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;

        const invitation = await prisma.invitation.update({
            where: { id },
            data: {
                status: 'PENDING',
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                // token يبقى نفسه
            }
        });

        const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
        const inviteLink = `${baseUrl}/join?token=${invitation.token}`;

        // Re-send invitation email (non-blocking)
        const resendEntity = await prisma.entity.findUnique({
            where: { id: invitation.entityId },
            select: { displayName: true, legalName: true }
        });
        const resendTmpl = invitationEmail({
            inviteeName: invitation.name || '',
            invitedByName: req.user?.name || 'أحد الأعضاء',
            entityName: resendEntity?.displayName || resendEntity?.legalName || 'الشركة',
            role: invitation.departmentRole,
            inviteLink,
            message: invitation.message,
            expiresAt: invitation.expiresAt,
        });
        sendMail({ to: invitation.email, ...resendTmpl }).catch(() => {});

        res.json({
            message: 'تم تجديد الدعوة بنجاح',
            inviteLink,
            expiresAt: invitation.expiresAt
        });
    } catch (error) {
        console.error('Error resending invitation:', error);
        res.status(500).json({ error: 'فشل في إعادة إرسال الدعوة' });
    }
});

// ========== GET department roles reference ==========
router.get('/roles/list', async (req, res) => {
    res.json(DEPARTMENT_ROLES);
});

module.exports = router;
