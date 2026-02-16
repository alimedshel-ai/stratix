const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seed() {
  try {
    console.log('🌱 Starting database seed...');

    // Clear existing data
    console.log('🗑️  Cleaning existing data...');
    await prisma.auditLog.deleteMany();
    await prisma.criterion.deleteMany();
    await prisma.dimension.deleteMany();
    await prisma.assessment.deleteMany();
    await prisma.kPI.deleteMany();
    await prisma.strategicReview.deleteMany();
    await prisma.strategicInitiative.deleteMany();
    await prisma.strategicObjective.deleteMany();
    await prisma.strategyVersion.deleteMany();
    await prisma.member.deleteMany();
    await prisma.entity.deleteMany();
    await prisma.user.deleteMany();
    await prisma.entityType.deleteMany();
    await prisma.industry.deleteMany();
    await prisma.sector.deleteMany();

    // 1. Create Reference Tables (Sectors)
    console.log('📊 Creating Sectors...');
    const sectorGov = await prisma.sector.create({
      data: {
        nameAr: 'القطاع الحكومي',
        nameEn: 'Government Sector',
        code: 'GOV',
      },
    });

    const sectorPrivate = await prisma.sector.create({
      data: {
        nameAr: 'القطاع الخاص',
        nameEn: 'Private Sector',
        code: 'PVT',
      },
    });

    const sectorNonProfit = await prisma.sector.create({
      data: {
        nameAr: 'القطاع غير الربحي',
        nameEn: 'Non-Profit Sector',
        code: 'NPO',
      },
    });

    console.log('✅ Created 3 Sectors');

    // 2. Create Industries
    console.log('🏭 Creating Industries...');
    const industryHealth = await prisma.industry.create({
      data: {
        nameAr: 'الصحة',
        nameEn: 'Healthcare',
        code: 'HEALTH',
      },
    });

    const industryEducation = await prisma.industry.create({
      data: {
        nameAr: 'التعليم',
        nameEn: 'Education',
        code: 'EDU',
      },
    });

    const industryTech = await prisma.industry.create({
      data: {
        nameAr: 'التقنية',
        nameEn: 'Technology',
        code: 'TECH',
      },
    });

    console.log('✅ Created 3 Industries');

    // 3. Create Entity Types
    console.log('🏢 Creating Entity Types...');
    const typeMinistry = await prisma.entityType.create({
      data: {
        nameAr: 'وزارة',
        nameEn: 'Ministry',
        code: 'MIN',
      },
    });

    const typeHospital = await prisma.entityType.create({
      data: {
        nameAr: 'مستشفى',
        nameEn: 'Hospital',
        code: 'HOSP',
      },
    });

    const typeCompany = await prisma.entityType.create({
      data: {
        nameAr: 'شركة',
        nameEn: 'Company',
        code: 'COMP',
      },
    });

    console.log('✅ Created 3 Entity Types');

    // 4. Create Users
    console.log('👥 Creating Users...');
    const hashedPassword1 = await bcrypt.hash('Admin123!', 10);
    const hashedPassword2 = await bcrypt.hash('User123!', 10);

    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@stratix.com',
        password: hashedPassword1,
        name: 'مدير النظام',
      },
    });

    const managerUser = await prisma.user.create({
      data: {
        email: 'manager@stratix.com',
        password: hashedPassword2,
        name: 'مدير الاستراتيجية',
      },
    });

    const editorUser = await prisma.user.create({
      data: {
        email: 'editor@stratix.com',
        password: hashedPassword2,
        name: 'محرر المحتوى',
      },
    });

    const viewerUser = await prisma.user.create({
      data: {
        email: 'viewer@stratix.com',
        password: hashedPassword2,
        name: 'مستخدم عادي',
      },
    });

    console.log('✅ Created 4 Users');

    // 5. Create Entities
    console.log('🏛️  Creating Entities...');
    const entity1 = await prisma.entity.create({
      data: {
        legalName: 'وزارة الصحة',
        displayName: 'الصحة',
        sectorId: sectorGov.id,
        industryId: industryHealth.id,
        typeId: typeMinistry.id,
      },
    });

    const entity2 = await prisma.entity.create({
      data: {
        legalName: 'مستشفى الملك فيصل التخصصي',
        displayName: 'التخصصي',
        sectorId: sectorGov.id,
        industryId: industryHealth.id,
        typeId: typeHospital.id,
      },
    });

    console.log('✅ Created 2 Entities');

    // 6. Create Members (User-Entity relationships with roles)
    console.log('🔗 Creating Member relationships...');
    await prisma.member.create({
      data: {
        userId: adminUser.id,
        entityId: entity1.id,
        role: 'OWNER',
      },
    });

    await prisma.member.create({
      data: {
        userId: managerUser.id,
        entityId: entity1.id,
        role: 'ADMIN',
      },
    });

    await prisma.member.create({
      data: {
        userId: editorUser.id,
        entityId: entity2.id,
        role: 'EDITOR',
      },
    });

    await prisma.member.create({
      data: {
        userId: viewerUser.id,
        entityId: entity2.id,
        role: 'VIEWER',
      },
    });

    console.log('✅ Created 4 Member relationships');

    // 7. Create Strategy Version
    console.log('📋 Creating Strategy Versions...');
    const strategy1 = await prisma.strategyVersion.create({
      data: {
        entityId: entity1.id,
        versionNumber: 1,
        status: 'ACTIVE',
        activatedAt: new Date(),
      },
    });

    console.log('✅ Created Strategy Version');

    // 8. Create Strategic Objectives
    console.log('🎯 Creating Strategic Objectives...');
    const objective1 = await prisma.strategicObjective.create({
      data: {
        versionId: strategy1.id,
        title: 'تحسين جودة الخدمات الصحية',
        description: 'رفع مستوى جودة الرعاية الصحية المقدمة للمواطنين',
        status: 'ACTIVE',
      },
    });

    const objective2 = await prisma.strategicObjective.create({
      data: {
        versionId: strategy1.id,
        title: 'زيادة كفاءة العمليات',
        description: 'تحسين كفاءة العمليات التشغيلية بنسبة 20%',
        status: 'ACTIVE',
      },
    });

    console.log('✅ Created 2 Strategic Objectives');

    // 9. Create KPIs
    console.log('📊 Creating KPIs...');
    await prisma.kPI.create({
      data: {
        versionId: strategy1.id,
        objectiveId: objective1.id,
        name: 'Patient Satisfaction Rate',
        nameAr: 'معدل رضا المرضى',
        description: 'نسبة رضا المرضى عن الخدمات المقدمة',
        target: 90,
        actual: 85,
        unit: '%',
        status: 'ON_TRACK',
      },
    });

    await prisma.kPI.create({
      data: {
        versionId: strategy1.id,
        objectiveId: objective1.id,
        name: 'Average Wait Time',
        nameAr: 'متوسط وقت الانتظار',
        description: 'متوسط وقت انتظار المريض',
        target: 30,
        actual: 35,
        unit: 'دقيقة',
        status: 'AT_RISK',
      },
    });

    await prisma.kPI.create({
      data: {
        versionId: strategy1.id,
        objectiveId: objective2.id,
        name: 'Operational Efficiency',
        nameAr: 'كفاءة العمليات',
        description: 'نسبة تحسين كفاءة العمليات',
        target: 20,
        actual: 18,
        unit: '%',
        status: 'ON_TRACK',
      },
    });

    console.log('✅ Created 3 KPIs');

    // 10. Create Assessment
    console.log('📝 Creating Assessments...');
    const assessment1 = await prisma.assessment.create({
      data: {
        entityId: entity1.id,
        title: 'تقييم الأداء الربع سنوي',
        description: 'تقييم شامل للأداء المؤسسي',
        status: 'IN_PROGRESS',
      },
    });

    console.log('✅ Created Assessment');

    // 11. Create Dimensions
    console.log('📐 Creating Dimensions...');
    const dimension1 = await prisma.dimension.create({
      data: {
        assessmentId: assessment1.id,
        name: 'الجودة',
        description: 'بُعد الجودة في الخدمات',
      },
    });

    const dimension2 = await prisma.dimension.create({
      data: {
        assessmentId: assessment1.id,
        name: 'الكفاءة',
        description: 'بُعد كفاءة العمليات',
      },
    });

    console.log('✅ Created 2 Dimensions');

    // 12. Create Criteria
    console.log('✅ Creating Criteria...');
    await prisma.criterion.create({
      data: {
        dimensionId: dimension1.id,
        name: 'رضا العملاء',
        description: 'مدى رضا العملاء عن الخدمات',
        score: 4.2,
      },
    });

    await prisma.criterion.create({
      data: {
        dimensionId: dimension2.id,
        name: 'سرعة الإنجاز',
        description: 'سرعة إنجاز المعاملات',
        score: 3.8,
      },
    });

    console.log('✅ Created 2 Criteria');

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📌 Login credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin (OWNER):');
    console.log('  Email: admin@stratix.com');
    console.log('  Password: Admin123!');
    console.log('\nManager (ADMIN):');
    console.log('  Email: manager@stratix.com');
    console.log('  Password: User123!');
    console.log('\nEditor (EDITOR):');
    console.log('  Email: editor@stratix.com');
    console.log('  Password: User123!');
    console.log('\nViewer (VIEWER):');
    console.log('  Email: viewer@stratix.com');
    console.log('  Password: User123!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
