const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seed() {
  try {
    console.log('🌱 Seeding database with complete hierarchy...');

    // Create Sector
    const sector = await prisma.sector.create({
      data: {
        name: 'Private Sector',
        nameAr: 'القطاع الخاص',
        code: 'PVT_SECTOR',
      },
    });
    console.log('✅ Created Sector:', sector.name);

    // Create Industries
    const industryTech = await prisma.industry.create({
      data: {
        name: 'Technology',
        nameAr: 'تكنولوجيا',
        code: 'TECH_IND',
        description: 'Information Technology and Software Development',
        sectorId: sector.id,
      },
    });
    console.log('✅ Created Industry:', industryTech.name);

    const industryMfg = await prisma.industry.create({
      data: {
        name: 'Manufacturing',
        nameAr: 'التصنيع',
        code: 'MFG_IND',
        description: 'Industrial Manufacturing and Production',
        sectorId: sector.id,
      },
    });
    console.log('✅ Created Industry:', industryMfg.name);

    // Create Entities
    const entityTech = await prisma.entity.create({
      data: {
        name: 'Future Solutions',
        nameAr: 'حلول المستقبل',
        code: 'FUTURE001',
        type: 'ORGANIZATION',
        description: 'Software development and consulting company',
        industryId: industryTech.id,
      },
    });
    console.log('✅ Created Entity:', entityTech.name);

    const entityMfg = await prisma.entity.create({
      data: {
        name: 'Horizon Factory',
        nameAr: 'مصنع الأفق',
        code: 'HORIZON001',
        type: 'ORGANIZATION',
        description: 'Advanced manufacturing facility',
        industryId: industryMfg.id,
      },
    });
    console.log('✅ Created Entity:', entityMfg.name);

    // Create Strategic Version
    const stratVersion = await prisma.strategicVersion.create({
      data: {
        name: '2026 Strategic Plan',
        description: 'Annual strategic initiative for 2026',
        versionNumber: 1,
        entityId: entityTech.id,
        isActive: true,
      },
    });
    console.log('✅ Created Strategic Version:', stratVersion.name);

    // Create SWOT Analysis
    const swotItems = [
      { type: 'SWOT', category: 'STRENGTH', title: 'Strong team expertise', description: 'Highly skilled technical team' },
      { type: 'SWOT', category: 'WEAKNESS', title: 'Limited resources', description: 'Budget constraints' },
      { type: 'SWOT', category: 'OPPORTUNITY', title: 'Cloud market growth', description: 'Growing demand for cloud solutions' },
      { type: 'SWOT', category: 'THREAT', title: 'Market competition', description: 'Increasing competition from larger firms' },
    ];

    for (const item of swotItems) {
      await prisma.strategicAnalysis.create({
        data: {
          ...item,
          versionId: stratVersion.id,
        },
      });
    }
    console.log('✅ Created SWOT Analysis (4 points)');

    // Create Objectives
    const obj1 = await prisma.strategicObjective.create({
      data: {
        title: 'Increase market share by 25%',
        description: 'Expand our customer base and market presence',
        status: 'IN_PROGRESS',
        versionId: stratVersion.id,
      },
    });

    const obj2 = await prisma.strategicObjective.create({
      data: {
        title: 'Improve product quality',
        description: 'Reduce bugs and improve customer satisfaction',
        status: 'IN_PROGRESS',
        versionId: stratVersion.id,
      },
    });
    console.log('✅ Created Strategic Objectives (2)');

    // Create KPIs
    await prisma.kPI.create({
      data: {
        name: 'Revenue Growth',
        nameAr: 'نمو الإيرادات',
        description: 'Quarterly revenue increase',
        target: 1000000,
        actual: 750000,
        unit: '$',
        status: 'AT_RISK',
        versionId: stratVersion.id,
        objectiveId: obj1.id,
      },
    });

    await prisma.kPI.create({
      data: {
        name: 'Customer Satisfaction',
        nameAr: 'رضا العملاء',
        description: 'Customer satisfaction score',
        target: 90,
        actual: 85,
        unit: '%',
        status: 'ON_TRACK',
        versionId: stratVersion.id,
        objectiveId: obj2.id,
      },
    });

    await prisma.kPI.create({
      data: {
        name: 'Bug Resolution Rate',
        nameAr: 'معدل حل الأخطاء',
        target: 95,
        actual: 92,
        unit: '%',
        status: 'ON_TRACK',
        versionId: stratVersion.id,
        objectiveId: obj2.id,
      },
    });
    console.log('✅ Created KPIs (3)');

    // Create Initiatives
    await prisma.strategicInitiative.create({
      data: {
        title: 'Cloud Migration Project',
        description: 'Migrate existing systems to cloud infrastructure',
        status: 'IN_PROGRESS',
        owner: 'Ali Ahmed',
        versionId: stratVersion.id,
      },
    });

    await prisma.strategicInitiative.create({
      data: {
        title: 'AI Integration Initiative',
        description: 'Integrate AI capabilities into our products',
        status: 'PLANNED',
        owner: 'Sara Mohammad',
        versionId: stratVersion.id,
      },
    });
    console.log('✅ Created Strategic Initiatives (2)');

    // Create Reviews
    await prisma.strategicReview.create({
      data: {
        title: 'Q1 2026 Review',
        reviewDate: new Date('2026-03-31'),
        status: 'COMPLETED',
        notes: 'Good progress on most initiatives',
        versionId: stratVersion.id,
      },
    });
    console.log('✅ Created Strategic Reviews');

    // Create Assessment
    const assessment = await prisma.assessment.create({
      data: {
        title: 'Engineering Capability Assessment',
        description: 'Assessment of current engineering capabilities',
        status: 'IN_PROGRESS',
        entityId: entityTech.id,
      },
    });

    const dimension = await prisma.dimension.create({
      data: {
        name: 'Technical Skills',
        assessmentId: assessment.id,
      },
    });

    await prisma.criterion.create({
      data: {
        name: 'Coding Standards',
        score: 85,
        maxScore: 100,
        dimensionId: dimension.id,
      },
    });
    console.log('✅ Created Assessments');

    // Create Users
    const adminPassword = await bcrypt.hash('Admin123!', 10);
    const userPassword = await bcrypt.hash('User123!', 10);

    await prisma.user.create({
      data: {
        email: 'ceo@future.com',
        password: adminPassword,
        name: 'محمد العتيبي (CEO)',
        role: 'ENTITY_ADMIN',
        entityId: entityTech.id,
      },
    });

    await prisma.user.create({
      data: {
        email: 'strategy@future.com',
        password: userPassword,
        name: 'سارة أحمد (Strategy Manager)',
        role: 'STRATEGY_MANAGER',
        entityId: entityTech.id,
      },
    });

    await prisma.user.create({
      data: {
        email: 'admin@stratix.com',
        password: adminPassword,
        name: 'مدير النظام',
        role: 'SUPER_ADMIN',
        entityId: entityTech.id,
      },
    });

    await prisma.user.create({
      data: {
        email: 'user@stratix.com',
        password: userPassword,
        name: 'مستخدم عادي',
        role: 'VIEWER',
        entityId: entityTech.id,
      },
    });
    console.log('✅ Created Users');

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📊 Data Hierarchy:');
    console.log('  Platform');
    console.log('    └─ Sector: Private Sector');
    console.log('        ├─ Industry: Technology');
    console.log('        │   └─ Entity: Future Solutions');
    console.log('        │       ├─ Users (CEO, Strategy Manager, Admin, User)');
    console.log('        │       └─ Strategic Version with SWOT, Objectives, KPIs, Initiatives, Reviews');
    console.log('        └─ Industry: Manufacturing');
    console.log('            └─ Entity: Horizon Factory');
    console.log('\n📋 Demo Credentials:');
    console.log('   Admin: admin@stratix.com / Admin123!');
    console.log('   User: user@stratix.com / User123!');
    console.log('   CEO: ceo@future.com / Admin123!');
    console.log('   Strategy: strategy@future.com / User123!');
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
