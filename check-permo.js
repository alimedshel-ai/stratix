const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUserPerms() {
    try {
        const user = await prisma.user.findFirst({
            where: { email: { contains: 'hr' } }, // HR manager uses hr@...
            include: {
                memberships: {
                    include: {
                        entity: {
                            include: {
                                strategyVersions: {
                                    where: { isActive: true },
                                    include: {
                                        kpis: { take: 5 }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!user) {
            console.log("No user found with 'hr' in email");
            return;
        }

        console.log("=== User Found ===");
        console.log(`ID: ${user.id}, Email: ${user.email}, SystemRole: ${user.systemRole}`);

        user.memberships.forEach(m => {
            console.log(`\nMembership ID: ${m.id}`);
            console.log(`Role: ${m.role}, UserType: ${m.userType}, Entity: ${m.entity.displayName} (${m.entity.id})`);

            if (m.entity.strategyVersions.length > 0) {
                const sv = m.entity.strategyVersions[0];
                console.log(`Active Strategy Version: ${sv.id}`);
                console.log(`KPIs (${sv.kpis.length} found):`);
                sv.kpis.forEach(k => {
                    console.log(` - KPI: ${k.name} (id: ${k.id})`);
                });
            } else {
                console.log("No Active Strategy Version found for this entity.");
            }
        });

    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

checkUserPerms();
