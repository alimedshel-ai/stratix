/**
 * seed-test-dept-managers.js
 * ─────────────────────────────────────────────
 * ينشئ حسابات مدراء أقسام تجريبية لاختبار المنصة
 * الكيان: شركة ستارتكس للحلول الاستراتيجية
 *
 * تشغيل:
 *   /usr/local/bin/node scripts/seed-test-dept-managers.js
 * ─────────────────────────────────────────────
 */

const bcrypt = require('bcryptjs');
const prisma  = require('../lib/prisma');

const ENTITY_ID = 'cmncvw3mn000igp98e9dhxq4k'; // شركة ستارتكس
const PASSWORD  = 'Test1234!';

// الأقسام المطلوبة: email | name | departmentRole → deptCode
const DEPTS = [
    { email: 'test.compliance@startix.ai', name: 'مدير الامتثال (اختبار)',  departmentRole: 'COMPLIANCE' },
    { email: 'test.marketing@startix.ai',  name: 'مدير التسويق (اختبار)',   departmentRole: 'CMO'        },
    { email: 'test.operations@startix.ai', name: 'مدير العمليات (اختبار)',  departmentRole: 'COO'        },
    { email: 'test.support@startix.ai',    name: 'مدير الدعم (اختبار)',     departmentRole: 'CCO'        },
    { email: 'test.it@startix.ai',         name: 'مدير التقنية (اختبار)',   departmentRole: 'CTO'        },
    { email: 'test.governance@startix.ai', name: 'مدير الحوكمة (اختبار)',  departmentRole: 'GOVERNANCE' },
    { email: 'test.projects@startix.ai',   name: 'مدير المشاريع (اختبار)', departmentRole: 'PROJECTS'   },
    // هذه موجودة لكن نتحقق منها
    { email: 'test.hr@startix.ai',         name: 'مدير الموارد البشرية (اختبار)', departmentRole: 'CHRO' },
    { email: 'test.finance@startix.ai',    name: 'مدير المالية (اختبار)',   departmentRole: 'CFO'        },
    { email: 'test.sales@startix.ai',      name: 'مدير المبيعات (اختبار)', departmentRole: 'CSO'        },
];

async function main() {
    const pwd = await bcrypt.hash(PASSWORD, 10);
    console.log('🚀 إنشاء حسابات مدراء الأقسام التجريبية...\n');

    const results = [];

    for (const dept of DEPTS) {
        // 1. تحقق أو أنشئ المستخدم
        let user = await prisma.user.findUnique({ where: { email: dept.email } });
        if (!user) {
            user = await prisma.user.create({
                data: {
                    email: dept.email,
                    password: pwd,
                    name: dept.name,
                    systemRole: 'USER',
                    onboardingCompleted: true
                }
            });
            console.log(`✅ أُنشئ: ${dept.email}`);
        } else {
            console.log(`⏭️  موجود: ${dept.email}`);
        }

        // 2. تحقق أو أنشئ العضوية
        const existing = await prisma.member.findFirst({
            where: { userId: user.id, entityId: ENTITY_ID }
        });

        if (!existing) {
            await prisma.member.create({
                data: {
                    userId:         user.id,
                    entityId:       ENTITY_ID,
                    role:           'EDITOR',
                    userType:       'DEPT_MANAGER',
                    departmentRole: dept.departmentRole
                }
            });
            console.log(`   🔗 ربط بـ ${dept.departmentRole}`);
        } else if (existing.departmentRole !== dept.departmentRole) {
            await prisma.member.update({
                where: { id: existing.id },
                data: { userType: 'DEPT_MANAGER', departmentRole: dept.departmentRole }
            });
            console.log(`   🔄 تحديث departmentRole → ${dept.departmentRole}`);
        }

        results.push({ ...dept, userId: user.id });
    }

    console.log('\n' + '─'.repeat(65));
    console.log('📋 حسابات الاختبار الجاهزة (كلمة المرور: ' + PASSWORD + ')');
    console.log('─'.repeat(65));
    results.forEach(r => {
        const code = {
            COMPLIANCE: 'compliance', CMO: 'marketing', COO: 'operations',
            CCO: 'cs', CTO: 'it', GOVERNANCE: 'governance', PROJECTS: 'projects',
            CHRO: 'hr', CFO: 'finance', CSO: 'sales'
        }[r.departmentRole] || r.departmentRole.toLowerCase();
        console.log(`${r.email.padEnd(35)} dept=${code}`);
    });
    console.log('─'.repeat(65));
    console.log(`\n🔑 كلمة المرور لكل الحسابات: ${PASSWORD}`);
    console.log('🌐 رابط الدخول: http://localhost:3000/login.html\n');

    await prisma.$disconnect();
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
