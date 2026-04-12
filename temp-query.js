const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = 'hrtest9@test.com';
    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            memberships: {
                include: {
                    entity: true
                }
            }
        }
    });

    if (!user) {
        console.log('User not found');
        return;
    }

    console.log('User:', user.email, 'Role:', user.systemRole, 'UserCategory:', user.userCategory);
    console.log('Memberships:');
    user.memberships.forEach(m => {
        console.log(`- Entity: ${m.entity.legalName || m.entity.displayName}, Role: ${m.role}, UserType: ${m.userType}, DeptRole: ${m.departmentRole}`);
    });
}

main().finally(() => prisma.$disconnect());
