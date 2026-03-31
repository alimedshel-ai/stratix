/**
 * SessionSaveService - منطق حفظ نتائج الجلسة وربطها بالمستخدم
 */
'use strict';

const prisma = require('./prisma');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { getSessionByTempId, getSessionAnswers } = require('./diag-session-service');



/**
 * دالة مؤقتة لإرسال البريد (تطبع في الكونسول حتى يتم ربط Nodemailer)
 */
async function sendEmail(to, subject, body) {
    // TODO: استبدل بـ Nodemailer المدمج في المشروع لاحقاً (lib/mailer.js)
    console.log(`\n📧 [EMAIL SIMULATION] 
    To: ${to}
    Subject: ${subject}
    Body: ${body}\n`);
}

/**
 * توليد توكن عشوائي
 */
function generateMagicToken() {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * حفظ الجلسة وربطها بمستخدم ومنشأة
 * @param {string} tempSessionId 
 * @param {string} email 
 * @param {Object} orgData - { orgName, sectorId, teamSize, stage, userName, password }
 */
async function saveSession(tempSessionId, email, orgData = {}) {
    const { password, userName } = orgData;

    // 1. التحقق من الجلسة
    const session = await getSessionByTempId(tempSessionId);
    if (!session) {
        throw new Error('SESSION_NOT_FOUND: الجلسة غير موجودة');
    }
    if (session.entityId) {
        throw new Error('SESSION_ALREADY_LINKED: هذه الجلسة مرتبطة بالفعل بمنشأة');
    }

    // 2. جلب الإجابات المسجلة لاستكمال البيانات الناقصة
    const answers = await getSessionAnswers(tempSessionId);

    // سحب البيانات الأساسية من الإجابات إذا لم تكن موجودة في orgData
    const finalOrgData = {
        orgName: orgData.orgName || answers.org_name || 'My Business',
        sectorId: orgData.sectorId || answers.sector || 'other',
        teamSize: orgData.teamSize || answers.team_size || '1-5',
        stage: orgData.stage || answers.maturity || 'growing',
        userName: userName || answers.user_name || email.split('@')[0],
        password: password || crypto.randomBytes(16).toString('hex')
    };

    // 3. تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(finalOrgData.password, 10);

    // 4. تنفيذ المعاملة (Transaction)
    const result = await prisma.$transaction(async (tx) => {
        // أ. التحقق مما إذا كان المستخدم موجوداً مسبقاً
        const existingUser = await tx.user.findUnique({ where: { email } });

        if (existingUser) {
            // التحقق من صحة كلمة المرور للمستخدم القديم
            const isValid = await bcrypt.compare(finalOrgData.password, existingUser.password);
            if (!isValid) {
                throw new Error('AUTH_FAILED: كلمة المرور للمستخدم الموجود غير صحيحة');
            }
        }

        // ب. upsert المستخدم
        const user = await tx.user.upsert({
            where: { email },
            update: { onboardingCompleted: true },
            create: {
                email,
                name: finalOrgData.userName,
                password: hashedPassword,
                stratixRole: 'OWNER_FOUNDER',
                systemRole: 'USER',
                onboardingCompleted: true
            },
        });

        // ب. إنشاء المنشأة (Entity) - وفقاً لأسماء الحقول في schema.prisma
        const entity = await tx.entity.create({
            data: {
                legalName: finalOrgData.orgName,
                displayName: finalOrgData.orgName,
                sectorId: (finalOrgData.sectorId && finalOrgData.sectorId.length > 20) ? finalOrgData.sectorId : null, // Only use CUID
                sectorKey: finalOrgData.sectorId || null,  // Use it as sectorKey if it's like 'saas'
                stageKey: finalOrgData.stage || null,      // V2 field
                teamSizeKey: finalOrgData.teamSize || null, // V2 field
                size: finalOrgData.teamSize || null,      // Legacy field compatibility
                isActive: true
            },
        });


        // ج. ربط المستخدم بالمنشأة كـ Owner عبر جدول Members
        await tx.member.create({
            data: {
                userId: user.id,
                entityId: entity.id,
                role: 'OWNER',
                userType: 'COMPANY_MANAGER'
            }
        });

        // د. تحديث الجلسة بربطها بالمستخدم والمنشأة
        await tx.diagSession.update({
            where: { id: session.id },
            data: {
                entityId: entity.id,
                startedByUserId: user.id,
                status: 'completed' // أو حسب تدفق العمل
            },
        });

        // هـ. تنظيف روابط الدخول السحرية القديمة للجلسة
        await tx.magicLink.deleteMany({
            where: {
                sessionId: session.id,
                usedAt: null,
            },
        });

        // و. إنشاء رابط دخول سحري جديد
        const token = generateMagicToken();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 ساعة
        const magicLink = await tx.magicLink.create({
            data: {
                token,
                userId: user.id,
                sessionId: session.id,
                expiresAt,
            },
        });

        return { user, entity, magicLink };
    });

    // 3. إرسال البريد (خارج المعاملة)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const magicLinkUrl = `${frontendUrl}/auth/magic?token=${result.magicLink.token}`;

    let emailSent = true;
    try {
        await sendEmail(
            email,
            'رابط دخولك إلى تقرير التشخيص - Stratix',
            `مرحباً ${result.user.name}،\n\nلقد تم حفظ نتائج التشخيص الخاصة بك في منصة Stratix.\nيمكنك الوصول إلى تقريرك الكامل وإعدادات منشأتك "${result.entity.legalName}" عبر الرابط التالي:\n\n${magicLinkUrl}\n\nهذا الرابط صالح لمدة 24 ساعة فقط.\n\nنتمنى لك استراتيجية ناجحة،\nفريق Stratix`
        );
    } catch (emailError) {
        console.error('[EMAIL_FAILED]', emailError);
        emailSent = false;
    }

    return {
        success: true,
        userId: result.user.id,
        entityId: result.entity.id,
        user: result.user,
        sessionId: session.id,
        emailSent,
        message: emailSent
            ? 'تم حفظ نتائجك بنجاح. راجع بريدك الإلكتروني للدخول.'
            : 'تم حفظ نتائجك. تعذّر إرسال البريد — يمكنك طلب رابط جديد من صفحة النتائج.',
    };
}

module.exports = {
    saveSession
};
