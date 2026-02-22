const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const counts = {};
    counts.users = await prisma.user.count();
    counts.sectors = await prisma.sector.count();
    counts.industries = await prisma.industry.count();
    counts.entityTypes = await prisma.entityType.count();
    counts.companies = await prisma.company.count();
    counts.entities = await prisma.entity.count();
    counts.members = await prisma.member.count();
    counts.strategyVersions = await prisma.strategyVersion.count();
    counts.strategicDirections = await prisma.strategicDirection.count();
    counts.externalAnalyses = await prisma.externalAnalysis.count();
    counts.objectives = await prisma.strategicObjective.count();
    counts.kpis = await prisma.kPI.count();
    counts.kpiEntries = await prisma.kPIEntry.count();
    counts.initiatives = await prisma.strategicInitiative.count();
    counts.reviews = await prisma.strategicReview.count();
    counts.assessments = await prisma.assessment.count();
    counts.dimensions = await prisma.dimension.count();
    counts.criteria = await prisma.criterion.count();
    counts.choices = await prisma.strategicChoice.count();
    counts.risks = await prisma.strategicRisk.count();
    counts.kpiDiagnoses = await prisma.kpiDiagnosis.count();
    counts.correctionActions = await prisma.correctionAction.count();
    counts.analysisPoints = await prisma.analysisPoint.count();
    counts.causalLinks = await prisma.causalLink.count();
    counts.towsStrategies = await prisma.tOWSStrategy.count();
    counts.financialDecisions = await prisma.financialDecision.count();
    counts.integrations = await prisma.integration.count();
    counts.alerts = await prisma.strategicAlert.count();
    counts.auditLogs = await prisma.auditLog.count();
    counts.toolDefinitions = await prisma.toolDefinition.count();
    counts.companyAnalyses = await prisma.companyAnalysis.count();
    counts.pathSessions = await prisma.pathSession.count();
    counts.scenarios = await prisma.scenario.count();

    console.log('=== Database Record Counts ===');
    console.log(JSON.stringify(counts, null, 2));

    // Check admin user
    const admin = await prisma.user.findUnique({
        where: { email: 'admin@stratix.com' }
    });
    console.log('\nAdmin systemRole:', admin?.systemRole || 'NOT FOUND');

    // List all users with roles
    const users = await prisma.user.findMany({
        select: { email: true, systemRole: true },
    });
    console.log('\n=== All Users ===');
    users.forEach(u => console.log(`  ${u.email} → ${u.systemRole}`));

    await prisma.$disconnect();
}

check().catch(e => {
    console.error(e);
    process.exit(1);
});
