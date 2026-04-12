const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const result = await prisma.member.findFirst({
        where: { user: { email: 'logistics-ultimate-victory@stratix.com' } },
        select: {
            user: { select: { email: true } },
            role: true,
            userType: true,
            departmentRole: true
        }
    });
    console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
