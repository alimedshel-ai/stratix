const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seed() {
  try {
    console.log('🌱 Starting database seed (v4.0 — Day 1 Security + Full Data)...');

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
    await prisma.Subscription.deleteMany();
    await prisma.Company.deleteMany();
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
    // 1b. COMPANIES & SUBSCRIPTIONS
    // =========================================
    console.log('🏢 Creating Companies...');
    const company1 = await prisma.company.create({
      data: {
        nameAr: 'مجموعة ستارتكس القابضة',
        nameEn: 'Stratix Holding Group',
        code: 'STRATIX_GROUP',
        status: 'ACTIVE',
      },
    });

    await prisma.subscription.create({
      data: {
        companyId: company1.id,
        plan: 'ENTERPRISE',
        status: 'ACTIVE',
        maxUsers: 100,
        maxEntities: 10,
      },
    });
    console.log('✅ Created 1 Company + Subscription');

    // =========================================
    // 2. USERS — كلمات مرور قوية للعرض
    // =========================================
    console.log('👥 Creating Users...');
    const hashedAdmin = await bcrypt.hash('Adm!n@Str4tix2026', 10);
    const hashedManager = await bcrypt.hash('Mgr@Str4tix2026!', 10);
    const hashedEditor = await bcrypt.hash('Ed!t@Str4tix2026', 10);
    const hashedViewer = await bcrypt.hash('V!ew@Str4tix2026', 10);

    const adminUser = await prisma.user.create({
      data: { email: 'admin@stratix.com', password: hashedAdmin, name: 'مدير النظام' },
    });
    const managerUser = await prisma.user.create({
      data: { email: 'manager@stratix.com', password: hashedManager, name: 'مدير الاستراتيجية' },
    });
    const editorUser = await prisma.user.create({
      data: { email: 'editor@stratix.com', password: hashedEditor, name: 'محرر المحتوى' },
    });
    const viewerUser = await prisma.user.create({
      data: { email: 'viewer@stratix.com', password: hashedViewer, name: 'مستخدم عادي' },
    });
    console.log('✅ Created 4 Users');

    // =========================================
    // 3. ENTITIES
    // =========================================
    console.log('🏛️  Creating Entities...');
    const entity1 = await prisma.entity.create({
      data: {
        legalName: 'شركة ستارتكس للحلول الاستراتيجية',
        displayName: 'شركة ستارتكس',
        companyId: company1.id,
        sectorId: sectorPrivate.id,
        industryId: industryTech.id,
        typeId: typeCompany.id,
        size: 'MEDIUM',
        school: 'BALANCED_SCORECARD',
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
    await prisma.member.create({ data: { userId: editorUser.id, entityId: entity1.id, role: 'EDITOR' } });
    await prisma.member.create({ data: { userId: viewerUser.id, entityId: entity1.id, role: 'VIEWER' } });
    console.log('✅ Created 4 Members');

    // =========================================
    // 5. STRATEGY VERSION
    // =========================================
    console.log('📋 Creating Strategy Versions...');
    const strategy1 = await prisma.strategyVersion.create({
      data: {
        entityId: entity1.id,
        versionNumber: 1,
        status: 'ACTIVE',
        name: 'الخطة الاستراتيجية 2026-2028',
        description: 'خطة التحول الرقمي والنمو المستدام لشركة ستارتكس',
        isActive: true,
        createdBy: adminUser.id,
        approvedBy: adminUser.id,
        approvedAt: new Date(),
        activatedAt: new Date(),
      },
    });
    console.log('✅ Created Strategy Version');

    // =========================================
    // 6. STRATEGIC DIRECTIONS
    // =========================================
    console.log('🧭 Creating Strategic Directions...');
    await prisma.strategicDirection.create({
      data: {
        versionId: strategy1.id, type: 'VISION',
        content: 'أن نكون المنصة الاستراتيجية الأولى في المنطقة العربية لتمكين المنظمات من اتخاذ قرارات ذكية',
        order: 1,
      },
    });
    await prisma.strategicDirection.create({
      data: {
        versionId: strategy1.id, type: 'MISSION',
        content: 'نقدم منصة رقمية متكاملة تحوّل البيانات الاستراتيجية إلى قرارات قابلة للتنفيذ عبر أدوات تحليل ذكية وتجربة مستخدم استثنائية',
        order: 1,
      },
    });
    const valuesData = [
      { content: 'الابتكار والتميز', order: 1 },
      { content: 'الشفافية والمصداقية', order: 2 },
      { content: 'التركيز على العميل', order: 3 },
      { content: 'التحسين المستمر', order: 4 },
    ];
    for (const v of valuesData) {
      await prisma.strategicDirection.create({
        data: { versionId: strategy1.id, type: 'VALUES', content: v.content, order: v.order },
      });
    }
    await prisma.strategicDirection.create({
      data: {
        versionId: strategy1.id, type: 'ISSUES',
        content: 'المنافسة المتزايدة في سوق حلول SaaS الاستراتيجية',
        order: 1,
      },
    });
    await prisma.strategicDirection.create({
      data: {
        versionId: strategy1.id, type: 'ISSUES',
        content: 'صعوبة اكتساب عملاء جدد في ظل تراجع ميزانيات التحول الرقمي',
        order: 2,
      },
    });
    console.log('✅ Created 8 Strategic Directions');

    // =========================================
    // 7. EXTERNAL ANALYSIS — PESTEL
    // =========================================
    console.log('🌍 Creating External Analysis (PESTEL)...');
    const pestelData = [
      { type: 'POLITICAL', factor: 'دعم رؤية 2030 للتحول الرقمي والحوكمة المؤسسية', impact: 'HIGH', probability: 0.95, trend: 'INCREASING', notes: 'فرصة استراتيجية كبرى' },
      { type: 'POLITICAL', factor: 'تشديد الأنظمة الرقابية على البيانات (PDPL)', impact: 'MEDIUM', probability: 0.8, trend: 'INCREASING' },
      { type: 'ECONOMIC', factor: 'نمو سوق SaaS في المنطقة بمعدل 22% سنوياً', impact: 'HIGH', probability: 0.85, trend: 'INCREASING' },
      { type: 'ECONOMIC', factor: 'ارتفاع تكاليف البنية التحتية السحابية', impact: 'MEDIUM', probability: 0.7, trend: 'STABLE' },
      { type: 'SOCIAL', factor: 'تزايد اعتماد المؤسسات العربية على أدوات التخطيط الرقمي', impact: 'HIGH', probability: 0.9, trend: 'INCREASING' },
      { type: 'TECHNOLOGICAL', factor: 'تطور الذكاء الاصطناعي التوليدي وتأثيره على أدوات التحليل', impact: 'HIGH', probability: 0.95, trend: 'INCREASING' },
      { type: 'LEGAL', factor: 'اشتراطات حماية البيانات الشخصية الجديدة', impact: 'MEDIUM', probability: 0.85, trend: 'INCREASING' },
      { type: 'ENVIRONMENTAL', factor: 'توجه المؤسسات نحو الاستدامة والحوكمة البيئية (ESG)', impact: 'LOW', probability: 0.6, trend: 'INCREASING' },
    ];
    for (const p of pestelData) {
      await prisma.externalAnalysis.create({ data: { versionId: strategy1.id, ...p } });
    }
    console.log('✅ Created 8 PESTEL Analysis Points');

    // =========================================
    // 8. STRATEGIC OBJECTIVES (8 أهداف — BSC 4 منظورات)
    // =========================================
    console.log('🎯 Creating Strategic Objectives...');
    const objective1 = await prisma.strategicObjective.create({
      data: {
        versionId: strategy1.id,
        title: 'زيادة الإيرادات المتكررة (MRR)',
        description: 'تنمية الإيرادات الشهرية المتكررة من اشتراكات المنصة بنسبة 40%',
        status: 'ACTIVE', perspective: 'FINANCIAL', weight: 0.20,
        targetValue: 140, baselineValue: 100, ownerId: adminUser.id,
      },
    });

    const objective2 = await prisma.strategicObjective.create({
      data: {
        versionId: strategy1.id,
        title: 'تقليل تكاليف التشغيل بنسبة 15%',
        description: 'تحسين الكفاءة التشغيلية وتقليل المصاريف غير الضرورية',
        status: 'ACTIVE', perspective: 'FINANCIAL', weight: 0.10,
        targetValue: 85, baselineValue: 100, ownerId: adminUser.id,
      },
    });

    const objective3 = await prisma.strategicObjective.create({
      data: {
        versionId: strategy1.id,
        title: 'رفع رضا العملاء إلى 90%',
        description: 'تحسين تجربة المستخدم وزيادة معدل NPS إلى 50+',
        status: 'ACTIVE', perspective: 'CUSTOMER', weight: 0.20,
        targetValue: 90, baselineValue: 72, ownerId: managerUser.id,
      },
    });

    const objective4 = await prisma.strategicObjective.create({
      data: {
        versionId: strategy1.id,
        title: 'التوسع في 3 أسواق خليجية',
        description: 'دخول أسواق الإمارات والبحرين والكويت خلال 2026',
        status: 'ACTIVE', perspective: 'CUSTOMER', weight: 0.10,
        targetValue: 3, baselineValue: 1, ownerId: managerUser.id,
      },
    });

    const objective5 = await prisma.strategicObjective.create({
      data: {
        versionId: strategy1.id,
        title: 'تسريع دورة التطوير والإطلاق',
        description: 'تقليل زمن الإطلاق من 4 أسابيع إلى أسبوعين',
        status: 'ACTIVE', perspective: 'INTERNAL_PROCESS', weight: 0.15,
        targetValue: 14, baselineValue: 28, ownerId: editorUser.id,
      },
    });

    const objective6 = await prisma.strategicObjective.create({
      data: {
        versionId: strategy1.id,
        title: 'أتمتة 80% من العمليات المتكررة',
        description: 'تقليل العمل اليدوي عبر أتمتة التقارير والتنبيهات',
        status: 'ACTIVE', perspective: 'INTERNAL_PROCESS', weight: 0.05,
        targetValue: 80, baselineValue: 30, ownerId: editorUser.id,
      },
    });

    const objective7 = await prisma.strategicObjective.create({
      data: {
        versionId: strategy1.id,
        title: 'بناء فريق عالي الأداء',
        description: 'استقطاب وتطوير 10 كفاءات تقنية واستراتيجية',
        status: 'ACTIVE', perspective: 'LEARNING_GROWTH', weight: 0.10,
        targetValue: 10, baselineValue: 4, ownerId: adminUser.id,
      },
    });

    const objective8 = await prisma.strategicObjective.create({
      data: {
        versionId: strategy1.id,
        title: 'رفع ساعات التدريب لـ 20 ساعة/شهر',
        description: 'تطوير مهارات الفريق عبر برامج تدريبية متخصصة',
        status: 'ACTIVE', perspective: 'LEARNING_GROWTH', weight: 0.10,
        targetValue: 20, baselineValue: 8, ownerId: adminUser.id,
      },
    });
    console.log('✅ Created 8 Strategic Objectives (BSC — 4 Perspectives)');

    // =========================================
    // 9. KPIs (10 مؤشرات)
    // =========================================
    console.log('📊 Creating KPIs...');
    const kpi1 = await prisma.KPI.create({
      data: {
        versionId: strategy1.id, objectiveId: objective1.id,
        name: 'Monthly Recurring Revenue', nameAr: 'الإيرادات الشهرية المتكررة',
        description: 'إجمالي الإيرادات من الاشتراكات الشهرية', target: 140000, actual: 95000,
        unit: 'ر.س', status: 'ON_TRACK', formula: 'عدد العملاء × متوسط الاشتراك',
        dataSource: 'نظام الفوترة', frequency: 'MONTHLY', warningThreshold: 0.8, criticalThreshold: 0.6,
      },
    });
    const kpi2 = await prisma.KPI.create({
      data: {
        versionId: strategy1.id, objectiveId: objective1.id,
        name: 'Customer Acquisition Cost', nameAr: 'تكلفة اكتساب العميل',
        description: 'متوسط تكلفة اكتساب عميل جديد', target: 500, actual: 680,
        unit: 'ر.س', status: 'AT_RISK', formula: 'إجمالي تكاليف التسويق / عدد العملاء الجدد',
        dataSource: 'التقارير المالية', frequency: 'MONTHLY', warningThreshold: 0.85, criticalThreshold: 0.7,
        direction: 'LOWER_IS_BETTER',
      },
    });
    const kpi3 = await prisma.KPI.create({
      data: {
        versionId: strategy1.id, objectiveId: objective3.id,
        name: 'Customer Satisfaction Score', nameAr: 'معدل رضا العملاء',
        description: 'نسبة رضا العملاء من الاستبيانات الدورية', target: 90, actual: 78,
        unit: '%', status: 'ON_TRACK', formula: 'العملاء الراضون / إجمالي المستجيبين × 100',
        dataSource: 'استبيان رضا العملاء', frequency: 'MONTHLY', warningThreshold: 0.8, criticalThreshold: 0.6,
      },
    });
    const kpi4 = await prisma.KPI.create({
      data: {
        versionId: strategy1.id, objectiveId: objective3.id,
        name: 'Net Promoter Score', nameAr: 'مؤشر صافي الترويج NPS',
        description: 'مدى استعداد العملاء للتوصية بالمنصة', target: 50, actual: 38,
        unit: 'نقطة', status: 'AT_RISK', formula: '% المروجين - % المنتقدين',
        dataSource: 'استبيان NPS', frequency: 'QUARTERLY', warningThreshold: 0.75, criticalThreshold: 0.5,
      },
    });
    const kpi5 = await prisma.KPI.create({
      data: {
        versionId: strategy1.id, objectiveId: objective5.id,
        name: 'Sprint Velocity', nameAr: 'سرعة التسليم',
        description: 'متوسط عدد المهام المنجزة في كل سبرنت', target: 30, actual: 24,
        unit: 'مهمة/سبرنت', status: 'ON_TRACK', formula: 'عدد المهام المكتملة في السبرنت',
        dataSource: 'نظام إدارة المشاريع', frequency: 'WEEKLY', warningThreshold: 0.7, criticalThreshold: 0.5,
      },
    });
    const kpi6 = await prisma.KPI.create({
      data: {
        versionId: strategy1.id, objectiveId: objective5.id,
        name: 'Release Cycle Time', nameAr: 'زمن دورة الإطلاق',
        description: 'المدة من بداية التطوير حتى الإطلاق', target: 14, actual: 21,
        unit: 'يوم', status: 'AT_RISK', formula: 'تاريخ الإطلاق - تاريخ بدء العمل',
        dataSource: 'نظام CI/CD', frequency: 'MONTHLY', warningThreshold: 0.85, criticalThreshold: 0.7,
        direction: 'LOWER_IS_BETTER',
      },
    });
    const kpi7 = await prisma.KPI.create({
      data: {
        versionId: strategy1.id, objectiveId: objective7.id,
        name: 'Employee Training Hours', nameAr: 'ساعات تدريب الموظفين',
        description: 'متوسط ساعات التدريب لكل موظف شهرياً', target: 20, actual: 14,
        unit: 'ساعة/شهر', status: 'ON_TRACK', formula: 'إجمالي ساعات التدريب / عدد الموظفين',
        dataSource: 'نظام الموارد البشرية', frequency: 'MONTHLY', warningThreshold: 0.7, criticalThreshold: 0.5,
      },
    });
    const kpi8 = await prisma.KPI.create({
      data: {
        versionId: strategy1.id, objectiveId: objective2.id,
        name: 'Operating Cost Ratio', nameAr: 'نسبة التكاليف التشغيلية',
        description: 'نسبة المصاريف التشغيلية إلى الإيرادات', target: 60, actual: 72,
        unit: '%', status: 'AT_RISK', formula: 'المصاريف التشغيلية / الإيرادات × 100',
        dataSource: 'التقارير المالية', frequency: 'MONTHLY', warningThreshold: 0.85, criticalThreshold: 0.7,
        direction: 'LOWER_IS_BETTER',
      },
    });
    const kpi9 = await prisma.KPI.create({
      data: {
        versionId: strategy1.id, objectiveId: objective4.id,
        name: 'New Markets Entered', nameAr: 'أسواق جديدة تم دخولها',
        description: 'عدد الأسواق الخليجية الجديدة التي تم الدخول فيها', target: 3, actual: 1,
        unit: 'سوق', status: 'ON_TRACK', formula: 'عدد الأسواق المفعّلة',
        dataSource: 'تقارير التوسع', frequency: 'QUARTERLY', warningThreshold: 0.6, criticalThreshold: 0.3,
      },
    });
    const kpi10 = await prisma.KPI.create({
      data: {
        versionId: strategy1.id, objectiveId: objective6.id,
        name: 'Automation Coverage', nameAr: 'نسبة تغطية الأتمتة',
        description: 'نسبة العمليات المؤتمتة من إجمالي العمليات المتكررة', target: 80, actual: 45,
        unit: '%', status: 'ON_TRACK', formula: 'العمليات المؤتمتة / إجمالي العمليات × 100',
        dataSource: 'نظام العمليات', frequency: 'MONTHLY', warningThreshold: 0.7, criticalThreshold: 0.4,
      },
    });
    console.log('✅ Created 10 KPIs');

    // =========================================
    // 10. KPI ENTRIES (بيانات تاريخية — 6 أشهر)
    // =========================================
    console.log('📈 Creating KPI Entries (Historical Data)...');
    const months = ['2025-09', '2025-10', '2025-11', '2025-12', '2026-01', '2026-02'];

    const kpiEntries = [
      { kpiId: kpi1.id, values: [60000, 68000, 75000, 82000, 89000, 95000], userId: managerUser.id },
      { kpiId: kpi3.id, values: [70, 72, 74, 75, 76, 78], userId: managerUser.id },
      { kpiId: kpi5.id, values: [18, 20, 21, 22, 23, 24], userId: editorUser.id },
      { kpiId: kpi8.id, values: [82, 80, 78, 76, 74, 72], userId: adminUser.id },
      { kpiId: kpi10.id, values: [30, 33, 36, 39, 42, 45], userId: editorUser.id },
    ];
    for (const entry of kpiEntries) {
      for (let i = 0; i < months.length; i++) {
        await prisma.KPIEntry.create({
          data: {
            kpiId: entry.kpiId, value: entry.values[i],
            periodStart: new Date(`${months[i]}-01`), periodEnd: new Date(`${months[i]}-28`),
            enteredBy: entry.userId, status: 'CONFIRMED',
          },
        });
      }
    }
    console.log('✅ Created 30 KPI Entries (5 KPIs × 6 months)');

    // =========================================
    // 11. STRATEGIC INITIATIVES (5 مبادرات)
    // =========================================
    console.log('🚀 Creating Strategic Initiatives...');
    await prisma.strategicInitiative.create({
      data: {
        versionId: strategy1.id,
        title: 'مشروع التحول الرقمي',
        description: 'إعادة هيكلة المنصة بالكامل مع واجهة مستخدم جديدة ومحرك ذكاء اصطناعي',
        owner: adminUser.id, status: 'IN_PROGRESS',
        startDate: new Date('2025-09-01'), endDate: new Date('2026-06-30'),
        progress: 65, budget: 500000, priority: 'HIGH',
      },
    });
    await prisma.strategicInitiative.create({
      data: {
        versionId: strategy1.id,
        title: 'برنامج اكتساب العملاء الجدد',
        description: 'حملة تسويقية مستهدفة لاستقطاب 100 عميل مؤسسي في 6 أشهر',
        owner: managerUser.id, status: 'IN_PROGRESS',
        startDate: new Date('2026-01-01'), endDate: new Date('2026-06-30'),
        progress: 25, budget: 200000, priority: 'HIGH',
      },
    });
    await prisma.strategicInitiative.create({
      data: {
        versionId: strategy1.id,
        title: 'تحسين سلسلة التوريد التقنية',
        description: 'تحسين البنية التحتية وتقليل التكاليف التشغيلية بنسبة 15%',
        owner: editorUser.id, status: 'PLANNED',
        startDate: new Date('2026-03-01'), endDate: new Date('2026-12-31'),
        progress: 10, budget: 150000, priority: 'MEDIUM',
      },
    });
    await prisma.strategicInitiative.create({
      data: {
        versionId: strategy1.id,
        title: 'إطلاق برنامج ولاء العملاء',
        description: 'برنامج مكافآت وخصومات للعملاء الحاليين لزيادة الاحتفاظ',
        owner: managerUser.id, status: 'IN_PROGRESS',
        startDate: new Date('2026-01-15'), endDate: new Date('2026-09-30'),
        progress: 35, budget: 80000, priority: 'MEDIUM',
      },
    });
    await prisma.strategicInitiative.create({
      data: {
        versionId: strategy1.id,
        title: 'التوسع في سوق الإمارات',
        description: 'افتتاح مكتب تمثيلي في دبي واستقطاب أول 10 عملاء إماراتيين',
        owner: adminUser.id, status: 'PLANNED',
        startDate: new Date('2026-04-01'), endDate: new Date('2026-12-31'),
        progress: 5, budget: 300000, priority: 'HIGH',
      },
    });
    console.log('✅ Created 5 Strategic Initiatives');

    // =========================================
    // 12. STRATEGIC REVIEWS
    // =========================================
    console.log('📋 Creating Strategic Reviews...');
    await prisma.strategicReview.create({
      data: {
        versionId: strategy1.id,
        title: 'المراجعة الربعية — Q4 2025',
        reviewDate: new Date('2025-12-31'),
        status: 'COMPLETED',
        notes: 'مراجعة شاملة للربع الرابع',
        type: 'QUARTERLY_REVIEW', decision: 'CONTINUE',
        summary: 'أداء جيد مع حاجة لتحسين تكلفة اكتساب العملاء',
        findings: 'نمو الإيرادات بمعدل 12% شهرياً. رضا العملاء في تحسن مستمر. تكلفة الاكتساب أعلى من المستهدف.',
        recommendations: 'التركيز على التسويق بالمحتوى لتقليل CAC. تسريع إطلاق الميزات الأكثر طلباً.',
        overallScore: 78.5, conductedBy: adminUser.id,
      },
    });
    await prisma.strategicReview.create({
      data: {
        versionId: strategy1.id,
        title: 'المراجعة الربعية — Q1 2026',
        reviewDate: new Date('2026-01-31'),
        status: 'IN_PROGRESS',
        notes: 'مراجعة الربع الأول 2026',
        type: 'QUARTERLY_REVIEW', decision: 'ADJUST',
        summary: 'حاجة لتعديل استراتيجية اكتساب العملاء',
        findings: 'NPS انخفض إلى 38. زمن دورة الإطلاق لا يزال 21 يوم بدل المستهدف 14.',
        recommendations: 'إعادة هيكلة فريق التطوير. إطلاق برنامج ولاء للعملاء الحاليين.',
        overallScore: 72.0, conductedBy: adminUser.id,
      },
    });
    console.log('✅ Created 2 Strategic Reviews');

    // =========================================
    // 13. STRATEGIC CHOICES
    // =========================================
    console.log('🎲 Creating Strategic Choices...');
    const choice1 = await prisma.strategicChoice.create({
      data: {
        versionId: strategy1.id,
        title: 'التوسع في الخدمات الاستشارية المؤتمتة',
        description: 'تقديم تقارير استراتيجية مؤتمتة عبر الذكاء الاصطناعي بدل الاستشاريين التقليديين',
        status: 'ACTIVE', priority: 'HIGH',
        choiceType: 'PRODUCT_DEVELOPMENT', marketAttractiveness: 5,
        competitiveAdvantage: 4, feasibility: 4, riskLevel: 'MEDIUM',
        isSelected: true,
        requiredCapabilities: 'محرك ذكاء اصطناعي متقدم، بيانات تدريب كافية، فريق ML',
      },
    });
    await prisma.strategicChoice.create({
      data: {
        versionId: strategy1.id,
        title: 'دخول سوق الشركات الصغيرة بباقة مخفضة',
        description: 'تقديم باقة SME بسعر منخفض لاستقطاب شريحة الشركات الصغيرة والناشئة',
        status: 'DRAFT', priority: 'MEDIUM',
        choiceType: 'MARKET_DEVELOPMENT', marketAttractiveness: 4,
        competitiveAdvantage: 3, feasibility: 5, riskLevel: 'LOW',
        isSelected: false,
        requiredCapabilities: 'تبسيط الواجهة، نموذج تسعير جديد، دعم ذاتي',
      },
    });
    console.log('✅ Created 2 Strategic Choices');

    // =========================================
    // 14. SCENARIOS (3 سيناريوهات)
    // =========================================
    console.log('🔮 Creating Scenarios...');
    await prisma.scenario.create({
      data: {
        versionId: strategy1.id,
        name: 'السيناريو المتفائل — نمو سريع',
        nameEn: 'Optimistic — Rapid Growth',
        description: 'تحقيق 150% من المستهدف عبر شراكات استراتيجية وتوسع إقليمي مبكر',
        type: 'OPTIMISTIC', probability: 25, impact: 'HIGH', status: 'ACTIVE',
        totalRevenueChange: 50, totalBudgetChange: 30, overallImpactScore: 85,
        notes: 'نجاح حملة التسويق + توقيع 3 شراكات كبرى + دعم حكومي للمنصة',
      },
    });
    await prisma.scenario.create({
      data: {
        versionId: strategy1.id,
        name: 'السيناريو الأساسي — نمو مستقر',
        nameEn: 'Baseline — Stable Growth',
        description: 'تحقيق 100% من المستهدفات الحالية مع تقدم تدريجي',
        type: 'BASELINE', probability: 50, impact: 'MEDIUM', status: 'ACTIVE',
        totalRevenueChange: 0, totalBudgetChange: 0, overallImpactScore: 60,
        notes: 'استمرار النمو الحالي 12% شهرياً + اكتساب 8-10 عملاء شهرياً',
      },
    });
    await prisma.scenario.create({
      data: {
        versionId: strategy1.id,
        name: 'السيناريو المتحفظ — تباطؤ النمو',
        nameEn: 'Pessimistic — Slowdown',
        description: 'تحقيق 60% فقط من المستهدفات بسبب منافسة شديدة أو تراجع السوق',
        type: 'PESSIMISTIC', probability: 25, impact: 'HIGH', status: 'ACTIVE',
        totalRevenueChange: -40, totalBudgetChange: -20, overallImpactScore: 35,
        notes: 'دخول منافس قوي + تراجع ميزانيات التحول الرقمي + ارتفاع تكاليف السحابة 30%',
      },
    });
    console.log('✅ Created 3 Scenarios');

    // =========================================
    // 15. STRATEGIC RISKS
    // =========================================
    console.log('⚠️  Creating Strategic Risks...');
    await prisma.strategicRisk.create({
      data: {
        versionId: strategy1.id, choiceId: choice1.id,
        title: 'مخاطر جودة مخرجات الذكاء الاصطناعي',
        description: 'احتمال أن تكون التوصيات المؤتمتة غير دقيقة مما يؤثر على ثقة العملاء',
        probability: 'MEDIUM', impact: 'HIGH',
        mitigation: 'مراجعة بشرية لكل تقرير + تنبيه العميل بأن التقارير استرشادية',
        owner: adminUser.id, status: 'OPEN',
        category: 'OPERATIONAL', probabilityScore: 3, impactScore: 5, riskScore: 15,
        contingency: 'إيقاف الميزة مؤقتاً + تعويض العملاء المتضررين',
      },
    });
    await prisma.strategicRisk.create({
      data: {
        versionId: strategy1.id,
        title: 'مخاطر تسرب البيانات الاستراتيجية',
        description: 'تسرب خطط العملاء الاستراتيجية بسبب ثغرات أمنية',
        probability: 'LOW', impact: 'CRITICAL',
        mitigation: 'تشفير شامل + اختبارات اختراق دورية + تأمين ضد الاختراقات',
        owner: managerUser.id, status: 'OPEN',
        category: 'SECURITY', probabilityScore: 2, impactScore: 5, riskScore: 10,
        contingency: 'خطة استجابة للحوادث + إخطار العملاء خلال 24 ساعة',
      },
    });
    await prisma.strategicRisk.create({
      data: {
        versionId: strategy1.id,
        title: 'مخاطر فقدان الكفاءات الرئيسية',
        description: 'استقالة أعضاء رئيسيين في الفريق التقني مما يعطل المشاريع',
        probability: 'MEDIUM', impact: 'HIGH',
        mitigation: 'برنامج حوافز + مسار وظيفي واضح + توثيق كامل للأنظمة',
        owner: adminUser.id, status: 'OPEN',
        category: 'HUMAN_RESOURCES', probabilityScore: 3, impactScore: 4, riskScore: 12,
        contingency: 'استعانة بمستشارين خارجيين + تعيين بديل خلال 30 يوم',
      },
    });
    console.log('✅ Created 3 Strategic Risks');

    // =========================================
    // 16. ASSESSMENT + SWOT (16 نقطة)
    // =========================================
    console.log('📝 Creating Assessment + SWOT...');
    const assessment1 = await prisma.assessment.create({
      data: {
        entityId: entity1.id,
        title: 'تقييم البيئة الداخلية Q1-2026',
        description: 'تقييم شامل للبيئة الداخلية والخارجية للمنظمة',
        status: 'COMPLETED',
      },
    });

    const dimension1 = await prisma.dimension.create({
      data: { assessmentId: assessment1.id, name: 'الجودة والأداء', description: 'جودة المنتج والخدمات المقدمة' },
    });
    const dimension2 = await prisma.dimension.create({
      data: { assessmentId: assessment1.id, name: 'الكفاءة التشغيلية', description: 'كفاءة العمليات الداخلية' },
    });
    const dimension3 = await prisma.dimension.create({
      data: { assessmentId: assessment1.id, name: 'رأس المال البشري', description: 'كفاءة وتأهيل الفريق' },
    });

    await prisma.criterion.create({
      data: { dimensionId: dimension1.id, name: 'رضا العملاء', description: 'مدى رضا العملاء عن المنصة', score: 4.2 },
    });
    await prisma.criterion.create({
      data: { dimensionId: dimension1.id, name: 'استقرار النظام', description: 'نسبة التوفر وسرعة الاستجابة', score: 4.5 },
    });
    await prisma.criterion.create({
      data: { dimensionId: dimension2.id, name: 'سرعة التسليم', description: 'سرعة إنجاز المهام والميزات', score: 3.4 },
    });
    await prisma.criterion.create({
      data: { dimensionId: dimension3.id, name: 'كفاءة الفريق', description: 'مستوى مهارات الفريق التقني', score: 4.0 },
    });

    // SWOT — 16 نقطة (4 لكل فئة)
    const swotData = [
      { type: 'STRENGTH', title: 'منصة متكاملة بأكثر من 67 أداة استراتيجية', impact: 'HIGH' },
      { type: 'STRENGTH', title: 'محرك ذكاء اصطناعي للتوصيات الآلية', impact: 'HIGH' },
      { type: 'STRENGTH', title: 'فريق تقني متعدد المهارات ومتحمس', impact: 'MEDIUM' },
      { type: 'STRENGTH', title: 'بنية تحتية سحابية مرنة وقابلة للتوسع', impact: 'MEDIUM' },
      { type: 'WEAKNESS', title: 'تجربة المستخدم تحتاج تحسين في بعض الصفحات', impact: 'MEDIUM' },
      { type: 'WEAKNESS', title: 'ضعف التسويق الرقمي وتكلفة اكتساب عالية', impact: 'HIGH' },
      { type: 'WEAKNESS', title: 'عدم وجود تطبيق جوال أصلي', impact: 'MEDIUM' },
      { type: 'WEAKNESS', title: 'فريق صغير الحجم مقارنة بالمنافسين', impact: 'MEDIUM' },
      { type: 'OPPORTUNITY', title: 'سوق التخطيط الاستراتيجي الرقمي ينمو 22% سنوياً', impact: 'HIGH' },
      { type: 'OPPORTUNITY', title: 'دعم رؤية 2030 لتبني الحوكمة والتخطيط المؤسسي', impact: 'HIGH' },
      { type: 'OPPORTUNITY', title: 'شراكات مع شركات استشارية لتوزيع المنتج', impact: 'MEDIUM' },
      { type: 'OPPORTUNITY', title: 'الطلب المتزايد على حلول عربية محلية', impact: 'HIGH' },
      { type: 'THREAT', title: 'منافسة متزايدة من حلول عالمية مثل Cascade وQuantive', impact: 'HIGH' },
      { type: 'THREAT', title: 'مقاومة التغيير في المؤسسات التقليدية', impact: 'MEDIUM' },
      { type: 'THREAT', title: 'تقلبات سعر الصرف وتأثيرها على التسعير الإقليمي', impact: 'LOW' },
      { type: 'THREAT', title: 'تغيرات تنظيمية مفاجئة في حماية البيانات', impact: 'MEDIUM' },
    ];
    for (const point of swotData) {
      await prisma.analysisPoint.create({
        data: { assessmentId: assessment1.id, ...point },
      });
    }
    console.log('✅ Created Assessment + 3 Dimensions + 4 Criteria + 16 SWOT Points');

    // =========================================
    // 17. STRATEGIC ALERTS (6 تنبيهات)
    // =========================================
    console.log('🔔 Creating Strategic Alerts...');
    const alertsData = [
      { type: 'KPI_WARNING', severity: 'WARNING', title: 'تأخر حاد — تكلفة اكتساب العميل أعلى بـ 36%', message: 'CAC الحالي 680 ر.س بدل المستهدف 500 ر.س. يلزم مراجعة قنوات التسويق.', referenceId: kpi2.id, referenceType: 'KPI' },
      { type: 'KPI_WARNING', severity: 'WARNING', title: 'تحذير — مؤشر NPS انخفض إلى 38 نقطة', message: 'المستهدف 50 نقطة. راجع تقييمات العملاء الأخيرة.', referenceId: kpi4.id, referenceType: 'KPI' },
      { type: 'KPI_WARNING', severity: 'INFO', title: 'إيجابي — الإيرادات الشهرية تنمو 12% شهرياً', message: 'MRR وصل 95K من أصل 140K مستهدف. استمر بنفس الوتيرة!', referenceId: kpi1.id, referenceType: 'KPI' },
      { type: 'INITIATIVE_DELAY', severity: 'WARNING', title: 'تأخر — مشروع التحول الرقمي عند 65% فقط', message: 'المبادرة متأخرة عن الجدول. يلزم تسريع الوتيرة.', referenceType: 'INITIATIVE' },
      { type: 'MILESTONE', severity: 'INFO', title: 'إنجاز — تم إطلاق نظام التنبيهات الذكية', message: 'اكتمل تطوير نظام التنبيهات والتوصيات الآلية بنجاح 🎉', referenceType: 'INITIATIVE' },
      { type: 'KPI_WARNING', severity: 'CRITICAL', title: 'حرج — زمن الإطلاق 21 يوم بدل 14', message: 'زمن دورة الإطلاق أعلى بـ 50% من المستهدف. يجب مراجعة عمليات CI/CD.', referenceId: kpi6.id, referenceType: 'KPI' },
    ];
    for (const alert of alertsData) {
      await prisma.strategicAlert.create({ data: { entityId: entity1.id, ...alert } });
    }
    console.log('✅ Created 6 Strategic Alerts');

    // =========================================
    // 18. AUDIT LOG
    // =========================================
    console.log('📜 Creating Audit Logs...');
    const auditData = [
      { action: 'STRATEGY_CREATED', details: 'تم إنشاء الخطة الاستراتيجية 2026-2028', userId: adminUser.id },
      { action: 'STRATEGY_ACTIVATED', details: 'تم تفعيل النسخة رقم 1 — الخطة الاستراتيجية 2026-2028', userId: adminUser.id },
      { action: 'KPI_UPDATED', details: 'تم تحديث مؤشر رضا العملاء — القيمة الجديدة: 78%', userId: managerUser.id },
      { action: 'INITIATIVE_UPDATED', details: 'تم تحديث تقدم مشروع التحول الرقمي إلى 65%', userId: adminUser.id },
      { action: 'REVIEW_CREATED', details: 'تم إنشاء المراجعة الربعية Q1-2026', userId: adminUser.id },
    ];
    for (const log of auditData) {
      await prisma.auditLog.create({ data: { entityId: entity1.id, ...log } });
    }
    console.log('✅ Created 5 Audit Logs');

    // =========================================
    // SUMMARY
    // =========================================
    console.log('\n🎉 Database seeded successfully! (v4.0 — Day 1 Security + Full Data)');
    console.log('\n📊 Seed Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  3 Sectors + 3 Industries + 3 Entity Types');
    console.log('  4 Users + 2 Entities + 4 Members');
    console.log('  1 Strategy Version (2026-2028)');
    console.log('  8 Strategic Directions (Vision, Mission, 4 Values, 2 Issues)');
    console.log('  8 PESTEL Analysis Points');
    console.log('  8 Strategic Objectives (BSC — 4 Perspectives)');
    console.log('  10 KPIs (with frequency, thresholds, directions)');
    console.log('  30 KPI Entries (5 KPIs × 6 months historical data)');
    console.log('  5 Strategic Initiatives (with dates, progress, budget)');
    console.log('  2 Strategic Reviews (with decision engine)');
    console.log('  2 Strategic Choices (Product Dev + Market Dev)');
    console.log('  3 Scenarios (Optimistic + Base + Pessimistic)');
    console.log('  3 Strategic Risks (quantitative scoring)');
    console.log('  1 Assessment + 3 Dimensions + 4 Criteria + 16 SWOT Points');
    console.log('  6 Strategic Alerts');
    console.log('  5 Audit Logs');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📌 بيانات الدخول (Demo Credentials):');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👑 Admin (OWNER):    admin@stratix.com / Adm!n@Str4tix2026');
    console.log('📊 Manager (ADMIN):  manager@stratix.com / Mgr@Str4tix2026!');
    console.log('✏️  Editor (EDITOR):  editor@stratix.com / Ed!t@Str4tix2026');
    console.log('👁️  Viewer (VIEWER):  viewer@stratix.com / V!ew@Str4tix2026');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

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
