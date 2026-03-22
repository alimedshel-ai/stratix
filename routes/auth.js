const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');
const { validateLogin } = require('../middleware/validation');

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: تسجيل مستخدم جديد مع إنشاء شركة وكيان
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, name]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: ahmed@company.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: MyP@ss123!
 *                 minLength: 6
 *               name:
 *                 type: string
 *                 example: أحمد محمد
 *               companyName:
 *                 type: string
 *                 example: شركة التقنية
 *     responses:
 *       201:
 *         description: تم التسجيل بنجاح — يرجع token + بيانات المستخدم
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: بيانات ناقصة أو الإيميل مسجل مسبقاً
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: تسجيل الدخول والحصول على JWT Token
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: تم تسجيل الدخول بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: بيانات الدخول غير صحيحة
 *       403:
 *         description: الحساب معطّل
 */

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: جلب بيانات المستخدم الحالي
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: بيانات المستخدم
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Token غير صالح
 */

// ═══════════════════════════════════════════════════════
// Register — يسجل المستخدم فقط (بدون شركة/كيان)
// الشركة والكيان ينشأون في مرحلة الـ Onboarding
// ═══════════════════════════════════════════════════════
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, phone, userCategory, userType: reqUserType, diagnosticData } = req.body;

    // 1. التحقق من البيانات المطلوبة (إيميل + باسورد فقط — الباقي اختياري للاختبار)
    if (!email || !password) {
      return res.status(400).json({ error: 'الإيميل وكلمة المرور مطلوبة' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' });
    }

    // 2. التحقق من عدم تكرار البريد
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ error: 'البريد الإلكتروني مستخدم بالفعل' });
    }

    // 3. التحقق من عدم تكرار الجوال (إذا موجود)
    if (phone) {
      const cleanPhone = phone.replace(/\s+/g, '').replace(/[^\d+]/g, '');
      const existingPhone = await prisma.user.findFirst({ where: { phone: cleanPhone } });
      if (existingPhone) {
        return res.status(400).json({ error: 'رقم الجوال مسجل مسبقاً' });
      }
    }

    // 4. تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. تحديد userType من المرسل أو من userCategory
    let detectedUserType = reqUserType || 'EXPLORER';
    if (!reqUserType && userCategory) {
      if (userCategory.startsWith('DEPT_')) detectedUserType = 'DEPT_MANAGER';
      else if (userCategory.startsWith('INDIVIDUAL_') || userCategory === 'CONSULTANT_SOLO') detectedUserType = 'INDIVIDUAL';
      else if (userCategory === 'CONSULTANT_AGENCY') detectedUserType = 'CONSULTANT';
      else if (['COMPANY_MICRO', 'COMPANY_SMALL', 'COMPANY_MEDIUM', 'COMPANY_LARGE', 'COMPANY_ENTERPRISE', 'NEW_PROJECT', 'CEO'].includes(userCategory)) detectedUserType = 'COMPANY_MANAGER';
    }

    // 6. إنشاء المستخدم فقط (بدون شركة/كيان)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || 'مستخدم جديد',
        phone: phone ? phone.replace(/\s+/g, '').replace(/[^\d+]/g, '') : null,
        systemRole: 'USER',
        userCategory: userCategory || null,
        diagnosticData: diagnosticData ? JSON.stringify(diagnosticData) : null,
        onboardingCompleted: false,
      },
    });

    // 7. إنشاء JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        systemRole: 'USER',
        role: 'OWNER', // سيصبح OWNER عند إنشاء الكيان
        userType: detectedUserType,
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.cookie('token', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    // 8. الرد
    res.status(201).json({
      message: 'تم إنشاء الحساب بنجاح',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        systemRole: 'USER',
        role: 'OWNER',
        userType: detectedUserType,
        userCategory: user.userCategory,
        onboardingCompleted: false,
        entity: null,
        memberships: [],
      },
      // التوجيه يتم من الفرونت (login.html) حسب نوع المستخدم وبياناته
    });
  } catch (error) {
    console.error('Registration Error:', error);
    if (error.code === 'P2002') {
      const field = error.meta?.target?.includes('phone') ? 'رقم الجوال' : 'البريد الإلكتروني';
      return res.status(400).json({ error: `${field} مستخدم بالفعل` });
    }
    res.status(500).json({ error: 'فشل إنشاء الحساب، يرجى المحاولة لاحقاً' });
  }
});

// ═══ التحقق من رقم الجوال (هل موجود؟) ═══
router.post('/check-phone', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'رقم الجوال مطلوب' });

    const cleanPhone = phone.replace(/\s+/g, '').replace(/[^\d+]/g, '');
    const existing = await prisma.user.findFirst({ where: { phone: cleanPhone } });

    res.json({ exists: !!existing });
  } catch (error) {
    res.status(500).json({ error: 'فشل التحقق' });
  }
});

// ═══ إرسال كود التحقق SMS ═══
router.post('/send-code', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'رقم الجوال مطلوب' });

    const cleanPhone = phone.replace(/\s+/g, '').replace(/[^\d+]/g, '');

    // توليد كود عشوائي (6 أرقام)
    // ⚠️ للاختبار: الكود دائماً 123456
    const code = process.env.NODE_ENV === 'production'
      ? Math.floor(100000 + Math.random() * 900000).toString()
      : '123456';

    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 دقائق

    // حفظ الكود (مؤقت — نبحث عن المستخدم أو نحفظه في ذاكرة مؤقتة)
    // لو المستخدم مسجل بالفعل
    const user = await prisma.user.findFirst({ where: { phone: cleanPhone } });
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { verificationCode: code, verificationExpiry: expiry }
      });
    }

    // TODO: إرسال SMS حقيقي (Twilio/Unifonic)
    // await sendSMS(cleanPhone, `كود التحقق: ${code}`);

    console.log(`📱 SMS Code for ${cleanPhone}: ${code}`); // للتطوير

    res.json({
      message: 'تم إرسال كود التحقق',
      // في بيئة التطوير فقط — نرجع الكود
      ...(process.env.NODE_ENV !== 'production' && { devCode: code }),
    });
  } catch (error) {
    console.error('Send code error:', error);
    res.status(500).json({ error: 'فشل إرسال كود التحقق' });
  }
});

// ═══ التحقق من كود SMS ═══
router.post('/verify-code', verifyToken, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'كود التحقق مطلوب' });

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'مستخدم غير موجود' });

    // في بيئة التطوير — الكود دائماً 123456
    const isDevMode = process.env.NODE_ENV !== 'production';
    const isValidCode = isDevMode
      ? code === '123456'
      : (user.verificationCode === code && user.verificationExpiry && new Date() < new Date(user.verificationExpiry));

    if (!isValidCode) {
      return res.status(400).json({ error: 'كود التحقق غير صحيح أو منتهي الصلاحية' });
    }

    // تأكيد التحقق
    await prisma.user.update({
      where: { id: user.id },
      data: {
        phoneVerified: true,
        verificationCode: null,
        verificationExpiry: null,
      }
    });

    res.json({ message: 'تم التحقق من رقم الجوال بنجاح', phoneVerified: true });
  } catch (error) {
    console.error('Verify code error:', error);
    res.status(500).json({ error: 'فشل التحقق من الكود' });
  }
});

// Login
router.post('/login', (req, res, next) => {
  // تنظيف الإيميل قبل التحقق (Validation) لتجنب خطأ 400
  if (req.body && req.body.email && typeof req.body.email === 'string') {
    req.body.email = req.body.email.trim();
  }
  next();
}, validateLogin, async (req, res) => {
  try {
    // تنظيف الإيميل من المسافات الزائدة وتحويله لحروف صغيرة
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password;

    // Find user with memberships
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          include: {
            entity: {
              include: { company: { select: { id: true, nameAr: true, nameEn: true } } }
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // حل مشكلة كلمات المرور غير المشفرة (Plain text) من الاستيراد القديم
      if (password === user.password) {
        const hashedNewPassword = await bcrypt.hash(password, 10);
        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashedNewPassword }
        });
      } else {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
    }

    // التحقق من تعطيل الحساب
    if (user.disabled) {
      return res.status(403).json({ message: 'الحساب معطّل — تواصل مع مدير النظام' });
    }

    // التحقق من تعليق الشركة (SUSPENDED)
    const userCompany = user.memberships[0]?.entity?.company;
    if (userCompany && user.systemRole !== 'SUPER_ADMIN') {
      const company = await prisma.company.findUnique({
        where: { id: userCompany.id },
        select: { status: true, suspendedAt: true, suspendReason: true }
      });
      if (company?.status === 'SUSPENDED') {
        // نسمح بالدخول لكن نرسل علامة التعليق
        const suspendedToken = jwt.sign(
          { id: user.id, email: user.email, name: user.name, systemRole: user.systemRole || 'USER', role: 'VIEWER', suspended: true },
          process.env.JWT_SECRET,
          { expiresIn: '2h' }
        );
        return res.status(403).json({
          suspended: true,
          message: 'حسابك معلق مؤقتاً',
          reason: company.suspendReason || 'تجاوز حدود الباقة',
          suspendedAt: company.suspendedAt,
          token: suspendedToken,
          user: { id: user.id, name: user.name, email: user.email }
        });
      }
    }

    // تحديث آخر تسجيل دخول
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    }).catch(() => { });

    // Get primary role (first membership or default)
    // SUPER_ADMIN يحصل على OWNER تلقائياً لو ما عنده membership
    const isSA = user.systemRole === 'SUPER_ADMIN';
    const primaryRole = user.memberships[0]?.role || (isSA ? 'OWNER' : 'VIEWER');
    let primaryUserType = user.memberships[0]?.userType || null;
    // إذا ما عنده membership — نستنتج من userCategory
    if (!primaryUserType) {
      const cat = user.userCategory || '';
      if (cat.startsWith('DEPT_')) primaryUserType = 'DEPT_MANAGER';
      else if (cat.startsWith('INDIVIDUAL_') || cat === 'CONSULTANT_SOLO') primaryUserType = 'INDIVIDUAL';
      else if (cat === 'CONSULTANT_AGENCY') primaryUserType = 'CONSULTANT';
      else if (['COMPANY_MICRO', 'COMPANY_SMALL', 'COMPANY_MEDIUM', 'COMPANY_LARGE', 'COMPANY_ENTERPRISE', 'NEW_PROJECT', 'CEO'].includes(cat)) primaryUserType = 'COMPANY_MANAGER';
      else primaryUserType = 'EXPLORER';
    }
    const primaryEntity = user.memberships[0]?.entity || null;

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        systemRole: user.systemRole || 'USER',
        role: primaryRole,
        userType: primaryUserType,
        entityId: primaryEntity?.id || null,
        companyId: primaryEntity?.company?.id || primaryEntity?.companyId || null,
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.cookie('token', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        systemRole: user.systemRole || 'USER',
        role: primaryRole,
        userType: primaryUserType,
        userCategory: user.userCategory || null,
        onboardingCompleted: user.onboardingCompleted || false,
        entity: primaryEntity,
        memberships: user.memberships,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Get current user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        memberships: {
          include: {
            entity: {
              include: { company: { select: { id: true, nameAr: true, nameEn: true } } }
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isSA2 = user.systemRole === 'SUPER_ADMIN';
    const primaryRole = user.memberships[0]?.role || (isSA2 ? 'OWNER' : 'VIEWER');
    const primaryUserType = user.memberships[0]?.userType || 'EXPLORER';
    const primaryEntity = user.memberships[0]?.entity || null;

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        systemRole: user.systemRole || 'USER',
        role: primaryRole,
        userType: primaryUserType,
        onboardingCompleted: user.onboardingCompleted || false,
        entity: primaryEntity,
        memberships: user.memberships,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
});

// Update profile (user name)
router.patch('/profile', verifyToken, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'الاسم مطلوب' });
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { name: name.trim() },
      select: { id: true, name: true, email: true },
    });

    res.json({ message: 'تم تحديث الاسم بنجاح', user });
  } catch (error) {
    res.status(500).json({ error: 'فشل تحديث الملف الشخصي' });
  }
});

// Update user type (EXPLORER/COMPANY_MANAGER/DEPT_MANAGER/CONSULTANT)
router.patch('/user-type', verifyToken, async (req, res) => {
  try {
    const { userType, entityId } = req.body;
    const validTypes = ['EXPLORER', 'COMPANY_MANAGER', 'DEPT_MANAGER', 'CONSULTANT'];

    if (!userType || !validTypes.includes(userType)) {
      return res.status(400).json({ error: 'نوع المستخدم غير صالح', validTypes });
    }

    const targetEntityId = entityId || req.user.entityId;
    if (!targetEntityId) {
      return res.status(400).json({ error: 'لا يوجد كيان مرتبط' });
    }

    // Find the membership
    const membership = await prisma.member.findFirst({
      where: { userId: req.user.id, entityId: targetEntityId },
    });

    if (!membership) {
      return res.status(404).json({ error: 'لا يوجد عضوية في هذا الكيان' });
    }

    // Update userType
    const updated = await prisma.member.update({
      where: { id: membership.id },
      data: { userType },
    });

    res.json({
      message: 'تم تحديث نوع المستخدم بنجاح',
      userType: updated.userType,
      memberId: updated.id,
    });
  } catch (error) {
    console.error('Error updating user type:', error);
    res.status(500).json({ error: 'فشل تحديث نوع المستخدم' });
  }
});

// Update or create company (OWNER/ADMIN only)
router.patch('/company', verifyToken, async (req, res) => {
  try {
    const { companyId, entityId, nameAr, nameEn } = req.body;
    const isSuperAdmin = req.user.systemRole === 'SUPER_ADMIN';

    if (!nameAr && !nameEn) {
      return res.status(400).json({ error: 'يجب تقديم nameAr أو nameEn' });
    }

    const companyNameAr = (nameAr || nameEn || '').trim();
    const companyNameEn = (nameEn || nameAr || '').trim();

    // Case 1: Update existing company
    if (companyId) {
      // Verify user has OWNER/ADMIN access
      const membership = await prisma.member.findFirst({
        where: {
          userId: req.user.id,
          entity: { companyId },
          role: { in: ['OWNER', 'ADMIN'] },
        },
      });

      if (!membership && !isSuperAdmin) {
        return res.status(403).json({ error: 'ليس لديك صلاحية تعديل بيانات الشركة' });
      }

      const company = await prisma.company.update({
        where: { id: companyId },
        data: { nameAr: companyNameAr, nameEn: companyNameEn },
        select: { id: true, nameAr: true, nameEn: true },
      });

      return res.json({ message: 'تم تحديث اسم الشركة بنجاح', company });
    }

    // Case 2: Create new company and link to entity
    const userEntityId = entityId || req.user.entityId;
    if (!userEntityId) {
      return res.status(400).json({ error: 'لا يوجد كيان مرتبط بحسابك' });
    }

    // Verify ownership
    const membership = await prisma.member.findFirst({
      where: {
        userId: req.user.id,
        entityId: userEntityId,
        role: { in: ['OWNER', 'ADMIN'] },
      },
    });

    if (!membership && !isSuperAdmin) {
      return res.status(403).json({ error: 'ليس لديك صلاحية' });
    }

    // Create company + link entity in transaction
    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: { nameAr: companyNameAr, nameEn: companyNameEn, status: 'ACTIVE' },
      });

      await tx.entity.update({
        where: { id: userEntityId },
        data: { companyId: company.id },
      });

      return company;
    });

    res.json({
      message: 'تم إنشاء الشركة وربطها بالكيان بنجاح',
      company: { id: result.id, nameAr: result.nameAr, nameEn: result.nameEn },
    });
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({ error: 'فشل تحديث بيانات الشركة' });
  }
});

// ═══ إكمال الـ Onboarding — إنشاء Company + Entity + Member + Version ═══
router.post('/complete-onboarding', verifyToken, async (req, res) => {
  try {
    const { companyName, sector, orgSize, orgType, commercialRegNo } = req.body;
    const userId = req.user.id;

    // التحقق من عدم تكرار رقم السجل
    if (commercialRegNo) {
      const existing = await prisma.entity.findFirst({ where: { commercialRegNo } });
      if (existing) {
        return res.status(400).json({ error: 'رقم السجل التجاري مسجل مسبقاً' });
      }
    }

    // التحقق من أن المستخدم ما عنده كيان (ما نكرر)
    const existingMembership = await prisma.member.findFirst({ where: { userId } });

    if (existingMembership) {
      // عنده كيان بالفعل — بس نحدد إن التأسيس مكتمل
      await prisma.user.update({
        where: { id: userId },
        data: { onboardingCompleted: true }
      });

      const entity = await prisma.entity.findUnique({
        where: { id: existingMembership.entityId },
        include: { company: { select: { id: true, nameAr: true } } }
      });

      return res.json({
        message: 'التأسيس مكتمل بالفعل',
        onboardingCompleted: true,
        entity,
        entityId: entity?.id,
      });
    }

    // إنشاء كل شي في Transaction واحد
    const entityName = companyName || 'منشأتي';

    // تحديد نوع المستخدم الفعلي من userCategory
    const currentUser = await prisma.user.findUnique({ where: { id: userId }, select: { userCategory: true } });
    const cat = currentUser?.userCategory || '';
    let actualUserType = 'COMPANY_MANAGER';
    if (cat.startsWith('DEPT_')) actualUserType = 'DEPT_MANAGER';
    else if (cat === 'CONSULTANT_AGENCY') actualUserType = 'CONSULTANT';

    const result = await prisma.$transaction(async (tx) => {
      // 1. إنشاء الشركة
      const company = await tx.company.create({
        data: {
          nameAr: entityName,
          nameEn: entityName,
          status: 'ACTIVE',
        },
      });

      // 2. إنشاء الكيان
      const entity = await tx.entity.create({
        data: {
          legalName: entityName,
          displayName: entityName,
          companyId: company.id,
          size: orgSize || null,
          commercialRegNo: commercialRegNo || null,
          isActive: true,
        },
      });

      // 3. إنشاء العضوية (بالنوع الفعلي)
      await tx.member.create({
        data: {
          userId,
          entityId: entity.id,
          role: 'OWNER',
          userType: actualUserType,
        },
      });

      // 4. إنشاء أول نسخة استراتيجية
      await tx.strategyVersion.create({
        data: {
          entityId: entity.id,
          versionNumber: 1,
          name: 'الخطة الاستراتيجية الأولى',
          description: 'تم إنشاؤها تلقائياً عند التأسيس',
          status: 'ACTIVE',
          isActive: true,
          createdBy: userId,
          activatedAt: new Date(),
        },
      });

      // 5. إنشاء 8 أقسام تلقائياً (للمستشار الذكي ومحرك القواعد)
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

      for (const dept of DEFAULT_DEPARTMENTS) {
        await tx.department.create({
          data: { entityId: entity.id, ...dept }
        });
      }

      // 6. تحديث المستخدم — التأسيس مكتمل
      await tx.user.update({
        where: { id: userId },
        data: { onboardingCompleted: true }
      });

      return { company, entity };
    });

    // 6. إنشاء توكن جديد يحتوي entityId و companyId
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const newToken = jwt.sign(
      {
        id: userId,
        email: user.email,
        name: user.name,
        systemRole: user.systemRole || 'USER',
        role: 'OWNER',
        userType: actualUserType,
        entityId: result.entity.id,
        companyId: result.company.id,
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.cookie('token', newToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({
      message: 'تم إكمال التأسيس بنجاح 🎉',
      onboardingCompleted: true,
      token: newToken,
      entity: result.entity,
      entityId: result.entity.id,
      companyId: result.company.id,
    });
  } catch (error) {
    console.error('Error completing onboarding:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'رقم السجل التجاري مستخدم بالفعل' });
    }
    res.status(500).json({ error: 'فشل إكمال التأسيس' });
  }
});

// ═══ تسجيل الخروج (مسح الكوكي من المتصفح) ═══
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  res.json({ message: 'تم تسجيل الخروج بنجاح' });
});

module.exports = router;
