/**
 * سكربت إنشاء شركة جديدة نظيفة
 * ═══════════════════════════════════════
 * الاستخدام:
 *   node scripts/new-company.js
 *
 * أو مع بيانات مخصصة:
 *   COMPANY_NAME="شركة الفلاح" OWNER_EMAIL="owner@alfalah.com" OWNER_PASS="P@ss1234" DEPT=sales node scripts/new-company.js
 *
 * ما يمسح أي بيانات — ينشئ شركة + كيان + مستخدم مالك + نسخة استراتيجية جاهزة
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createNewCompany() {
    // ═══ إعدادات قابلة للتخصيص عبر Environment Variables ═══
    const config = {
        companyNameAr: process.env.COMPANY_NAME || 'شركة المبيعات المتقدمة',
        companyNameEn: process.env.COMPANY_NAME_EN || 'Advanced Sales Co',
        companyCode: process.env.COMPANY_CODE || 'SALES_CO_' + Date.now().toString(36).toUpperCase(),
        ownerEmail: process.env.OWNER_EMAIL || 'owner@sales-co.com',
        ownerPassword: process.env.OWNER_PASS || 'Owner@2026!',
        ownerName: process.env.OWNER_NAME || 'مدير الشركة',
        entityName: process.env.ENTITY_NAME || 'المبيعات المتقدمة',
        sector: process.env.SECTOR || 'PVT',       // PVT, GOV, NPO
        industry: process.env.INDUSTRY || 'TECH',    // TECH, HEALTH, EDU
        size: process.env.SIZE || 'MEDIUM',           // SMALL, MEDIUM, LARGE
        dept: process.env.DEPT || '',                 // sales, hr, finance... (لإنشاء مدير إدارة مستقل)
        deptManagerEmail: process.env.DEPT_EMAIL || '',
        deptManagerPass: process.env.DEPT_PASS || 'Dept@2026!',
        deptManagerName: process.env.DEPT_NAME || '',
    };

    try {
        console.log('');
        console.log('╔══════════════════════════════════════════════╗');
        console.log('║   🏢 إنشاء شركة جديدة — Startix Platform   ║');
        console.log('╚══════════════════════════════════════════════╝');
        console.log('');

        // ═══ 1. التحقق من عدم التكرار ═══
        const existingUser = await prisma.user.findUnique({ where: { email: config.ownerEmail } });
        if (existingUser) {
            console.log(`⚠️  المستخدم ${config.ownerEmail} موجود مسبقاً (id: ${existingUser.id})`);
            console.log('   يمكنك تغيير الإيميل عبر: OWNER_EMAIL="new@email.com"');
            console.log('');
            // نستمر — ممكن يبي يضيف الكيان لمستخدم موجود
        }

        // ═══ 2. جلب البيانات المرجعية ═══
        const sector = await prisma.sector.findFirst({ where: { code: config.sector } });
        const industry = await prisma.industry.findFirst({ where: { code: config.industry } });
        const entityType = await prisma.entityType.findFirst({ where: { code: 'COMP' } });

        if (!sector || !industry) {
            console.log('❌ لم يتم العثور على بيانات مرجعية (Sector/Industry). شغّل seed أولاً:');
            console.log('   npx prisma db seed');
            process.exit(1);
        }

        // ═══ 3. إنشاء الشركة ═══
        console.log(`📌 إنشاء شركة: ${config.companyNameAr}`);
        const company = await prisma.company.create({
            data: {
                nameAr: config.companyNameAr,
                nameEn: config.companyNameEn,
                code: config.companyCode,
                status: 'ACTIVE',
            }
        });

        await prisma.subscription.create({
            data: {
                companyId: company.id,
                plan: 'PROFESSIONAL',
                status: 'ACTIVE',
                maxUsers: 25,
                maxEntities: 5,
            }
        });
        console.log(`   ✅ شركة: ${company.id}`);

        // ═══ 4. إنشاء الكيان ═══
        console.log(`📌 إنشاء كيان: ${config.entityName}`);
        const entity = await prisma.entity.create({
            data: {
                legalName: config.companyNameAr,
                displayName: config.entityName,
                companyId: company.id,
                sectorId: sector.id,
                industryId: industry.id,
                typeId: entityType?.id || undefined,
                size: config.size,
                school: 'BALANCED_SCORECARD',
            }
        });
        console.log(`   ✅ كيان: ${entity.id}`);

        // ═══ 5. إنشاء/ربط المالك ═══
        let owner = existingUser;
        if (!owner) {
            console.log(`📌 إنشاء مستخدم مالك: ${config.ownerEmail}`);
            const hashed = await bcrypt.hash(config.ownerPassword, 10);
            owner = await prisma.user.create({
                data: {
                    email: config.ownerEmail,
                    password: hashed,
                    name: config.ownerName,
                    userCategory: 'COMPANY_MANAGER',
                }
            });
            console.log(`   ✅ مالك: ${owner.id}`);
        }

        // ربط المالك بالكيان
        await prisma.member.create({
            data: {
                userId: owner.id,
                entityId: entity.id,
                role: 'OWNER',
                userType: 'COMPANY_MANAGER',
            }
        });
        console.log('   ✅ عضوية المالك مرتبطة');

        // ═══ 6. إنشاء نسخة استراتيجية ═══
        console.log('📌 إنشاء نسخة استراتيجية...');
        const version = await prisma.strategyVersion.create({
            data: {
                entityId: entity.id,
                versionNumber: 1,
                status: 'ACTIVE',
                name: `الخطة الاستراتيجية ${new Date().getFullYear()}-${new Date().getFullYear() + 2}`,
                description: `الخطة الاستراتيجية لـ ${config.entityName}`,
                isActive: true,
                createdBy: owner.id,
                approvedBy: owner.id,
                approvedAt: new Date(),
                activatedAt: new Date(),
            }
        });
        console.log(`   ✅ نسخة: ${version.id}`);

        // ═══ 7. إنشاء الأقسام الأساسية ═══
        console.log('📌 إنشاء الأقسام...');
        const departments = [
            { nameAr: 'المبيعات', nameEn: 'Sales', key: 'SALES' },
            { nameAr: 'الموارد البشرية', nameEn: 'HR', key: 'HR' },
            { nameAr: 'المالية', nameEn: 'Finance', key: 'FINANCE' },
            { nameAr: 'العمليات', nameEn: 'Operations', key: 'OPERATIONS' },
            { nameAr: 'التسويق', nameEn: 'Marketing', key: 'MARKETING' },
            { nameAr: 'تقنية المعلومات', nameEn: 'IT', key: 'IT' },
            { nameAr: 'الامتثال والحوكمة', nameEn: 'Compliance', key: 'COMPLIANCE' },
        ];

        for (const dept of departments) {
            await prisma.department.create({
                data: {
                    nameAr: dept.nameAr,
                    nameEn: dept.nameEn,
                    key: dept.key,
                    entityId: entity.id,
                }
            }).catch(() => null); // تجاهل لو القسم موجود
        }
        console.log(`   ✅ ${departments.length} أقسام`);

        // ═══ 8. مدير إدارة مستقل (اختياري) ═══
        if (config.dept) {
            const deptKey = config.dept.toUpperCase();
            const deptNames = { SALES: 'المبيعات', HR: 'الموارد البشرية', FINANCE: 'المالية', MARKETING: 'التسويق', OPERATIONS: 'العمليات', IT: 'تقنية المعلومات', COMPLIANCE: 'الامتثال' };
            const deptName = deptNames[deptKey] || config.dept;

            const email = config.deptManagerEmail || `${config.dept}@${config.companyCode.toLowerCase().replace(/_/g, '')}.com`;
            const name = config.deptManagerName || `مدير ${deptName}`;

            console.log(`📌 إنشاء مدير ${deptName} المستقل: ${email}`);

            let deptUser = await prisma.user.findUnique({ where: { email } });
            if (!deptUser) {
                const hashed = await bcrypt.hash(config.deptManagerPass, 10);
                deptUser = await prisma.user.create({
                    data: {
                        email,
                        password: hashed,
                        name,
                        userCategory: 'DEPT_' + deptKey,
                        isProManager: true,
                    }
                });
            }

            await prisma.member.create({
                data: {
                    userId: deptUser.id,
                    entityId: entity.id,
                    role: 'ADMIN',
                    userType: 'DEPT_MANAGER',
                    departmentRole: deptKey,
                }
            });

            console.log(`   ✅ مدير ${deptName}: ${deptUser.id}`);
            console.log('');
            console.log('┌──────────────────────────────────────────────┐');
            console.log(`│  📧 مدير ${deptName}: ${email}`);
            console.log(`│  🔑 كلمة المرور: ${config.deptManagerPass}`);
            console.log(`│  🔗 الرابط: /dept-dashboard.html?dept=${config.dept}`);
            console.log('└──────────────────────────────────────────────┘');
        }

        // ═══ ملخص نهائي ═══
        console.log('');
        console.log('╔══════════════════════════════════════════════╗');
        console.log('║              ✅ تم بنجاح!                    ║');
        console.log('╠══════════════════════════════════════════════╣');
        console.log(`║  🏢 شركة: ${config.companyNameAr}`);
        console.log(`║  🏛️  كيان: ${entity.id}`);
        console.log(`║  📋 نسخة: ${version.id}`);
        console.log(`║  📧 مالك: ${config.ownerEmail}`);
        console.log(`║  🔑 كلمة المرور: ${config.ownerPassword}`);
        console.log('╠══════════════════════════════════════════════╣');
        console.log('║  البيانات القديمة لم تُمسح ✓                ║');
        console.log('║  كل شركة معزولة بـ entityId ✓               ║');
        console.log('╚══════════════════════════════════════════════╝');
        console.log('');

    } catch (err) {
        console.error('❌ خطأ:', err.message);
        if (err.code === 'P2002') {
            console.log('   ⚠️  يوجد تعارض في بيانات فريدة (unique constraint)');
            console.log('   جرّب تغيير COMPANY_CODE أو OWNER_EMAIL');
        }
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// ═══ وضع تنظيف بيانات كيان محدد ═══
async function cleanEntityData() {
    const entityId = process.env.CLEAN_ENTITY;
    if (!entityId) return false;

    console.log('');
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║   🧹 تنظيف بيانات كيان محدد                  ║');
    console.log('╚══════════════════════════════════════════════╝');
    console.log(`   الكيان: ${entityId}`);
    console.log('');

    const entity = await prisma.entity.findUnique({ where: { id: entityId } });
    if (!entity) {
        console.log('❌ الكيان غير موجود');
        process.exit(1);
    }
    console.log(`   📍 ${entity.displayName || entity.legalName}`);

    // حذف بيانات DepartmentAnalysis (أدوات الرحلة)
    const deptDel = await prisma.departmentAnalysis.deleteMany({ where: { entityId } });
    console.log(`   🗑️  DepartmentAnalysis: ${deptDel.count} سجل`);

    // حذف DeptDeepData
    const deepDel = await prisma.deptDeepData.deleteMany({ where: { entityId } }).catch(() => ({ count: 0 }));
    console.log(`   🗑️  DeptDeepData: ${deepDel.count} سجل`);

    // حذف بيانات مرتبطة بـ StrategyVersion
    const versions = await prisma.strategyVersion.findMany({ where: { entityId }, select: { id: true } });
    const vIds = versions.map(v => v.id);

    if (vIds.length > 0) {
        // ترتيب الحذف حسب التبعيات
        const tables = [
            { name: 'StrategicAlert', model: prisma.strategicAlert },
            { name: 'CompanyAnalysis', model: prisma.companyAnalysis },
            { name: 'KPIEntry', model: prisma.kPIEntry },
            { name: 'CorrectionAction', model: prisma.correctionAction },
            { name: 'KpiDiagnosis', model: prisma.kpiDiagnosis },
            { name: 'KPI', model: prisma.kPI },
            { name: 'StrategicReview', model: prisma.strategicReview },
            { name: 'StrategicProject', model: prisma.strategicProject },
            { name: 'StrategicInitiative', model: prisma.strategicInitiative },
            { name: 'StrategicObjective', model: prisma.strategicObjective },
            { name: 'ExternalAnalysis', model: prisma.externalAnalysis },
            { name: 'StrategicDirection', model: prisma.strategicDirection },
            { name: 'StrategicRisk', model: prisma.strategicRisk },
            { name: 'StrategicChoice', model: prisma.strategicChoice },
            { name: 'Scenario', model: prisma.scenario },
        ];

        for (const t of tables) {
            try {
                const del = await t.model.deleteMany({ where: { versionId: { in: vIds } } });
                if (del.count > 0) console.log(`   🗑️  ${t.name}: ${del.count} سجل`);
            } catch (e) {
                // بعض الجداول قد لا تحتوي على versionId مباشر
            }
        }
    }

    // حذف CompanyHealthReport
    const healthDel = await prisma.companyHealthReport.deleteMany({ where: { entityId } }).catch(() => ({ count: 0 }));
    if (healthDel.count > 0) console.log(`   🗑️  CompanyHealthReport: ${healthDel.count} سجل`);

    // حذف DepartmentHealth
    const deptHealthDel = await prisma.departmentHealth.deleteMany({ where: { entityId } }).catch(() => ({ count: 0 }));
    if (deptHealthDel.count > 0) console.log(`   🗑️  DepartmentHealth: ${deptHealthDel.count} سجل`);

    console.log('');
    console.log('   ✅ تم تنظيف البيانات — الكيان والمستخدمين والأقسام باقية');
    console.log('   📌 يمكنك الآن البدء من جديد بالرحلة الاستراتيجية');
    console.log('');

    await prisma.$disconnect();
    return true;
}

// ═══ التشغيل ═══
(async () => {
    // لو فيه CLEAN_ENTITY → وضع التنظيف
    if (process.env.CLEAN_ENTITY) {
        await cleanEntityData();
    } else {
        await createNewCompany();
    }
})();
