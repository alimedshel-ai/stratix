const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const tools = [
    // ===== DIAGNOSIS (4 أدوات) =====
    {
        code: 'SWOT',
        nameAr: 'تحليل SWOT',
        nameEn: 'SWOT Analysis',
        descriptionAr: 'تحليل نقاط القوة والضعف والفرص والتهديدات للمنظمة',
        descriptionEn: 'Analyze Strengths, Weaknesses, Opportunities, and Threats',
        category: 'DIAGNOSIS',
        isPrimary: true,
        order: 1,
        icon: 'bi-grid-3x3',
        color: '#4F46E5',
        configSchema: JSON.stringify({
            sections: ['strengths', 'weaknesses', 'opportunities', 'threats'],
            minItems: 3,
            maxItems: 10
        })
    },
    {
        code: 'PESTEL',
        nameAr: 'تحليل PESTEL',
        nameEn: 'PESTEL Analysis',
        descriptionAr: 'تحليل البيئة الخارجية: السياسية والاقتصادية والاجتماعية والتقنية والبيئية والقانونية',
        descriptionEn: 'Analyze Political, Economic, Social, Technological, Environmental, and Legal factors',
        category: 'DIAGNOSIS',
        isPrimary: true,
        order: 2,
        icon: 'bi-globe2',
        color: '#0891B2',
        configSchema: JSON.stringify({
            sections: ['political', 'economic', 'social', 'technological', 'environmental', 'legal'],
            fields: ['factor', 'impact', 'probability', 'trend']
        })
    },
    {
        code: 'PORTER',
        nameAr: 'قوى بورتر الخمس',
        nameEn: "Porter's Five Forces",
        descriptionAr: 'تحليل القوى التنافسية الخمس لفهم جاذبية الصناعة',
        descriptionEn: 'Analyze five competitive forces to understand industry attractiveness',
        category: 'DIAGNOSIS',
        isPrimary: true,
        order: 3,
        icon: 'bi-diagram-3',
        color: '#DC2626',
        configSchema: JSON.stringify({
            forces: ['rivalry', 'newEntrants', 'substitutes', 'supplierPower', 'buyerPower'],
            scale: { min: 1, max: 5 }
        })
    },
    {
        code: 'VRIO',
        nameAr: 'تحليل VRIO',
        nameEn: 'VRIO Framework',
        descriptionAr: 'تحليل الموارد والقدرات الداخلية: القيمة والندرة وصعوبة التقليد والتنظيم',
        descriptionEn: 'Analyze resources: Valuable, Rare, Inimitable, Organized',
        category: 'DIAGNOSIS',
        isPrimary: false,
        order: 4,
        icon: 'bi-gem',
        color: '#7C3AED',
        configSchema: JSON.stringify({
            fields: ['name', 'valuable', 'rare', 'inimitable', 'organized'],
            results: ['COMPETITIVE_DISADVANTAGE', 'COMPETITIVE_PARITY', 'TEMPORARY_ADVANTAGE', 'SUSTAINED_ADVANTAGE']
        })
    },
    {
        code: 'INTERNAL_ENV',
        nameAr: 'تحليل البيئة الداخلية',
        nameEn: 'Internal Environment Analysis',
        descriptionAr: 'تحليل عميق لأداء الإدارات الداخلية — اكتشف نقاط القوة والضعف في كل إدارة على حدة',
        descriptionEn: 'Deep analysis of internal departments — discover strengths and weaknesses per department',
        category: 'DIAGNOSIS',
        isPrimary: true,
        order: 5,
        icon: 'bi-building-gear',
        color: '#0D9488',
        configSchema: JSON.stringify({
            type: 'wizard',
            maxDepartments: 3,
            questionsPerDept: 4,
            scoreScale: { yes: 25, partial: 15, no: 5 }
        })
    },

    // ===== CHOICE (5 أدوات) =====
    {
        code: 'TOWS',
        nameAr: 'مصفوفة TOWS',
        nameEn: 'TOWS Matrix',
        descriptionAr: 'تحويل تحليل SWOT إلى استراتيجيات قابلة للتنفيذ عبر تقاطع العوامل',
        descriptionEn: 'Convert SWOT analysis into actionable strategies by crossing factors',
        category: 'CHOICE',
        isPrimary: true,
        order: 5,
        icon: 'bi-arrows-fullscreen',
        color: '#059669',
        configSchema: JSON.stringify({
            quadrants: ['SO', 'WO', 'ST', 'WT'],
            requiresSWOT: true
        })
    },
    {
        code: 'ANSOFF',
        nameAr: 'مصفوفة أنسوف',
        nameEn: 'Ansoff Matrix',
        descriptionAr: 'تحديد استراتيجية النمو: اختراق السوق، تطوير المنتج، تطوير السوق، التنويع',
        descriptionEn: 'Growth strategy: Market Penetration, Product Development, Market Development, Diversification',
        category: 'CHOICE',
        isPrimary: true,
        order: 6,
        icon: 'bi-grid-fill',
        color: '#EA580C',
        configSchema: JSON.stringify({
            quadrants: ['marketPenetration', 'productDevelopment', 'marketDevelopment', 'diversification'],
            axes: { x: 'market', y: 'product' }
        })
    },
    {
        code: 'BLUE_OCEAN',
        nameAr: 'استراتيجية المحيط الأزرق',
        nameEn: 'Blue Ocean Strategy',
        descriptionAr: 'خلق مساحة سوقية جديدة بلا منافسة عبر: استبعد، قلّص، ارفع، ابتكر',
        descriptionEn: 'Create uncontested market space: Eliminate, Reduce, Raise, Create',
        category: 'CHOICE',
        isPrimary: true,
        order: 7,
        icon: 'bi-water',
        color: '#0284C7',
        configSchema: JSON.stringify({
            errc: ['eliminate', 'reduce', 'raise', 'create'],
            canvas: { factors: [], industryScores: [], companyScores: [] }
        })
    },
    {
        code: 'BCG',
        nameAr: 'مصفوفة BCG',
        nameEn: 'BCG Matrix',
        descriptionAr: 'تحليل محفظة الأعمال: النجوم، البقر الحلوب، علامات الاستفهام، الكلاب',
        descriptionEn: 'Portfolio analysis: Stars, Cash Cows, Question Marks, Dogs',
        category: 'CHOICE',
        isPrimary: false,
        order: 8,
        icon: 'bi-pie-chart',
        color: '#B91C1C',
        configSchema: JSON.stringify({
            quadrants: ['stars', 'cashCows', 'questionMarks', 'dogs'],
            axes: { x: 'marketShare', y: 'marketGrowth' }
        })
    },
    {
        code: 'GE',
        nameAr: 'مصفوفة GE-McKinsey',
        nameEn: 'GE-McKinsey Matrix',
        descriptionAr: 'تخصيص الموارد عبر تقييم جاذبية الصناعة وقوة الوحدة التنافسية',
        descriptionEn: 'Resource allocation based on industry attractiveness and competitive strength',
        category: 'CHOICE',
        isPrimary: false,
        order: 9,
        icon: 'bi-grid-3x3-gap',
        color: '#92400E',
        configSchema: JSON.stringify({
            grid: '3x3',
            axes: { x: 'competitiveStrength', y: 'industryAttractiveness' }
        })
    },

    // ===== EXECUTION (3 أدوات) =====
    {
        code: 'BSC',
        nameAr: 'بطاقة الأداء المتوازن + OKRs',
        nameEn: 'Balanced Scorecard & OKRs',
        descriptionAr: 'ترجمة الاستراتيجية لأهداف ومؤشرات عبر 4 محاور: المالي، العملاء، العمليات، التعلم',
        descriptionEn: 'Translate strategy into objectives across 4 perspectives: Financial, Customer, Internal, Learning',
        category: 'EXECUTION',
        isPrimary: true,
        order: 10,
        icon: 'bi-speedometer2',
        color: '#16A34A',
        configSchema: JSON.stringify({
            perspectives: ['FINANCIAL', 'CUSTOMER', 'INTERNAL_PROCESS', 'LEARNING_GROWTH'],
            okrSupport: true
        })
    },
    {
        code: 'HOSHIN',
        nameAr: 'هوشين كانري',
        nameEn: 'Hoshin Kanri',
        descriptionAr: 'نشر الاستراتيجية من القمة للقاعدة: أهداف اختراقية → سنوية → شهرية',
        descriptionEn: 'Strategy deployment: Breakthrough objectives → Annual targets → Monthly actions',
        category: 'EXECUTION',
        isPrimary: true,
        order: 11,
        icon: 'bi-compass',
        color: '#E11D48',
        configSchema: JSON.stringify({
            levels: ['breakthrough', 'annual', 'monthly'],
            catchball: true
        })
    },
    {
        code: 'SEVEN_S',
        nameAr: 'نموذج ماكنزي 7S',
        nameEn: 'McKinsey 7S Framework',
        descriptionAr: 'تقييم التوافق الداخلي عبر 7 عناصر: الاستراتيجية، الهيكل، الأنظمة، القيم، المهارات، الكوادر، الأسلوب',
        descriptionEn: 'Internal alignment across 7 elements: Strategy, Structure, Systems, Shared Values, Skills, Staff, Style',
        category: 'EXECUTION',
        isPrimary: false,
        order: 12,
        icon: 'bi-hexagon',
        color: '#7C2D12',
        configSchema: JSON.stringify({
            elements: ['strategy', 'structure', 'systems', 'sharedValues', 'skills', 'staff', 'style'],
            type: 'radar'
        })
    },

    // ===== EXECUTION CONT. (2 أدوات جديدة) =====
    {
        code: 'THREE_HORIZONS',
        nameAr: 'الآفاق الثلاثة',
        nameEn: 'Three Horizons',
        descriptionAr: 'تخطيط النمو عبر 3 آفاق زمنية: حافظ على الحالي، نمّي الجديد، ابتكر المستقبل',
        descriptionEn: 'Growth planning across 3 time horizons: Maintain, Grow, Create',
        category: 'EXECUTION',
        isPrimary: false,
        order: 14,
        icon: 'bi-layers',
        color: '#0D9488',
        configSchema: JSON.stringify({
            horizons: ['H1_maintain', 'H2_grow', 'H3_create'],
            fields: ['title', 'description', 'revenue', 'investment', 'timeframe', 'initiativeId']
        })
    },
    {
        code: 'OGSM',
        nameAr: 'ملخص OGSM',
        nameEn: 'OGSM Summary',
        descriptionAr: 'ملخص استراتيجي على صفحة واحدة: الأهداف، الغايات، الاستراتيجيات، المقاييس',
        descriptionEn: 'One-page strategic summary: Objectives, Goals, Strategies, Measures',
        category: 'EXECUTION',
        isPrimary: false,
        order: 15,
        icon: 'bi-file-earmark-text',
        color: '#7C3AED',
        configSchema: JSON.stringify({
            sections: ['objectives', 'goals', 'strategies', 'measures'],
            autoPull: true
        })
    },

    // ===== ADAPTATION (1 أداة) =====
    {
        code: 'SCENARIO',
        nameAr: 'تخطيط السيناريوهات',
        nameEn: 'Scenario Planning',
        descriptionAr: 'الاستعداد للمستقبل عبر بناء سيناريوهات متعددة وخطط استجابة لكل منها',
        descriptionEn: 'Prepare for the future by building multiple scenarios and response plans',
        category: 'ADAPTATION',
        isPrimary: true,
        order: 13,
        icon: 'bi-signpost-split',
        color: '#6D28D9',
        configSchema: JSON.stringify({
            scenarios: ['optimistic', 'realistic', 'pessimistic'],
            fields: ['name', 'probability', 'impact', 'description', 'actions']
        })
    },

    // ===== أدوات جديدة =====

    // سلسلة القيمة — أين تخلق القيمة في عملياتك؟
    {
        code: 'VALUE_CHAIN',
        nameAr: 'سلسلة القيمة',
        nameEn: 'Value Chain Analysis',
        descriptionAr: 'تحليل الأنشطة الأساسية والمساندة لتحديد أين تخلق القيمة وأين توجد الهدر والفرص التحسينية',
        descriptionEn: 'Analyze primary and support activities to identify where value is created and improvement opportunities',
        category: 'DIAGNOSIS',
        isPrimary: true,
        order: 16,
        icon: 'bi-link-45deg',
        color: '#0891B2',
        configSchema: JSON.stringify({
            sections: ['inboundLogistics', 'operations', 'outboundLogistics', 'marketingSales', 'service', 'infrastructure', 'hrManagement', 'techDevelopment', 'procurement'],
            fields: ['activity', 'cost', 'value', 'improvement']
        })
    },

    // القدرات الجوهرية — ما يميزك حقاً
    {
        code: 'CORE_COMPETENCY',
        nameAr: 'القدرات الجوهرية',
        nameEn: 'Core Competency Analysis',
        descriptionAr: 'تحديد القدرات الجوهرية التي تميز المنظمة عن المنافسين وبناء الميزة التنافسية المستدامة',
        descriptionEn: 'Identify core competencies that differentiate the organization and build sustainable competitive advantage',
        category: 'DIAGNOSIS',
        isPrimary: false,
        order: 17,
        icon: 'bi-trophy',
        color: '#D97706',
        configSchema: JSON.stringify({
            sections: ['competencies'],
            fields: ['name', 'description', 'uniqueness', 'customerValue', 'extensibility', 'difficulty'],
            tests: ['valuable_to_customer', 'difficult_to_imitate', 'extendable_to_markets']
        })
    },

    // نموذج الأعمال Canvas
    {
        code: 'BUSINESS_MODEL',
        nameAr: 'نموذج الأعمال Canvas',
        nameEn: 'Business Model Canvas',
        descriptionAr: 'رؤية شاملة لنموذج العمل عبر 9 مكونات: شرائح العملاء، القيمة المقدّمة، القنوات، العلاقات، مصادر الإيرادات، الموارد، الأنشطة، الشراكات، هيكل التكاليف',
        descriptionEn: 'Comprehensive business model view across 9 building blocks',
        category: 'CHOICE',
        isPrimary: true,
        order: 18,
        icon: 'bi-easel2',
        color: '#0369A1',
        configSchema: JSON.stringify({
            sections: ['customerSegments', 'valueProposition', 'channels', 'customerRelationships', 'revenueStreams', 'keyResources', 'keyActivities', 'keyPartners', 'costStructure'],
            layout: 'canvas'
        })
    },

    // خريطة رحلة العميل
    {
        code: 'CUSTOMER_JOURNEY',
        nameAr: 'خريطة رحلة العميل',
        nameEn: 'Customer Journey Map',
        descriptionAr: 'رسم رحلة العميل الكاملة من الوعي للولاء وتحديد نقاط الألم وفرص التحسين في كل مرحلة',
        descriptionEn: 'Map the complete customer journey from awareness to loyalty, identifying pain points and improvement opportunities',
        category: 'DIAGNOSIS',
        isPrimary: false,
        order: 19,
        icon: 'bi-person-walking',
        color: '#DB2777',
        configSchema: JSON.stringify({
            sections: ['awareness', 'consideration', 'purchase', 'delivery', 'postPurchase', 'loyalty'],
            fields: ['touchpoint', 'emotion', 'painPoint', 'opportunity', 'action']
        })
    },

    // مصفوفة أيزنهاور
    {
        code: 'EISENHOWER',
        nameAr: 'مصفوفة أيزنهاور',
        nameEn: 'Eisenhower Matrix',
        descriptionAr: 'تصنيف المهام والمبادرات حسب الأهمية والإلحاح: إنجز فوراً، خطط، فوّض، احذف',
        descriptionEn: 'Classify initiatives by urgency and importance: Do, Schedule, Delegate, Delete',
        category: 'EXECUTION',
        isPrimary: false,
        order: 20,
        icon: 'bi-grid',
        color: '#9333EA',
        configSchema: JSON.stringify({
            quadrants: ['doFirst', 'schedule', 'delegate', 'eliminate'],
            axes: { x: 'urgency', y: 'importance' }
        })
    },

    // تحليل باريتو 80/20
    {
        code: 'PARETO',
        nameAr: 'تحليل باريتو 80/20',
        nameEn: 'Pareto Analysis',
        descriptionAr: 'تحديد الـ20% من العوامل التي تؤثر على 80% من النتائج — ركّز جهودك على ما يهم فعلاً',
        descriptionEn: 'Identify the 20% of factors that drive 80% of results — focus efforts on what truly matters',
        category: 'ADAPTATION',
        isPrimary: false,
        order: 21,
        icon: 'bi-bar-chart-line',
        color: '#059669',
        configSchema: JSON.stringify({
            sections: ['factors'],
            fields: ['name', 'frequency', 'impact', 'cumulativePercent'],
            chartType: 'pareto'
        })
    },
];

async function seedTools() {
    console.log('🌱 بذر أدوات التحليل الاستراتيجي...\n');

    let created = 0;
    let updated = 0;

    for (const tool of tools) {
        const result = await prisma.toolDefinition.upsert({
            where: { code: tool.code },
            update: {
                nameAr: tool.nameAr,
                nameEn: tool.nameEn,
                descriptionAr: tool.descriptionAr,
                descriptionEn: tool.descriptionEn,
                category: tool.category,
                isPrimary: tool.isPrimary,
                order: tool.order,
                icon: tool.icon,
                color: tool.color,
                configSchema: tool.configSchema
            },
            create: tool
        });

        const isNew = result.createdAt.getTime() > Date.now() - 1000;
        if (isNew) {
            created++;
            console.log(`  ✅ ${tool.code} — ${tool.nameAr} (جديد)`);
        } else {
            updated++;
            console.log(`  🔄 ${tool.code} — ${tool.nameAr} (محدّث)`);
        }
    }

    console.log(`\n🎉 الإجمالي: ${created} جديدة، ${updated} محدّثة`);

    // عرض الملخص
    const summary = await prisma.toolDefinition.groupBy({
        by: ['category'],
        _count: { id: true },
        orderBy: { category: 'asc' }
    });

    console.log('\n📊 الملخص:');
    summary.forEach(s => {
        const label = {
            'DIAGNOSIS': '🔍 التشخيص',
            'CHOICE': '🎯 الاختيار',
            'EXECUTION': '⚡ التنفيذ',
            'ADAPTATION': '🔄 التكيف'
        }[s.category] || s.category;
        console.log(`  ${label}: ${s._count.id} أدوات`);
    });

    const primaryCount = await prisma.toolDefinition.count({ where: { isPrimary: true } });
    const advancedCount = await prisma.toolDefinition.count({ where: { isPrimary: false } });
    console.log(`\n  ⭐ أساسية: ${primaryCount} | 🔒 متقدمة: ${advancedCount}`);
}

seedTools()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
