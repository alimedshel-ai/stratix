/**
 * Stratix — Diagnostic Engine v1.0
 * المحرك المركزي لتحديد المسار الاستراتيجي بناءً على إجابات المستخدم
 * 
 * يستخدم من:
 *   - diagnostic-owner.html (صاحب مشروع — 6 أسئلة)
 *   - diagnostic-manager.html (مدير إدارة — 5 أسئلة)
 *   - diagnostic-investor.html (مستثمر — 3 أسئلة)
 *   - diagnostic-result.html (عرض النتيجة)
 * 
 * يحفظ في:
 *   - sessionStorage: selectedPath, diagnosticAnswers, diagnosticCategory (مؤقت)
 *   - localStorage (بعد التسجيل): painAmbition + stratix_diagnostic_payload (dual-write)
 */

const DiagnosticEngine = (function () {
    'use strict';

    // ═══════════════════════════════════════════
    // 1. خريطة تحديد المسار — صاحب مشروع
    // ═══════════════════════════════════════════

    /**
     * تحديد المسار لصاحب المشروع بناءً على 6 إجابات
     * @param {Object} answers - { activity, maturity, size, challenge, ambition, organization }
     * @returns {Object} { patternKey, reason, sizeCategory }
     */
    function determineOwnerPath(answers) {
        const { maturity, size, challenge, ambition, organization } = answers;

        // تصنيف الحجم
        const sizeCategory = classifySize(size);

        // ═══ تحويل التحدي لمصفوفة (دعم الاختيار المتعدد) ═══
        const challenges = Array.isArray(challenge) ? challenge : [challenge];
        const isMulti = challenges.length > 1;

        // ═══ قواعد Override — أولوية قصوى ═══

        // أزمة؟ → مباشرة مسار الأزمات
        if (challenges.includes('crisis')) {
            return {
                patternKey: 'emergency_risk',
                reason: 'شركتك تمر بأزمة أو تهديد. الأولوية لإدارة المخاطر وتأمين الوضع.',
                sizeCategory
            };
        }

        // ═══ تحديات متعددة → توجيه ذكي ═══
        if (isMulti) {
            const hasFinancial = challenges.includes('financial');
            const hasOrganizational = challenges.includes('organizational');

            // مالي + إداري → شامل
            if (hasFinancial && hasOrganizational) {
                return {
                    patternKey: 'default_strategic',
                    reason: 'الجمع بين التحديات المالية والإدارية يتطلب مسار استراتيجي شامل يغطي كل الجوانب.',
                    sizeCategory
                };
            }

            // مالي + أي تحدي آخر → شامل
            if (hasFinancial) {
                return {
                    patternKey: 'default_strategic',
                    reason: 'التحديات المالية مع تحديات أخرى تتطلب مسار شامل لمعالجة كل الجوانب.',
                    sizeCategory
                };
            }

            // تحديات نمو فقط (بدون مالي) → مسار النمو حسب النضج
            if (maturity === 'nascent') {
                return {
                    patternKey: 'nascent_cautious',
                    reason: 'شركة ناشئة تواجه تحديات نمو متعددة. المسار يبني الأساسيات الصحيحة.',
                    sizeCategory
                };
            }
            if (maturity === 'growing') {
                if (hasOrganizational) {
                    return {
                        patternKey: 'growing_chaotic',
                        reason: 'تحديات إدارية متعددة في مرحلة النمو. المسار يعيد الهيكلة والتنظيم.',
                        sizeCategory
                    };
                }
                return {
                    patternKey: 'growing_ambitious',
                    reason: 'تحديات نمو متعددة. المسار يبني ميزة تنافسية ويحسّن الأداء.',
                    sizeCategory
                };
            }
            // ناضجة + تحديات متعددة بدون مالي
            if (ambition === 'lead') {
                return {
                    patternKey: 'mature_competitive',
                    reason: 'شركة ناضجة تسعى للريادة مع تحديات متعددة. مسار التميز المتقدم.',
                    sizeCategory
                };
            }
            return {
                patternKey: 'default_strategic',
                reason: 'تحديات متعددة تتطلب مسار شامل للتطوير الإداري.',
                sizeCategory
            };
        }

        // ═══ تحدي واحد — المنطق الأصلي ═══
        const singleChallenge = challenges[0];

        // ═══ ناشئة (أقل من سنتين) ═══
        if (maturity === 'nascent') {
            if (singleChallenge === 'financial' || ambition === 'survive') {
                return {
                    patternKey: 'nascent_struggling',
                    reason: 'شركة ناشئة تواجه تحدي مالي. المسار يركز على البقاء والاستقرار المالي أولاً.',
                    sizeCategory
                };
            }
            return {
                patternKey: 'nascent_cautious',
                reason: 'شركة ناشئة واعدة. المسار يبني الأساسيات الصحيحة من البداية.',
                sizeCategory
            };
        }

        // ═══ نامية (2-5 سنوات) ═══
        if (maturity === 'growing') {
            if (singleChallenge === 'organizational') {
                return {
                    patternKey: 'growing_chaotic',
                    reason: 'الشركة تنمو لكن بفوضى تنظيمية. المسار يعيد الهيكلة والتنظيم.',
                    sizeCategory
                };
            }
            if (singleChallenge === 'financial') {
                return {
                    patternKey: 'financial_struggling',
                    reason: 'الشركة تنمو لكن الوضع المالي يحتاج إنقاذ. المسار يركز على التدفقات والربحية.',
                    sizeCategory
                };
            }
            if (singleChallenge === 'competitive') {
                return {
                    patternKey: 'growing_ambitious',
                    reason: 'الشركة تنمو وجاهزة للتميز. المسار يبني ميزة تنافسية واضحة.',
                    sizeCategory
                };
            }
            if (singleChallenge === 'operational') {
                return {
                    patternKey: 'operational_tactical',
                    reason: 'العمليات تحتاج تحسين وكفاءة أعلى. المسار يحسّن الأداء التشغيلي.',
                    sizeCategory
                };
            }
            // default growing
            return {
                patternKey: 'growing_chaotic',
                reason: 'شركة نامية تحتاج هيكلة أفضل لدعم النمو.',
                sizeCategory
            };
        }

        // ═══ ناضجة (5+ سنوات) ═══
        if (maturity === 'mature') {
            if (singleChallenge === 'competitive' && ambition === 'lead') {
                return {
                    patternKey: 'mature_competitive',
                    reason: 'شركة ناضجة تسعى لقيادة السوق. المسار يعزز التميز والريادة.',
                    sizeCategory
                };
            }
            if (singleChallenge === 'organizational') {
                return {
                    patternKey: 'growing_chaotic',
                    reason: 'الشركة ناضجة لكن تحتاج إعادة هيكلة لمرحلة جديدة.',
                    sizeCategory
                };
            }
            if (singleChallenge === 'financial') {
                return {
                    patternKey: 'financial_struggling',
                    reason: 'شركة ناضجة تواجه ضغط مالي. المسار يعيد الاستقرار.',
                    sizeCategory
                };
            }
            if (singleChallenge === 'operational') {
                return {
                    patternKey: 'operational_tactical',
                    reason: 'شركة ناضجة تحتاج تحسين تشغيلي وتحول رقمي.',
                    sizeCategory
                };
            }
            // ناضجة + أي تحدي + طموح ريادة
            if (ambition === 'lead') {
                return {
                    patternKey: 'mature_competitive',
                    reason: 'شركة ناضجة تسعى للريادة. المسار الاستراتيجي الشامل.',
                    sizeCategory
                };
            }
            // default mature
            return {
                patternKey: 'default_strategic',
                reason: 'شركة ناضجة. المسار الشامل يغطي كل الجوانب الاستراتيجية.',
                sizeCategory
            };
        }

        // ═══ Fallback ═══
        return {
            patternKey: 'default_strategic',
            reason: 'المسار الشامل يغطي كل احتياجاتك الاستراتيجية.',
            sizeCategory
        };
    }

    // ═══════════════════════════════════════════
    // 2. خريطة تحديد المسار — مدير إدارة
    // ═══════════════════════════════════════════

    /**
     * تحديد المسار لمدير الإدارة
     * @param {Object} answers - { department, teamSize, challenge, priority }
     * @returns {Object} { department, dashboardPath, reason, steps }
     */
    function determineManagerPath(answers) {
        const { department, teamSize, challenge, priority } = answers;

        const DEPT_MAP = {
            hr: {
                name: 'الموارد البشرية',
                emoji: '👥',
                icon: 'bi-people-fill',
                color: '#8b5cf6',
                dashboardPath: '/dept-dashboard.html',
                deptDeepPath: '/dept-deep.html?dept=hr&single=1',
                reason: 'مسار متخصص لإدارة الموارد البشرية — تقييم أداء، هيكلة، تطوير الفريق.',
                steps: [
                    { num: 1, label: 'تشخيص سريع', href: '/dept-diagnostic.html?dept=hr', icon: 'bi-lightning-charge-fill' },
                    { num: 2, label: 'التحليل العميق', href: '/dept-deep.html?dept=hr&single=1', icon: 'bi-search-heart' },
                    { num: 3, label: 'خطة التحسين', href: '/dept-dashboard.html', icon: 'bi-graph-up-arrow' },
                ]
            },
            finance: {
                name: 'المالية',
                emoji: '💰',
                icon: 'bi-cash-coin',
                color: '#10b981',
                dashboardPath: '/dept-dashboard.html',
                deptDeepPath: '/dept-deep.html?dept=finance&single=1',
                reason: 'مسار متخصص للإدارة المالية — تحليل مالي، ميزانيات، تدفقات.',
                steps: [
                    { num: 1, label: 'تشخيص سريع', href: '/dept-diagnostic.html?dept=finance', icon: 'bi-lightning-charge-fill' },
                    { num: 2, label: 'التحليل العميق', href: '/dept-deep.html?dept=finance&single=1', icon: 'bi-search-heart' },
                    { num: 3, label: 'خطة التحسين', href: '/dept-dashboard.html', icon: 'bi-graph-up-arrow' },
                ]
            },
            marketing: {
                name: 'التسويق',
                emoji: '📢',
                icon: 'bi-megaphone-fill',
                color: '#f59e0b',
                dashboardPath: '/dept-dashboard.html',
                deptDeepPath: '/dept-deep.html?dept=marketing&single=1',
                reason: 'مسار متخصص لإدارة التسويق — خطة تسويق، حملات، مؤشرات.',
                steps: [
                    { num: 1, label: 'تشخيص سريع', href: '/dept-diagnostic.html?dept=marketing', icon: 'bi-lightning-charge-fill' },
                    { num: 2, label: 'التحليل العميق', href: '/dept-deep.html?dept=marketing&single=1', icon: 'bi-search-heart' },
                    { num: 3, label: 'خطة التحسين', href: '/dept-dashboard.html', icon: 'bi-graph-up-arrow' },
                ]
            },
            operations: {
                name: 'العمليات',
                emoji: '⚙️',
                icon: 'bi-gear-wide-connected',
                color: '#6b7280',
                dashboardPath: '/dept-dashboard.html',
                deptDeepPath: '/dept-deep.html?dept=operations&single=1',
                reason: 'مسار متخصص لإدارة العمليات — تحسين إجراءات، جودة.',
                steps: [
                    { num: 1, label: 'تشخيص سريع', href: '/dept-diagnostic.html?dept=operations', icon: 'bi-lightning-charge-fill' },
                    { num: 2, label: 'التحليل العميق', href: '/dept-deep.html?dept=operations&single=1', icon: 'bi-search-heart' },
                    { num: 3, label: 'خطة التحسين', href: '/dept-dashboard.html', icon: 'bi-graph-up-arrow' },
                ]
            },
            it: {
                name: 'التقنية',
                emoji: '💻',
                icon: 'bi-cpu',
                color: '#3b82f6',
                dashboardPath: '/dept-dashboard.html',
                deptDeepPath: '/dept-deep.html?dept=it&single=1',
                reason: 'مسار متخصص لإدارة التقنية — مشاريع تقنية، تحول رقمي.',
                steps: [
                    { num: 1, label: 'تشخيص سريع', href: '/dept-diagnostic.html?dept=it', icon: 'bi-lightning-charge-fill' },
                    { num: 2, label: 'التحليل العميق', href: '/dept-deep.html?dept=it&single=1', icon: 'bi-search-heart' },
                    { num: 3, label: 'خطة التحسين', href: '/dept-dashboard.html', icon: 'bi-graph-up-arrow' },
                ]
            },
            compliance: {
                name: 'الامتثال والحوكمة',
                emoji: '✅',
                icon: 'bi-shield-fill-check',
                color: '#ef4444',
                dashboardPath: '/dept-dashboard.html',
                deptDeepPath: '/dept-deep.html?dept=compliance&single=1',
                reason: 'مسار متخصص لإدارة الامتثال — مخاطر، حوكمة.',
                steps: [
                    { num: 1, label: 'تشخيص سريع', href: '/dept-diagnostic.html?dept=compliance', icon: 'bi-lightning-charge-fill' },
                    { num: 2, label: 'التحليل العميق', href: '/dept-deep.html?dept=compliance&single=1', icon: 'bi-search-heart' },
                    { num: 3, label: 'خطة التحسين', href: '/dept-dashboard.html', icon: 'bi-graph-up-arrow' },
                ]
            },
        };

        const dept = DEPT_MAP[department] || DEPT_MAP.hr;

        return {
            category: 'manager',
            department,
            userType: 'DEPT_MANAGER',
            name: dept.name,
            emoji: dept.emoji,
            icon: dept.icon,
            color: dept.color,
            dashboardPath: dept.dashboardPath,
            deptDeepPath: dept.deptDeepPath,
            reason: dept.reason,
            steps: dept.steps,
            answers: { department, teamSize, challenge, priority }
        };
    }

    // ═══════════════════════════════════════════
    // 3. خريطة تحديد المسار — مستثمر
    // ═══════════════════════════════════════════

    /**
     * تحديد المسار للمستثمر
     * @param {Object} answers - { scope, reportType, frequency }
     * @returns {Object} { scope, dashboardPath, reason }
     */
    function determineInvestorPath(answers) {
        const { scope, reportType, frequency } = answers;

        const SCOPE_MAP = {
            single: {
                name: 'مراقبة شركة واحدة',
                emoji: '📈',
                dashboardPath: '/investor-dashboard.html',
                reason: 'لوحة مستثمر مخصصة لمتابعة فرصة واحدة مع مؤشرات أداء وتقارير دورية.',
            },
            multi: {
                name: 'مراقبة عدة شركات',
                emoji: '📊',
                dashboardPath: '/investor-dashboard.html',
                reason: 'لوحة مستثمر متعددة الشركات مع مقارنات ومحفظة استثمارية.',
            },
            board: {
                name: 'مجلس إدارة',
                emoji: '📋',
                dashboardPath: '/board-dashboard.html',
                reason: 'لوحة مجلس إدارة متكاملة مع تقارير حوكمة واجتماعات.',
            },
        };

        const s = SCOPE_MAP[scope] || SCOPE_MAP.single;

        return {
            category: 'investor',
            scope,
            userType: 'COMPANY_MANAGER',
            name: s.name,
            emoji: s.emoji,
            dashboardPath: s.dashboardPath,
            reason: s.reason,
            answers: { scope, reportType, frequency }
        };
    }

    // ═══════════════════════════════════════════
    // 4. دوال مساعدة
    // ═══════════════════════════════════════════

    /**
     * تصنيف الحجم
     */
    function classifySize(size) {
        if (!size) return 'small';
        const n = typeof size === 'number' ? size : parseInt(size, 10);
        if (isNaN(n)) {
            // القيم النصية
            if (size === 'micro' || size === '1-5') return 'small';
            if (size === 'small' || size === '6-30') return 'small';
            if (size === 'medium' || size === '31-200') return 'medium';
            if (size === 'large' || size === '200+') return 'large';
            return 'small';
        }
        if (n <= 30) return 'small';
        if (n <= 200) return 'medium';
        return 'large';
    }

    /**
     * وصف المسار حسب الحجم (sizeVariant)
     * يضيف لمسة تخصيص نصية بدون تعقيد 22 مسار
     */
    function getSizeVariant(patternKey, sizeCategory) {
        const VARIANTS = {
            growing_chaotic: {
                small: { subtitle: 'نسخة مبسطة — تنظيم أساسي', tip: 'ركّز على الهيكلة البسيطة أولاً' },
                medium: { subtitle: 'هيكلة إدارات وفرق', tip: 'حدد المسؤوليات واللجان' },
                large: { subtitle: 'إعادة هيكلة قطاعات', tip: 'اعتمد إطار حوكمة شامل' },
            },
            financial_struggling: {
                small: { subtitle: 'تركيز على التدفقات', tip: 'راقب المصروفات اليومية أولاً' },
                medium: { subtitle: 'إعادة جدولة ديون', tip: 'ابدأ بتحليل نقطة التعادل' },
                large: { subtitle: 'هيكلة رأسمال', tip: 'افحص البدائل التمويلية المتاحة' },
            },
            growing_ambitious: {
                small: { subtitle: 'نمو تدريجي', tip: 'ابدأ بتمييز منتج واحد' },
                medium: { subtitle: 'دخول أسواق جديدة', tip: 'حلل الفجوات التنافسية في كل سوق' },
                large: { subtitle: 'تحالفات استراتيجية', tip: 'ابحث عن شراكات تكميلية' },
            },
            operational_tactical: {
                small: { subtitle: 'إجراءات بسيطة', tip: 'أتمت العمليات المتكررة' },
                medium: { subtitle: 'أتمتة عمليات', tip: 'حدد أكبر 5 اختناقات تشغيلية' },
                large: { subtitle: 'تحول رقمي شامل', tip: 'اعتمد مؤشرات OEE لكل قسم' },
            },
            emergency_risk: {
                small: { subtitle: 'خطط طوارئ بسيطة', tip: 'جهّز خطة بديلة لأسوأ 3 سيناريوهات' },
                medium: { subtitle: 'سيناريوهات متقدمة', tip: 'فعّل لجنة أزمات وحدد المسؤوليات' },
                large: { subtitle: 'إدارة سمعة وأزمات', tip: 'اعتمد BCP وخطط استمرارية الأعمال' },
            },
            nascent_struggling: {
                small: { subtitle: 'إنقاذ سريع للناشئة', tip: 'ركّز على الربحية قبل أي توسع' },
                medium: { subtitle: 'استقرار مالي', tip: 'حلل مصادر الإيراد واقطع غير المجدي' },
                large: { subtitle: 'تثبيت القاعدة', tip: 'اعتمد ميزانية صفرية' },
            },
            nascent_cautious: {
                small: { subtitle: 'بناء مستدام', tip: 'ابنِ العمليات الأساسية قبل التوسع' },
                medium: { subtitle: 'تسريع النمو', tip: 'حدد 3 عوامل نمو رئيسية' },
                large: { subtitle: 'توسع ذكي', tip: 'اعتمد إطار OKR لتنسيق الفرق' },
            },
            mature_competitive: {
                small: { subtitle: 'تجديد استراتيجي', tip: 'أعد تقييم نموذج الأعمال' },
                medium: { subtitle: 'قيادة السوق', tip: 'استثمر في الابتكار والبحث' },
                large: { subtitle: 'ريادة متقدمة واستشراف', tip: 'ابنِ فريق استشراف مستقبلي' },
            },
            mature_renewing: {
                small: { subtitle: 'تجديد مبسط', tip: 'أعد تقييم نموذج الأعمال الحالي' },
                medium: { subtitle: 'إعادة ابتكار', tip: 'استكشف فرص النمو الجديدة' },
                large: { subtitle: 'تحول استراتيجي شامل', tip: 'اعتمد إطار إدارة التغيير' },
            },
            default_strategic: {
                small: { subtitle: 'مسار شامل مخفف', tip: 'ركّز على الأولويات القصوى أولاً' },
                medium: { subtitle: 'مسار شامل متوازن', tip: 'وزّع الجهد على كل المراحل' },
                large: { subtitle: 'مسار شامل متقدم يدمج كل الأدوات', tip: 'اعتمد فريق متعدد التخصصات' },
            },
            golden_express: {
                small: { subtitle: 'المسار الذهبي المبسط', tip: 'أكمل الخطوات بالترتيب' },
                medium: { subtitle: 'المسار الذهبي المتوازن', tip: 'استثمر وقت كافي في كل مرحلة' },
                large: { subtitle: 'المسار الذهبي الشامل', tip: 'فعّل فريق لكل مرحلة' },
            },
            dept_deep: {
                small: { subtitle: 'تحليل وظيفي مبسط', tip: 'ركّز على القسم الأهم أولاً' },
                medium: { subtitle: 'تحليل وظيفي شامل', tip: 'حلل كل الأقسام بالتتابع' },
                large: { subtitle: 'تحليل وظيفي متقدم', tip: 'اعتمد معايير ISO لكل قسم' },
            },
        };

        const pathVariants = VARIANTS[patternKey];
        if (!pathVariants) return { subtitle: '', tip: '' };
        return pathVariants[sizeCategory] || pathVariants.medium || { subtitle: '', tip: '' };
    }

    // ═══════════════════════════════════════════
    // 5. حفظ واسترجاع النتائج
    // ═══════════════════════════════════════════

    /**
     * حفظ نتيجة التشخيص في sessionStorage (مؤقت — قبل التسجيل)
     */
    function saveToSession(result) {
        try {
            sessionStorage.setItem('diagnosticResult', JSON.stringify(result));
            sessionStorage.setItem('diagnosticTimestamp', new Date().toISOString());
        } catch (e) {
            console.warn('DiagnosticEngine: failed to save to sessionStorage', e);
        }
    }

    /**
     * استرجاع نتيجة التشخيص من sessionStorage
     */
    function getFromSession() {
        try {
            const raw = sessionStorage.getItem('diagnosticResult');
            if (!raw) return null;

            const result = JSON.parse(raw);

            // تحقق من صلاحية (24 ساعة)
            const ts = sessionStorage.getItem('diagnosticTimestamp');
            if (ts) {
                const age = Date.now() - new Date(ts).getTime();
                if (age > 24 * 60 * 60 * 1000) {
                    clearSession();
                    return null;
                }
            }

            return result;
        } catch (e) {
            return null;
        }
    }

    /**
     * نقل البيانات من sessionStorage → localStorage (بعد التسجيل الناجح)
     * Dual-write: painAmbition + stratix_diagnostic_payload
     */
    function promoteToLocalStorage() {
        try {
            const result = getFromSession();
            if (!result) return false;

            // ═══ الكتابة الأولى: painAmbition (لـ path-engine.js) ═══
            if (result.patternKey) {
                const painAmbition = {
                    patternKey: result.patternKey,
                    category: result.category || 'owner',
                    sizeCategory: result.sizeCategory || 'medium',
                    reason: result.reason || '',
                    diagnosticAnswers: result.answers || {},
                    diagnosticDate: new Date().toISOString(),
                };
                localStorage.setItem('painAmbition', JSON.stringify(painAmbition));
            }

            // ═══ الكتابة الثانية: stratix_diagnostic_payload (لـ sidebar.js القديم) ═══
            const v10Payload = {
                role: result.category === 'owner' ? 'founder' : (result.category === 'manager' ? 'manager' : 'board'),
                size: result.sizeCategory || 'medium',
                department: result.department || '',
                answers: result.answers || {},
                completedAt: new Date().toISOString(),
            };
            localStorage.setItem('stratix_diagnostic_payload', JSON.stringify(v10Payload));

            // ═══ الكتابة الثالثة: stratix_category + stratix_user_type (لـ login.html) ═══
            if (result.category === 'manager') {
                localStorage.setItem('stratix_category', 'DEPT_' + (result.department || 'hr').toUpperCase());
                localStorage.setItem('stratix_user_type', 'DEPT_MANAGER');
                localStorage.setItem('stratix_dept', result.department || 'hr');
            } else if (result.category === 'investor') {
                localStorage.setItem('stratix_category', 'BUSINESS');
                localStorage.setItem('stratix_user_type', 'BUSINESS');
            } else {
                localStorage.setItem('stratix_category', 'BUSINESS');
                localStorage.setItem('stratix_user_type', 'BUSINESS');
            }

            // تنظيف sessionStorage بعد النقل
            clearSession();
            return true;
        } catch (e) {
            console.error('DiagnosticEngine: promoteToLocalStorage failed', e);
            return false;
        }
    }

    /**
     * تنظيف بيانات التشخيص المؤقتة
     */
    function clearSession() {
        sessionStorage.removeItem('diagnosticResult');
        sessionStorage.removeItem('diagnosticTimestamp');
    }

    /**
     * أول صفحة في المسار (للتوجيه بعد التسجيل)
     */
    function getFirstPage(result) {
        if (!result) return '/dashboard.html';

        // مدير إدارة → لوحة الإدارة
        if (result.category === 'manager') {
            return result.dashboardPath || '/dept-dashboard.html';
        }

        // مستثمر → لوحته المناسبة
        if (result.category === 'investor') {
            return result.dashboardPath || '/dashboard.html';
        }

        // صاحب مشروع → أول أداة في المسار من path-engine
        if (result.patternKey && typeof PathEngine !== 'undefined') {
            const def = PathEngine.PATH_DEFINITIONS[result.patternKey];
            if (def && def.steps && def.steps.length > 0) {
                return def.steps[0].href;
            }
        }

        // Fallback
        return '/dashboard.html';
    }

    // ═══════════════════════════════════════════
    // 6. الواجهة العامة
    // ═══════════════════════════════════════════

    return {
        // محركات التحديد
        determineOwnerPath,
        determineManagerPath,
        determineInvestorPath,

        // أدوات مساعدة
        classifySize,
        getSizeVariant,
        getFirstPage,

        // التخزين
        saveToSession,
        getFromSession,
        promoteToLocalStorage,
        clearSession,

        // Aliases for compatibility
        classifyOwner: determineOwnerPath,

        // الإصدار
        VERSION: '1.0.0',
    };
})();

// تصدير لـ Node.js (للاختبارات)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DiagnosticEngine;
}
