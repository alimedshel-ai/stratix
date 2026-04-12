/**
 * seed-departments.js
 * ينشئ أقسام الشركة ويربط كل مدير بقسمه
 */
const prisma = require('../lib/prisma');

const ENTITY_ID = 'cmncvw3mn000igp98e9dhxq4k';

const DEPARTMENTS = [
    { code: 'FINANCE',    name: 'المالية',             icon: 'bi-cash-coin',        color: '#f59e0b' },
    { code: 'HR',         name: 'الموارد البشرية',     icon: 'bi-people',           color: '#3b82f6' },
    { code: 'MARKETING',  name: 'التسويق',             icon: 'bi-megaphone',        color: '#8b5cf6' },
    { code: 'OPERATIONS', name: 'العمليات',            icon: 'bi-gear',             color: '#6366f1' },
    { code: 'SALES',      name: 'المبيعات',            icon: 'bi-graph-up-arrow',   color: '#10b981' },
    { code: 'CS',         name: 'خدمة العملاء',        icon: 'bi-headset',          color: '#ec4899' },
    { code: 'IT',         name: 'تقنية المعلومات',     icon: 'bi-pc-display',       color: '#0ea5e9' },
    { code: 'COMPLIANCE', name: 'الامتثال والالتزام',  icon: 'bi-shield-check',     color: '#6366f1' },
    { code: 'GOVERNANCE', name: 'الحوكمة',             icon: 'bi-bank',             color: '#7c3aed' },
    { code: 'PROJECTS',   name: 'إدارة المشاريع',      icon: 'bi-kanban',           color: '#0891b2' },
];

// ربط departmentRole → code
const ROLE_TO_CODE = {
    CFO: 'FINANCE', CHRO: 'HR', CMO: 'MARKETING', COO: 'OPERATIONS',
    CSO: 'SALES',   CCO: 'CS',  CTO: 'IT',
    COMPLIANCE: 'COMPLIANCE', GOVERNANCE: 'GOVERNANCE', PROJECTS: 'PROJECTS'
};

async function main() {
    console.log('🏗️  إنشاء أقسام الشركة...\n');

    const deptMap = {}; // code → department.id

    for (const dept of DEPARTMENTS) {
        const existing = await prisma.department.findFirst({
            where: { entityId: ENTITY_ID, code: dept.code }
        });

        if (existing) {
            deptMap[dept.code] = existing.id;
            console.log(`⏭️  موجود: ${dept.name} (${dept.code})`);
        } else {
            const created = await prisma.department.create({
                data: { entityId: ENTITY_ID, ...dept }
            });
            deptMap[dept.code] = created.id;
            console.log(`✅ أُنشئ: ${dept.name} (${dept.code})`);
        }
    }

    console.log('\n🔗 ربط المدراء بأقسامهم...\n');

    const members = await prisma.member.findMany({
        where: { entityId: ENTITY_ID, userType: 'DEPT_MANAGER' },
        include: { user: { select: { email: true, name: true } } }
    });

    for (const m of members) {
        const deptCode = ROLE_TO_CODE[m.departmentRole] || m.departmentRole;
        const deptId   = deptMap[deptCode];

        if (!deptId) {
            console.log(`⚠️  لا يوجد قسم لـ ${m.departmentRole} (${m.user.email})`);
            continue;
        }

        await prisma.member.update({
            where: { id: m.id },
            data:  { departmentId: deptId }
        });
        console.log(`   ✅ ${m.user.email} → ${deptCode}`);
    }

    console.log('\n─────────────────────────────────────────────────');
    console.log('✅ تم الربط. افتح team.html لترى الأقسام والمدراء.');
    console.log('─────────────────────────────────────────────────\n');

    await prisma.$disconnect();
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
