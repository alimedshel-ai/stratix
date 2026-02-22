const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seed() {
  try {
    console.log('🌱 Starting database seed (v2.0 — Phase 1)...');

    // Clear existing data (in reverse dependency order)
    console.log('🗑️  Cleaning existing data...');
    await prisma.StrategicAlert.deleteMany();
    await prisma.CompanyAnalysis.deleteMany();
    await prisma.KPIEntry.deleteMany();
    await prisma.CorrectionAction.deleteMany();
    await prisma.KpiDiagnosis.deleteMany();
    await prisma.AnalysisPoint.deleteMany();
    await prisma.Criterion.deleteMany();
    await prisma.Dimension.deleteMany();
    await prisma.Assessment.deleteMany();
    await prisma.StrategicRisk.deleteMany();
    await prisma.StrategicChoice.deleteMany();
    await prisma.Scenario.deleteMany();
    await prisma.KPI.deleteMany();
    await prisma.StrategicReview.deleteMany();
    await prisma.StrategicInitiative.deleteMany();
    await prisma.StrategicObjective.deleteMany();
    await prisma.ExternalAnalysis.deleteMany();
    await prisma.StrategicDirection.deleteMany();
    await prisma.StrategyVersion.deleteMany();
    await prisma.AuditLog.deleteMany();
    await prisma.Member.deleteMany();
    await prisma.Entity.deleteMany();
    await prisma.User.deleteMany();
    await prisma.EntityType.deleteMany();
    await prisma.Industry.deleteMany();
    await prisma.Sector.deleteMany();

    // =========================================
    // 1. REFERENCE TABLES
    // =========================================
    console.log('📊 Creating Sectors...');
    const sectorGov = await prisma.sector.create({
      data: { nameAr: 'القطاع الحكومي', nameEn: 'Government Sector', code: 'GOV' },
    });
    const sectorPrivate = await prisma.sector.create({
      data: { nameAr: 'القطاع الخاص', nameEn: 'Private Sector', code: 'PVT' },
    });
    const sectorNonProfit = await prisma.sector.create({
      data: { nameAr: 'القطاع غير الربحي', nameEn: 'Non-Profit Sector', code: 'NPO' },
    });
    console.log('✅ Created 3 Sectors');

    console.log('🏭 Creating Industries...');
    const industryHealth = await prisma.industry.create({
      data: { nameAr: 'الصحة', nameEn: 'Healthcare', code: 'HEALTH' },
    });
    const industryEducation = await prisma.industry.create({
      data: { nameAr: 'التعليم', nameEn: 'Education', code: 'EDU' },
    });
    const industryTech = await prisma.industry.create({
      data: { nameAr: 'التقنية', nameEn: 'Technology', code: 'TECH' },
    });
    console.log('✅ Created 3 Industries');

    console.log('🏢 Creating Entity Types...');
    const typeMinistry = await prisma.entityType.create({
      data: { nameAr: 'وزارة', nameEn: 'Ministry', code: 'MIN' },
    });
    const typeHospital = await prisma.entityType.create({
      data: { nameAr: 'مستشفى', nameEn: 'Hospital', code: 'HOSP' },
    });
    const typeCompany = await prisma.entityType.create({
      data: { nameAr: 'شركة', nameEn: 'Company', code: 'COMP' },
    });
    console.log('✅ Created 3 Entity Types');

    // =========================================
    // 2. USERS
    // =========================================
    console.log('👥 Creating Users...');
    const hashedPassword1 = await bcrypt.hash('Admin123!', 10);
    const hashedPassword2 = await bcrypt.hash('User123!', 10);

    const adminUser = await prisma.user.create({
      data: { email: 'admin@stratix.com', password: hashedPassword1, name: 'مدير النظام' },
    });
    const managerUser = await prisma.user.create({
      data: { email: 'manager@stratix.com', password: hashedPassword2, name: 'مدير الاستراتيجية' },
    });
    const editorUser = await prisma.user.create({
      data: { email: 'editor@stratix.com', password: hashedPassword2, name: 'محرر المحتوى' },
    });
    const viewerUser = await prisma.user.create({
      data: { email: 'viewer@stratix.com', password: hashedPassword2, name: 'مستخدم عادي' },
    });
    console.log('✅ Created 4 Users');

    // =========================================
    // 3. ENTITIES (Enhanced with new fields)
    // =========================================
    console.log('🏛️  Creating Entities...');
    const entity1 = await prisma.entity.create({
      data: {
        legalName: 'وزارة الصحة',
        displayName: 'الصحة',
        sectorId: sectorGov.id,
        industryId: industryHealth.id,
        typeId: typeMinistry.id,
        size: 'ENTERPRISE',          // ✨ جديد
        school: 'BALANCED_SCORECARD', // ✨ جديد
      },
    });

    const entity2 = await prisma.entity.create({
      data: {
        legalName: 'مستشفى الملك فيصل التخصصي',
        displayName: 'التخصصي',
        sectorId: sectorGov.id,
        industryId: industryHealth.id,
        typeId: typeHospital.id,
        size: 'LARGE',
        school: 'OKR',
      },
    });
    console.log('✅ Created 2 Entities');

    // =========================================
    // 4. MEMBERS
    // =========================================
    console.log('🔗 Creating Member relationships...');
    await prisma.member.create({ data: { userId: adminUser.id, entityId: entity1.id, role: 'OWNER' } });
    await prisma.member.create({ data: { userId: managerUser.id, entityId: entity1.id, role: 'ADMIN' } });
    await prisma.member.create({ data: { userId: editorUser.id, entityId: entity2.id, role: 'EDITOR' } });
    await prisma.member.create({ data: { userId: viewerUser.id, entityId: entity2.id, role: 'VIEWER' } });
    console.log('✅ Created 4 Members');

    // =========================================
    // 5. STRATEGY VERSION (Enhanced with new fields)
    // =========================================
    console.log('📋 Creating Strategy Versions...');
    const strategy1 = await prisma.strategyVersion.create({
      data: {
        entityId: entity1.id,
        versionNumber: 1,
        status: 'ACTIVE',
        name: 'الخطة الاستراتيجية 2024-2028',        // ✨ جديد
        description: 'الخطة الخمسية لتطوير القطاع الصحي', // ✨ جديد
        isActive: true,                                    // ✨ جديد
        createdBy: adminUser.id,                            // ✨ جديد
        approvedBy: adminUser.id,                           // ✨ جديد
        approvedAt: new Date(),                             // ✨ جديد
        activatedAt: new Date(),
      },
    });
    console.log('✅ Created Strategy Version');

    // =========================================
    // 6. STRATEGIC DIRECTIONS (NEW ✨)
    // =========================================
    console.log('🧭 Creating Strategic Directions...');
    await prisma.strategicDirection.create({
      data: {
        versionId: strategy1.id,
        type: 'VISION',
        content: 'نظام صحي سعودي شامل وفعّال ومستدام، يرتكز على صحة الفرد',
        order: 1,
      },
    });
    await prisma.strategicDirection.create({
      data: {
        versionId: strategy1.id,
        type: 'MISSION',
        content: 'تقديم خدمات صحية متكاملة وعالية الجودة للمواطنين والمقيمين بكفاءة وعدالة',
        order: 1,
      },
    });
    await prisma.strategicDirection.create({
      data: {
        versionId: strategy1.id,
        type: 'VALUES',
        content: 'الشفافية',
        order: 1,
      },
    });
    await prisma.strategicDirection.create({
      data: {
        versionId: strategy1.id,
        type: 'VALUES',
        content: 'الابتكار',
        order: 2,
      },
    });
    await prisma.strategicDirection.create({
      data: {
        versionId: strategy1.id,
        type: 'VALUES',
        content: 'التميز',
        order: 3,
      },
    });
    await prisma.strategicDirection.create({
      data: {
        versionId: strategy1.id,
        type: 'ISSUES',
        content: 'ارتفاع تكاليف الرعاية الصحية وتزايد الطلب على الخدمات',
        order: 1,
      },
    });
    console.log('✅ Created 6 Strategic Directions (Vision + Mission + 3 Values + 1 Issue)');

    // =========================================
    // 7. EXTERNAL ANALYSIS — PESTEL (NEW ✨)
    // =========================================
    console.log('🌍 Creating External Analysis (PESTEL)...');
    await prisma.externalAnalysis.create({
      data: {
        versionId: strategy1.id,
        type: 'POLITICAL',
        factor: 'رؤية 2030 — تحول القطاع الصحي',
        impact: 'HIGH',
        probability: 0.95,
        trend: 'INCREASING',
        notes: 'دعم حكومي قوي لتطوير القطاع الصحي ضمن رؤية المملكة 2030',
      },
    });
    await prisma.externalAnalysis.create({
      data: {
        versionId: strategy1.id,
        type: 'ECONOMIC',
        factor: 'ارتفاع تكاليف المعدات الطبية',
        impact: 'MEDIUM',
        probability: 0.7,
        trend: 'INCREASING',
      },
    });
    await prisma.externalAnalysis.create({
      data: {
        versionId: strategy1.id,
        type: 'SOCIAL',
        factor: 'زيادة الوعي الصحي لدى المجتمع',
        impact: 'HIGH',
        probability: 0.8,
        trend: 'INCREASING',
      },
    });
    await prisma.externalAnalysis.create({
      data: {
        versionId: strategy1.id,
        type: 'TECHNOLOGICAL',
        factor: 'التحول الرقمي في الخدمات الصحية',
        impact: 'HIGH',
        probability: 0.9,
        trend: 'INCREASING',
      },
    });
    console.log('✅ Created 4 PESTEL Analysis Points');

    // =========================================
    // 8. STRATEGIC OBJECTIVES (Enhanced with BSC)
    // =========================================
    console.log('🎯 Creating Strategic Objectives...');
    const objective1 = await prisma.strategicObjective.create({
      data: {
        versionId: strategy1.id,
        title: 'تحسين جودة الخدمات الصحية',
        description: 'رفع مستوى جودة الرعاية الصحية المقدمة للمواطنين',
        status: 'ACTIVE',
        perspective: 'CUSTOMER',      // ✨ جديد — BSC
        weight: 0.3,                   // ✨ جديد
        targetValue: 95,               // ✨ جديد
        baselineValue: 80,             // ✨ جديد
        ownerId: managerUser.id,       // ✨ جديد
      },
    });

    const objective2 = await prisma.strategicObjective.create({
      data: {
        versionId: strategy1.id,
        title: 'زيادة كفاءة العمليات',
        description: 'تحسين كفاءة العمليات التشغيلية بنسبة 20%',
        status: 'ACTIVE',
        perspective: 'INTERNAL_PROCESS',
        weight: 0.25,
        targetValue: 120,
        baselineValue: 100,
      },
    });

    const objective3 = await prisma.strategicObjective.create({
      data: {
        versionId: strategy1.id,
        title: 'تطوير الكوادر البشرية',
        description: 'بناء قدرات الموارد البشرية وتأهيلها',
        status: 'ACTIVE',
        perspective: 'LEARNING_GROWTH',
        weight: 0.2,
        parentId: null,
      },
    });

    const objective4 = await prisma.strategicObjective.create({
      data: {
        versionId: strategy1.id,
        title: 'تحقيق الاستدامة المالية',
        description: 'تحسين إدارة الموارد المالية وتحقيق الكفاءة',
        status: 'ACTIVE',
        perspective: 'FINANCIAL',
        weight: 0.25,
      },
    });
    console.log('✅ Created 4 Strategic Objectives (BSC Perspectives)');

    // =========================================
    // 9. KPIs (Enhanced with frequency + thresholds)
    // =========================================
    console.log('📊 Creating KPIs...');
    const kpi1 = await prisma.KPI.create({
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
        formula: 'Satisfied Patients / Total Surveyed × 100',   // ✨ جديد
        dataSource: 'Patient Survey System',                     // ✨ جديد
        frequency: 'MONTHLY',                                    // ✨ جديد
        warningThreshold: 0.8,                                   // ✨ جديد
        criticalThreshold: 0.6,                                  // ✨ جديد
      },
    });

    const kpi2 = await prisma.KPI.create({
      data: {
        versionId: strategy1.id,
        objectiveId: objective1.id,
        name: 'Average Wait Time',
        nameAr: 'متوسط وقت الانتظار',
        description: 'متوسط وقت انتظار المريض بالدقائق',
        target: 30,
        actual: 35,
        unit: 'دقيقة',
        status: 'AT_RISK',
        formula: 'Total Wait Time / Number of Visits',
        dataSource: 'Queue Management System',
        frequency: 'WEEKLY',
        warningThreshold: 0.85,
        criticalThreshold: 0.7,
        direction: 'LOWER_IS_BETTER',  // ✨ الأقل = الأفضل
      },
    });

    const kpi3 = await prisma.KPI.create({
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
        frequency: 'QUARTERLY',
        warningThreshold: 0.75,
        criticalThreshold: 0.5,
      },
    });
    console.log('✅ Created 3 KPIs');

    // =========================================
    // 10. KPI ENTRIES (NEW ✨)
    // =========================================
    console.log('📈 Creating KPI Entries (Historical Data)...');
    // Create monthly entries for Patient Satisfaction
    const months = ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06'];
    const values = [78, 80, 82, 84, 83, 85];
    for (let i = 0; i < months.length; i++) {
      await prisma.KPIEntry.create({
        data: {
          kpiId: kpi1.id,
          value: values[i],
          periodStart: new Date(`${months[i]}-01`),
          periodEnd: new Date(`${months[i]}-28`),
          enteredBy: managerUser.id,
          status: 'CONFIRMED',
          notes: i === 5 ? 'أحدث قراءة' : null,
        },
      });
    }
    console.log('✅ Created 6 KPI Entries (6 months of data)');

    // =========================================
    // 11. STRATEGIC INITIATIVES (Enhanced)
    // =========================================
    console.log('🚀 Creating Strategic Initiatives...');
    await prisma.strategicInitiative.create({
      data: {
        versionId: strategy1.id,
        title: 'مشروع التحول الرقمي للعيادات',
        description: 'رقمنة جميع العيادات الخارجية وربطها بنظام موحد',
        owner: managerUser.id,
        status: 'IN_PROGRESS',
        startDate: new Date('2024-01-15'),       // ✨ جديد
        endDate: new Date('2024-12-31'),         // ✨ جديد
        progress: 45,                             // ✨ جديد
        budget: 5000000,                          // ✨ جديد
        priority: 'HIGH',                         // ✨ جديد
      },
    });

    await prisma.strategicInitiative.create({
      data: {
        versionId: strategy1.id,
        title: 'برنامج تدريب الكوادر الطبية',
        description: 'برنامج تأهيل وتدريب 500 كادر طبي',
        owner: editorUser.id,
        status: 'PLANNED',
        startDate: new Date('2024-03-01'),
        endDate: new Date('2025-03-01'),
        progress: 10,
        budget: 2000000,
        priority: 'MEDIUM',
      },
    });
    console.log('✅ Created 2 Strategic Initiatives');

    // =========================================
    // 12. STRATEGIC REVIEWS (Enhanced with decision engine)
    // =========================================
    console.log('📋 Creating Strategic Reviews...');
    await prisma.strategicReview.create({
      data: {
        versionId: strategy1.id,
        title: 'المراجعة الربعية — Q1 2024',
        reviewDate: new Date('2024-03-31'),
        status: 'COMPLETED',
        notes: 'مراجعة شاملة للربع الأول',
        type: 'QUARTERLY_REVIEW',                            // ✨ جديد
        decision: 'CONTINUE',                                 // ✨ جديد
        summary: 'أداء مقبول مع حاجة لتحسين وقت الانتظار',   // ✨ جديد
        findings: 'معدل رضا المرضى في تحسن تدريجي. وقت الانتظار ما زال أعلى من المستهدف.',
        recommendations: 'زيادة الموارد البشرية في العيادات الخارجية وتفعيل نظام الحجز الإلكتروني',
        overallScore: 78.5,                                    // ✨ جديد
        conductedBy: adminUser.id,                             // ✨ جديد
      },
    });
    console.log('✅ Created Strategic Review');

    // =========================================
    // 13. STRATEGIC CHOICES (Enhanced)
    // =========================================
    console.log('🎲 Creating Strategic Choices...');
    const choice1 = await prisma.strategicChoice.create({
      data: {
        versionId: strategy1.id,
        title: 'التوسع في الخدمات الصحية عن بُعد',
        description: 'تقديم الاستشارات والمتابعة الطبية عبر تطبيقات الهاتف',
        status: 'ACTIVE',
        priority: 'HIGH',
        choiceType: 'MARKET_DEVELOPMENT',          // ✨ جديد
        marketAttractiveness: 5,                    // ✨ جديد
        competitiveAdvantage: 4,                    // ✨ جديد
        feasibility: 4,                             // ✨ جديد
        riskLevel: 'MEDIUM',                        // ✨ جديد
        isSelected: true,                           // ✨ جديد
        requiredCapabilities: 'بنية تحتية تقنية، أطباء مدربين على الاستشارات عن بُعد',
      },
    });
    console.log('✅ Created Strategic Choice');

    // =========================================
    // 14. STRATEGIC RISKS (Enhanced with quantitative scoring)
    // =========================================
    console.log('⚠️  Creating Strategic Risks...');
    await prisma.strategicRisk.create({
      data: {
        versionId: strategy1.id,
        choiceId: choice1.id,
        title: 'مخاطر أمن البيانات الصحية',
        description: 'احتمال تعرض بيانات المرضى للاختراق في النظام الإلكتروني',
        probability: 'MEDIUM',
        impact: 'HIGH',
        mitigation: 'تطبيق معايير أمن المعلومات الصحية (HIPAA) وتشفير البيانات',
        owner: managerUser.id,
        status: 'OPEN',
        category: 'OPERATIONAL',          // ✨ جديد
        probabilityScore: 3,              // ✨ جديد
        impactScore: 5,                   // ✨ جديد
        riskScore: 15,                    // ✨ جديد (3 × 5)
        contingency: 'خطة استجابة لحوادث الأمن السيبراني + تأمين ضد الاختراقات',
      },
    });
    console.log('✅ Created Strategic Risk');

    // =========================================
    // 15. ASSESSMENT + SWOT (Unchanged)
    // =========================================
    console.log('📝 Creating Assessment + SWOT...');
    const assessment1 = await prisma.assessment.create({
      data: {
        entityId: entity1.id,
        title: 'تقييم الأداء الربع سنوي',
        description: 'تقييم شامل للأداء المؤسسي',
        status: 'IN_PROGRESS',
      },
    });

    const dimension1 = await prisma.dimension.create({
      data: { assessmentId: assessment1.id, name: 'الجودة', description: 'بُعد الجودة في الخدمات' },
    });
    const dimension2 = await prisma.dimension.create({
      data: { assessmentId: assessment1.id, name: 'الكفاءة', description: 'بُعد كفاءة العمليات' },
    });

    await prisma.criterion.create({
      data: { dimensionId: dimension1.id, name: 'رضا العملاء', description: 'مدى رضا العملاء عن الخدمات', score: 4.2 },
    });
    await prisma.criterion.create({
      data: { dimensionId: dimension2.id, name: 'سرعة الإنجاز', description: 'سرعة إنجاز المعاملات', score: 3.8 },
    });

    // SWOT Analysis Points
    await prisma.analysisPoint.create({
      data: { assessmentId: assessment1.id, type: 'STRENGTH', title: 'كوادر طبية عالية التأهيل', impact: 'HIGH' },
    });
    await prisma.analysisPoint.create({
      data: { assessmentId: assessment1.id, type: 'WEAKNESS', title: 'بطء التحول الرقمي', impact: 'MEDIUM' },
    });
    await prisma.analysisPoint.create({
      data: { assessmentId: assessment1.id, type: 'OPPORTUNITY', title: 'دعم رؤية 2030 للقطاع الصحي', impact: 'HIGH' },
    });
    await prisma.analysisPoint.create({
      data: { assessmentId: assessment1.id, type: 'THREAT', title: 'منافسة القطاع الخاص', impact: 'MEDIUM' },
    });
    console.log('✅ Created Assessment + 2 Dimensions + 2 Criteria + 4 SWOT Points');

    // =========================================
    // 16. STRATEGIC ALERTS (NEW ✨)
    // =========================================
    console.log('🔔 Creating Strategic Alerts...');
    await prisma.strategicAlert.create({
      data: {
        entityId: entity1.id,
        type: 'KPI_WARNING',
        severity: 'WARNING',
        title: 'تنبيه: متوسط وقت الانتظار أعلى من المستهدف',
        message: 'مؤشر "متوسط وقت الانتظار" وصل إلى 35 دقيقة (المستهدف 30 دقيقة). نسبة الأداء 85.7%',
        referenceId: kpi2.id,
        referenceType: 'KPI',
      },
    });
    await prisma.strategicAlert.create({
      data: {
        entityId: entity1.id,
        type: 'RISK_HIGH',
        severity: 'CRITICAL',
        title: 'خطر عالي: أمن البيانات الصحية',
        message: 'مخاطر أمن البيانات الصحية حصلت على درجة خطورة 15/25. يجب اتخاذ إجراء فوري.',
        referenceType: 'RISK',
      },
    });
    console.log('✅ Created 2 Strategic Alerts');

    // =========================================
    // 17. AUDIT LOG
    // =========================================
    console.log('📜 Creating Audit Logs...');
    await prisma.auditLog.create({
      data: {
        entityId: entity1.id,
        userId: adminUser.id,
        action: 'STRATEGY_CREATED',
        details: 'تم إنشاء الخطة الاستراتيجية 2024-2028',
      },
    });
    await prisma.auditLog.create({
      data: {
        entityId: entity1.id,
        userId: adminUser.id,
        action: 'STRATEGY_ACTIVATED',
        details: 'تم تفعيل النسخة رقم 1 — الخطة الاستراتيجية 2024-2028',
      },
    });
    console.log('✅ Created 2 Audit Logs');

    // =========================================
    // SUMMARY
    // =========================================
    console.log('\n🎉 Database seeded successfully! (v2.0 — Phase 1)');
    console.log('\n📊 Seed Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  3 Sectors + 3 Industries + 3 Entity Types');
    console.log('  4 Users + 2 Entities + 4 Members');
    console.log('  1 Strategy Version (with name, description, approval)');
    console.log('  6 Strategic Directions (Vision, Mission, 3 Values, 1 Issue) ✨');
    console.log('  4 PESTEL Analysis Points ✨');
    console.log('  4 Strategic Objectives (BSC Perspectives) ✨');
    console.log('  3 KPIs (with frequency, thresholds) ✨');
    console.log('  6 KPI Entries (historical data) ✨');
    console.log('  2 Strategic Initiatives (with dates, progress, budget) ✨');
    console.log('  1 Strategic Review (with decision engine) ✨');
    console.log('  1 Strategic Choice (Ansoff: Market Development) ✨');
    console.log('  1 Strategic Risk (quantitative: score 15/25) ✨');
    console.log('  1 Assessment + 2 Dimensions + 2 Criteria + 4 SWOT Points');
    console.log('  2 Strategic Alerts ✨');
    console.log('  2 Audit Logs');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📌 Login credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin (OWNER):    admin@stratix.com / Admin123!');
    console.log('Manager (ADMIN):  manager@stratix.com / User123!');
    console.log('Editor (EDITOR):  editor@stratix.com / User123!');
    console.log('Viewer (VIEWER):  viewer@stratix.com / User123!');
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
