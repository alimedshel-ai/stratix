/**
 * config/swagger.js — إعداد Swagger/OpenAPI لتوثيق APIs
 * 
 * الوصول: http://localhost:3000/api-docs
 */

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Stratix API',
            version: '2.0.0',
            description: `
## 🎯 منصة ستارتكيس — واجهة برمجة التطبيقات

منصة إدارة استراتيجية ذكية تقدم أدوات متكاملة للتخطيط والتنفيذ والمتابعة.

### الميزات الأساسية:
- 📊 **إدارة الأهداف الاستراتيجية** — (BSC, OKR, Hoshin Kanri)
- 📈 **مؤشرات الأداء (KPIs)** — مع إدخالات دورية وتنبيهات
- 🎯 **المبادرات والمشاريع** — تتبع التقدم والميزانيات
- 📋 **التقييمات والتحليلات** — SWOT, Gap Analysis
- 🤖 **المستشار الذكي (AI Advisor)** — توصيات مبنية على البيانات
- 🔔 **محرك التنبيهات** — رصد الانحرافات تلقائياً
- 👥 **إدارة الفريق والصلاحيات** — أدوار متعددة المستويات

### المصادقة:
استخدم \`POST /api/auth/login\` للحصول على JWT token، ثم أرسله في Header:
\`\`\`
Authorization: Bearer YOUR_TOKEN
\`\`\`

### الباقات والحدود:
| الباقة | أعضاء | KPIs | أهداف |
|--------|--------|------|--------|
| مجاني (TRIAL) | 3 | 3 | 2 |
| أساسي (BASIC) | 5 | 20 | 10 |
| احترافي (PRO) | 25 | ∞ | ∞ |
| مؤسسات (ENTERPRISE) | ∞ | ∞ | ∞ |
            `,
            contact: {
                name: 'فريق ستارتكيس',
                email: 'api@stratix.com',
                url: 'https://stratix.com'
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: '🔧 خادم التطوير المحلي'
            },
            {
                url: 'https://api.stratix.com',
                description: '🚀 الخادم الإنتاجي'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'أدخل رمز الوصول JWT — احصل عليه من POST /api/auth/login'
                }
            },
            schemas: {
                // ──── Auth ────
                LoginRequest: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: { type: 'string', format: 'email', example: 'user@company.com' },
                        password: { type: 'string', format: 'password', example: 'MyP@ss123' }
                    }
                },
                LoginResponse: {
                    type: 'object',
                    properties: {
                        token: { type: 'string', example: 'eyJhbGciOi...' },
                        user: { $ref: '#/components/schemas/User' }
                    }
                },

                // ──── User ────
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: 'cuid_abc123' },
                        email: { type: 'string', example: 'ahmed@company.com' },
                        name: { type: 'string', example: 'أحمد محمد' },
                        systemRole: { type: 'string', enum: ['USER', 'SUPER_ADMIN'], example: 'USER' },
                        lastLogin: { type: 'string', format: 'date-time', nullable: true },
                        disabled: { type: 'boolean', example: false },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                },

                // ──── Entity ────
                Entity: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        legalName: { type: 'string', example: 'شركة التقنية المتطورة' },
                        displayName: { type: 'string', example: 'TechCo', nullable: true },
                        size: { type: 'string', enum: ['STARTUP', 'SME', 'MEDIUM', 'LARGE', 'ENTERPRISE'], nullable: true },
                        school: { type: 'string', example: 'BALANCED_SCORECARD', nullable: true },
                        culture: { type: 'string', enum: ['AMERICAN', 'JAPANESE', 'EUROPEAN', 'ISLAMIC'], nullable: true },
                        isActive: { type: 'boolean' },
                        companyId: { type: 'string', nullable: true },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                },

                // ──── Company ────
                Company: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        nameAr: { type: 'string', example: 'شركة ستارتكيس' },
                        nameEn: { type: 'string', example: 'Startix Corp' },
                        email: { type: 'string', nullable: true },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                },

                // ──── Subscription ────
                Subscription: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        plan: { type: 'string', enum: ['TRIAL', 'BASIC', 'PRO', 'ENTERPRISE'] },
                        status: { type: 'string', enum: ['ACTIVE', 'EXPIRED', 'CANCELLED'] },
                        maxUsers: { type: 'integer', example: 5 },
                        maxEntities: { type: 'integer', example: 1 },
                        startDate: { type: 'string', format: 'date-time' },
                        endDate: { type: 'string', format: 'date-time', nullable: true }
                    }
                },

                // ──── Strategy ────
                StrategyVersion: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        versionNumber: { type: 'integer', example: 1 },
                        name: { type: 'string', example: 'خطة 2026' },
                        status: { type: 'string', enum: ['DRAFT', 'ACTIVE', 'ARCHIVED'] },
                        isActive: { type: 'boolean' },
                        entityId: { type: 'string' }
                    }
                },

                // ──── Strategic Objective ────
                Objective: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        title: { type: 'string', example: 'زيادة رضا العملاء بنسبة 20%' },
                        description: { type: 'string', nullable: true },
                        status: { type: 'string', enum: ['DRAFT', 'ACTIVE', 'ON_TRACK', 'AT_RISK', 'COMPLETED'] },
                        perspective: { type: 'string', enum: ['FINANCIAL', 'CUSTOMER', 'INTERNAL_PROCESS', 'LEARNING_GROWTH'], nullable: true },
                        weight: { type: 'number', nullable: true },
                        progress: { type: 'number', example: 45 },
                        versionId: { type: 'string' },
                        parentId: { type: 'string', nullable: true },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                },
                CreateObjective: {
                    type: 'object',
                    required: ['title', 'versionId'],
                    properties: {
                        title: { type: 'string', example: 'زيادة نسبة النمو' },
                        description: { type: 'string' },
                        versionId: { type: 'string' },
                        status: { type: 'string', default: 'DRAFT' },
                        perspective: { type: 'string' },
                        weight: { type: 'number' },
                        parentId: { type: 'string' }
                    }
                },

                // ──── KPI ────
                KPI: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        name: { type: 'string', example: 'نسبة رضا العملاء' },
                        nameAr: { type: 'string', nullable: true },
                        target: { type: 'number', example: 85 },
                        actual: { type: 'number', example: 72, nullable: true },
                        unit: { type: 'string', example: '%' },
                        status: { type: 'string', enum: ['ON_TRACK', 'AT_RISK', 'OFF_TRACK', 'NOT_STARTED'] },
                        frequency: { type: 'string', enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'] },
                        versionId: { type: 'string' },
                        objectiveId: { type: 'string', nullable: true },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                },
                CreateKPI: {
                    type: 'object',
                    required: ['name', 'versionId', 'target'],
                    properties: {
                        name: { type: 'string', example: 'معدل التحويل' },
                        nameAr: { type: 'string' },
                        description: { type: 'string' },
                        target: { type: 'number', example: 85 },
                        unit: { type: 'string', default: '%' },
                        versionId: { type: 'string' },
                        objectiveId: { type: 'string' },
                        frequency: { type: 'string', default: 'MONTHLY' }
                    }
                },

                // ──── Initiative ────
                Initiative: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        title: { type: 'string', example: 'إطلاق تطبيق الجوال' },
                        description: { type: 'string', nullable: true },
                        status: { type: 'string', enum: ['PLANNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'] },
                        progress: { type: 'number', example: 65 },
                        budget: { type: 'number', nullable: true },
                        priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
                        owner: { type: 'string', nullable: true },
                        startDate: { type: 'string', format: 'date-time', nullable: true },
                        endDate: { type: 'string', format: 'date-time', nullable: true },
                        versionId: { type: 'string' }
                    }
                },

                // ──── Assessment ────
                Assessment: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        title: { type: 'string', example: 'تقييم Q1 2026' },
                        description: { type: 'string', nullable: true },
                        status: { type: 'string', enum: ['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED'] },
                        entityId: { type: 'string' },
                        computedScore: { type: 'number', example: 72.5 },
                        computedGrade: { type: 'string', example: 'B' }
                    }
                },

                // ──── Plan Limits ────
                PlanLimits: {
                    type: 'object',
                    properties: {
                        plan: { type: 'string', example: 'TRIAL' },
                        planName: { type: 'string', example: 'مجاني' },
                        status: { type: 'string' },
                        resources: {
                            type: 'object',
                            additionalProperties: {
                                type: 'object',
                                properties: {
                                    label: { type: 'string' },
                                    limit: { oneOf: [{ type: 'integer' }, { type: 'string', example: 'unlimited' }] },
                                    current: { type: 'integer' },
                                    remaining: { oneOf: [{ type: 'integer' }, { type: 'string' }] },
                                    percentage: { type: 'integer' },
                                    blocked: { type: 'boolean' }
                                }
                            }
                        }
                    }
                },

                // ──── Error Responses ────
                Error: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        error: { type: 'string', example: 'وصف الخطأ' }
                    }
                },
                PlanLimitError: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        errorCode: { type: 'string', example: 'PLAN_LIMIT_REACHED' },
                        message: { type: 'string', example: 'وصلت للحد الأقصى من مؤشرات الأداء (3) في باقة TRIAL' },
                        upgradeUrl: { type: 'string', example: '/pricing.html?highlight=TRIAL&resource=maxKpis' },
                        details: {
                            type: 'object',
                            properties: {
                                resource: { type: 'string' },
                                resourceLabel: { type: 'string' },
                                currentUsage: { type: 'integer' },
                                limit: { type: 'integer' },
                                plan: { type: 'string' }
                            }
                        }
                    }
                },

                // ──── Pagination ────
                Pagination: {
                    type: 'object',
                    properties: {
                        total: { type: 'integer', example: 42 },
                        page: { type: 'integer', example: 1 },
                        limit: { type: 'integer', example: 10 },
                        totalPages: { type: 'integer', example: 5 }
                    }
                }
            }
        },
        security: [{ bearerAuth: [] }],
        tags: [
            { name: 'Auth', description: '🔐 المصادقة — تسجيل الدخول والتسجيل والتحقق' },
            { name: 'Users', description: '👤 المستخدمون — إدارة الحسابات والملفات الشخصية' },
            { name: 'Entities', description: '🏢 الكيانات — الشركات والمنظمات' },
            { name: 'Companies', description: '🏛️ الشركات — الشركة الأم والاشتراكات' },
            { name: 'Strategy', description: '🎯 الاستراتيجية — الأهداف والمؤشرات والمبادرات' },
            { name: 'Assessments', description: '📋 التقييمات — التقييم والأبعاد والمعايير' },
            { name: 'KPI Entries', description: '📊 إدخالات المؤشرات — البيانات الدورية' },
            { name: 'Versions', description: '📁 إصدارات الاستراتيجية — إدارة الخطط' },
            { name: 'Reviews', description: '🔍 المراجعات — المراجعات الدورية والقرارات' },
            { name: 'Analysis', description: '📈 التحليل — SWOT والتحليل البيئي' },
            { name: 'AI Advisor', description: '🤖 المستشار الذكي — التوصيات والتنبيهات' },
            { name: 'Alerts', description: '🔔 التنبيهات — محرك التنبيهات الآلي' },
            { name: 'Plan Limits', description: '📊 حدود الباقة — الاستهلاك والترقية' },
            { name: 'Admin', description: '⚙️ الإدارة — لوحة المشرف (SUPER_ADMIN فقط)' },
            { name: 'Integrations', description: '🔗 التكاملات — Webhooks وربط الأنظمة' },
            { name: 'Import/Export', description: '📤 الاستيراد والتصدير — Excel وCSV' },
        ]
    },
    apis: ['./routes/*.js']
};

const specs = swaggerJsdoc(options);

const setupSwagger = (app) => {
    // واجهة Swagger UI التفاعلية
    app.use('/swagger', swaggerUi.serve, swaggerUi.setup(specs, {
        explorer: true,
        customCss: `
            /* === RTL Support === */
            html, body { direction: rtl; }
            .swagger-ui { direction: rtl; font-family: 'Tajawal', 'Segoe UI', sans-serif; }
            .swagger-ui .topbar { display: none; }
            .swagger-ui .info .title { font-size: 2rem; text-align: right; }
            .swagger-ui .info { text-align: right; }
            .swagger-ui .info .description { text-align: right; direction: rtl; }
            .swagger-ui .info .description p { text-align: right; }
            .swagger-ui .info .description li { text-align: right; }
            .swagger-ui .info .description table { direction: rtl; }
            .swagger-ui .info .description table th,
            .swagger-ui .info .description table td { text-align: right; }

            /* Tags & Operations */
            .swagger-ui .opblock-tag { direction: rtl; text-align: right; flex-direction: row-reverse; }
            .swagger-ui .opblock-tag small { margin-right: 10px; margin-left: auto; }
            .swagger-ui .opblock-tag svg { margin-left: 0; margin-right: 10px; }
            .swagger-ui .opblock .opblock-summary { direction: rtl; flex-direction: row-reverse; }
            .swagger-ui .opblock .opblock-summary-method { margin-left: 10px; margin-right: 0; }
            .swagger-ui .opblock .opblock-summary-description { text-align: right; }

            /* Parameters & Responses */
            .swagger-ui .parameters-col_description { text-align: right; }
            .swagger-ui .parameter__name { text-align: right; }
            .swagger-ui .response-col_description { text-align: right; }
            .swagger-ui table thead tr th { text-align: right; }
            .swagger-ui table tbody tr td { text-align: right; }
            .swagger-ui .responses-inner h4, .swagger-ui .responses-inner h5 { text-align: right; }

            /* Keep code blocks LTR */
            .swagger-ui .opblock-summary-path { direction: ltr; text-align: left; }
            .swagger-ui .microlight, .swagger-ui code, .swagger-ui pre { direction: ltr; text-align: left; }
            .swagger-ui .response-col_status { direction: ltr; }
            .swagger-ui .opblock-summary-path__deprecated { direction: ltr; }
            .swagger-ui input, .swagger-ui textarea, .swagger-ui select { direction: ltr; text-align: left; }

            /* Authorize button */
            .swagger-ui .btn.authorize { background: #667eea; border-color: #667eea; }
            .swagger-ui .btn.authorize svg { fill: #fff; }
            .swagger-ui .auth-wrapper { direction: rtl; }
            .swagger-ui .auth-wrapper .authorize { margin-left: 0; margin-right: auto; }

            /* Servers */
            .swagger-ui .scheme-container { direction: rtl; }
            .swagger-ui .servers > label { text-align: right; }
            .swagger-ui .servers > label select { direction: ltr; }

            /* Filter */
            .swagger-ui .filter-container { direction: rtl; }
            .swagger-ui .filter-container input { direction: rtl; text-align: right; }

            /* Models */
            .swagger-ui .model-box { direction: ltr; text-align: left; }
            .swagger-ui section.models { direction: rtl; }
            .swagger-ui section.models h4 { text-align: right; }
        `,
        customSiteTitle: 'Stratix API Docs — وثائق واجهة البرمجة',
        customfavIcon: '/favicon.ico',
        swaggerOptions: {
            persistAuthorization: true,
            docExpansion: 'none',
            filter: true,
            displayRequestDuration: true,
        }
    }));

    // JSON خام
    app.get('/swagger.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(specs);
    });

    console.log('📚 API Docs: http://localhost:3000/api-docs.html (مخصصة)');
    console.log('📚 Swagger:  http://localhost:3000/swagger (تفاعلية)');
};

module.exports = setupSwagger;
