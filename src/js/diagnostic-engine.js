/**
 * Startix — Diagnostic Engine v3.0
 * المحرك المركزي لتحديد المسار الاستراتيجي + الحزمة
 *
 * المبدأ:
 *   الحزمة = حجم المنشأة (سؤال Q4)
 *   المسار = كل الأسئلة التسعة مجتمعة (scoring system)
 *
 * المسارات المتاحة (5 فقط — لا كود ميّت):
 *   emergency_risk    → أزمة / سيولة حرجة
 *   nascent_cautious  → ناشئة / تأسيس
 *   growing_chaotic   → نمو سريع / تنظيم
 *   mature_competitive→ ناضجة / تميز
 *   default_strategic → شامل (الافتراضي)
 */

export const DiagnosticEngine = (function () {
    'use strict';

    // ═══════════════════════════════════════════════
    // 1. خريطة تحديد المسار — صاحب مشروع (Owner)
    //    يستخدم كل الـ 9 أسئلة عبر نظام نقاط
    // ═══════════════════════════════════════════════

    function determineOwnerPath(answers) {
        const { stage, entity_size, sector, fin, res, gov, scale, exit, dep } = answers;

        const sizeCategory = classifySize(entity_size);

        // ═══ نظام النقاط — كل سؤال يأثر على المسار ═══
        const scores = {
            emergency_risk: 0,
            nascent_cautious: 0,
            growing_chaotic: 0,
            mature_competitive: 0,
            default_strategic: 0,
        };

        // ── Q3: مرحلة المنشأة (stage) — أقوى مؤشر ──
        if (stage === 'struggle') scores.emergency_risk += 40;
        else if (stage === 'startup') scores.nascent_cautious += 35;
        else if (stage === 'scaling') scores.growing_chaotic += 30;
        else if (stage === 'stable') scores.mature_competitive += 25;

        // ── Q4: حجم الفريق (entity_size) ──
        if (entity_size === 'micro') scores.nascent_cautious += 15;
        else if (entity_size === 'small') scores.nascent_cautious += 10;
        else if (entity_size === 'medium') scores.growing_chaotic += 10;
        else if (entity_size === 'large') scores.mature_competitive += 10;

        // ── Q5: اعتمادية المالك (dep) ──
        if (dep === 'total') { scores.nascent_cautious += 10; scores.emergency_risk += 5; }
        else if (dep === 'high') scores.growing_chaotic += 5;
        else if (dep === 'low') scores.mature_competitive += 10;

        // ── Q6: تتبع مالي (fin) ──
        if (fin === 'none') { scores.emergency_risk += 15; scores.nascent_cautious += 5; }
        else if (fin === 'manual') scores.growing_chaotic += 5;
        else if (fin === 'good') scores.growing_chaotic += 5;
        else if (fin === 'perfect') scores.mature_competitive += 15;

        // ── Q7: السيولة (res) — مؤشر أزمة حاسم ──
        if (res === 'critical') scores.emergency_risk += 40;
        else if (res === 'low') scores.emergency_risk += 20;
        else if (res === 'mid') scores.growing_chaotic += 5;
        else if (res === 'high') scores.mature_competitive += 15;

        // ── Q8: الحوكمة (gov) ──
        if (gov === 'none') { scores.growing_chaotic += 15; scores.nascent_cautious += 5; }
        else if (gov === 'partial') scores.growing_chaotic += 10;
        else if (gov === 'system') scores.mature_competitive += 5;
        else if (gov === 'board') scores.mature_competitive += 15;

        // ── Q9: قابلية التكرار (scale) ──
        if (scale === 'none') scores.nascent_cautious += 5;
        else if (scale === 'mid') scores.growing_chaotic += 5;
        else if (scale === 'easy') scores.mature_competitive += 10;

        // ── Q10: استراتيجية الخروج (exit) ──
        if (exit === 'none') scores.nascent_cautious += 5;
        else if (exit === 'ipo' || exit === 'm_a') scores.mature_competitive += 10;
        else if (exit === 'family') scores.default_strategic += 5;

        // ═══ اختيار المسار الأعلى نقاطاً ═══
        let patternKey = 'default_strategic';
        let maxScore = scores.default_strategic;

        for (const [key, score] of Object.entries(scores)) {
            if (score > maxScore) {
                maxScore = score;
                patternKey = key;
            }
        }

        // ═══ حالة خاصة: إذا النقاط متقاربة جداً → الشامل أأمن ═══
        const sortedScores = Object.values(scores).sort((a, b) => b - a);
        if (sortedScores[0] - sortedScores[1] < 5 && patternKey !== 'emergency_risk') {
            patternKey = 'default_strategic';
        }

        // ═══ سبب الاختيار ═══
        const REASONS = {
            emergency_risk: 'تنبيه: المنشأة تمر بمرحلة حرجة. الأولوية القصوى لتأمين الوضع المالي وإدارة الأزمات.',
            nascent_cautious: 'المرحلة تتطلب بناء أساسات صلبة. المسار يوفر خارطة طريق للتأسيس المستدام.',
            growing_chaotic: 'النمو سريع لكن الأنظمة تحتاج تطوير. المسار يركز على الهيكلة والتنظيم.',
            mature_competitive: 'المنشأة ناضجة ومستقرة. المسار يركز على الابتكار والتميز التنافسي.',
            default_strategic: 'مسار تطوير استراتيجي شامل يغطي كل جوانب المنشأة.',
        };

        // ═══ بيانات القطاع ═══
        const SECTOR_DATA = {
            service: { name: 'القطاع الخدمي', emoji: '💼', color: '#3b82f6' },
            commercial: { name: 'القطاع التجاري', emoji: '🏪', color: '#f59e0b' },
            industrial: { name: 'القطاع الصناعي', emoji: '🏭', color: '#10b981' },
            gov: { name: 'القطاع الحكومي', emoji: '🏛️', color: '#ef4444' },
            sectoral: { name: 'القطاعي / شبه حكومي', emoji: '🤝', color: '#8b5cf6' },
            non_profit: { name: 'قطاع غير ربحي', emoji: '🤲', color: '#6366f1' }
        };

        const sd = SECTOR_DATA[sector] || SECTOR_DATA.service;

        return {
            category: 'owner',
            patternKey,
            reason: REASONS[patternKey],
            sizeCategory,
            scores, // نرجع النقاط للشفافية
            userType: 'OWNER',
            name: sd.name,
            emoji: sd.emoji,
            color: sd.color,
            dashboardPath: '/dashboard.html',
            answers: { ...answers, size: entity_size, maturity: stage }
        };
    }

    // ═══════════════════════════════════════════════
    // 2. خريطة تحديد المسار — مدير إدارة (Manager)
    // ═══════════════════════════════════════════════

    function determineManagerPath(answers) {
        const {
            department, teamSize, dept_governance, dept_kpi_tracking,
            digital_maturity, agility, innovation, challenge
        } = answers;

        const DEPT_MAP = {
            hr: { name: 'الموارد البشرية', emoji: '👥', color: '#8b5cf6', icon: 'bi-people-fill' },
            finance: { name: 'المالية', emoji: '💰', color: '#10b981', icon: 'bi-cash-coin' },
            marketing: { name: 'التسويق', emoji: '📢', color: '#f59e0b', icon: 'bi-megaphone-fill' },
            operations: { name: 'العمليات', emoji: '⚙️', color: '#6b7280', icon: 'bi-gear-wide-connected' },
            it: { name: 'تقنية المعلومات', emoji: '💻', color: '#3b82f6', icon: 'bi-cpu' },
            sales: { name: 'المبيعات', emoji: '🎯', color: '#f59e0b', icon: 'bi-bullseye' },
            logistics: { name: 'اللوجستيات', emoji: '🚚', color: '#6b7280', icon: 'bi-truck' },
            cs: { name: 'خدمة العملاء', emoji: '🎧', color: '#06b6d4', icon: 'bi-headset' },
            quality: { name: 'الجودة', emoji: '✅', color: '#14b8a6', icon: 'bi-patch-check-fill' },
            projects: { name: 'إدارة المشاريع', emoji: '📋', color: '#8b5cf6', icon: 'bi-kanban-fill' },
            compliance: { name: 'الامتثال', emoji: '⚖️', color: '#ef4444', icon: 'bi-shield-check' },
            governance: { name: 'الحوكمة', emoji: '🏛️', color: '#0ea5e9', icon: 'bi-diagram-3-fill' }
        };

        let dept = DEPT_MAP[department] || DEPT_MAP.hr;

        let reason = `مسار متخصص لتحليل نضج إدارة ${dept.name} ورفع كفاءتها الاستراتيجية.`;
        if (dept_governance === 'none') reason = `تفتقد إدارة ${dept.name} للتوثيق الإجرائي؛ مما يسبب هدر الاستمرارية بدوران الكوادر.`;
        else if (dept_kpi_tracking === 'none' || dept_kpi_tracking === 'vague') reason = `تدار إدارة ${dept.name} بدون لوحة مؤشرات واضحة؛ المسار سيبني لك نظام قياس للأداء.`;

        return {
            category: 'manager',
            department: department || 'hr',
            userType: 'DEPT_MANAGER',
            name: dept.name,
            emoji: dept.emoji,
            color: dept.color,
            icon: dept.icon,
            dashboardPath: '/pro-dashboard.html',
            deptDeepPath: '/pro-dashboard.html',
            reason,
            sizeCategory: classifySize(teamSize),
            answers
        };
    }

    // ═══════════════════════════════════════════════
    // 3. دوال مساعدة
    // ═══════════════════════════════════════════════

    function classifySize(size) {
        if (!size) return 'medium';
        const s = String(size).toLowerCase();
        if (['micro', 'pico', 'small', 'أقل من ٥', 'أقل من ٣'].includes(s)) return 'small';
        if (['medium', '٢١-١٠٠ شخص', '١٠ - ٣٠', '٥-٢٠ شخص', '٣ - ١٠'].includes(s)) return 'medium';
        if (['large', 'أكثر من ١٠٠ شخص', 'أكثر من ٣٠'].includes(s)) return 'large';
        return 'medium';
    }

    function saveToSession(result) {
        try {
            sessionStorage.setItem('diagnosticResult', JSON.stringify(result));
            sessionStorage.setItem('diagnosticTimestamp', new Date().toISOString());
        } catch (e) { console.error('Engine Save Error:', e); }
    }

    function getFromSession() {
        try {
            const raw = sessionStorage.getItem('diagnosticResult');
            if (!raw) return null;
            const res = JSON.parse(raw);
            const ts = sessionStorage.getItem('diagnosticTimestamp');
            if (ts && (new Date() - new Date(ts)) > 24 * 60 * 60 * 1000) return null;
            return res;
        } catch (e) { return null; }
    }

    function clearSession() {
        sessionStorage.removeItem('diagnosticResult');
        sessionStorage.removeItem('diagnosticTimestamp');
    }

    function promoteToLocalStorage() {
        try {
            const res = getFromSession();
            if (!res) return false;

            if (res.patternKey) {
                localStorage.setItem('painAmbition', JSON.stringify({
                    patternKey: res.patternKey,
                    category: res.category,
                    sizeCategory: res.sizeCategory,
                    diagnosticAnswers: res.answers,
                    diagnosticDate: new Date().toISOString()
                }));
            }

            localStorage.setItem('stratix_diagnostic_payload', JSON.stringify(res));

            if (res.category === 'manager') {
                localStorage.setItem('stratix_user_type', 'DEPT_MANAGER');
                localStorage.setItem('stratix_dept', res.department);
            } else {
                localStorage.setItem('stratix_user_type', 'BUSINESS');
            }

            return true;
        } catch (e) { return false; }
    }

    return {
        determineOwnerPath,
        determineManagerPath,
        saveToSession,
        getFromSession,
        promoteToLocalStorage,
        clearSession,
        classifySize,
        VERSION: '3.0.0'
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DiagnosticEngine;
}
