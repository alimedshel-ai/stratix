/**
 * ═══════════════════════════════════════════
 *  Smart Context — Phase 13D
 *  النظام يتذكر آخر حالة ويستجيب عند الدخول
 *  "مرحباً — أكملت PESTEL أمس. الخطوة التالية: Porter"
 * ═══════════════════════════════════════════
 */
const SmartContext = (() => {
    'use strict';

    const STORAGE_KEY = 'stratix_user_context';

    // ── Track user activity ──
    function track(action, meta = {}) {
        const ctx = load();
        const entry = {
            action,          // 'page_visit', 'tool_progress', 'decision', 'analysis_complete'
            page: window.location.pathname,
            timestamp: new Date().toISOString(),
            ...meta
        };

        // Update last action
        ctx.lastAction = entry;

        // Track session
        ctx.sessionCount = (ctx.sessionCount || 0);
        const today = new Date().toDateString();
        if (ctx.lastSessionDate !== today) {
            ctx.sessionCount++;
            ctx.lastSessionDate = today;
        }

        // Track page visits (last 20)
        if (!ctx.recentPages) ctx.recentPages = [];
        ctx.recentPages.unshift({
            path: window.location.pathname,
            title: document.title,
            time: new Date().toISOString()
        });
        ctx.recentPages = ctx.recentPages.slice(0, 20);

        // Track tool completions
        if (action === 'tool_complete' && meta.toolCode) {
            if (!ctx.completedTools) ctx.completedTools = [];
            if (!ctx.completedTools.includes(meta.toolCode)) {
                ctx.completedTools.push(meta.toolCode);
            }
        }

        // Track focus area
        if (meta.focusArea) {
            ctx.currentFocus = meta.focusArea;
        }

        save(ctx);
        return ctx;
    }

    // ── Generate welcome message ──
    function getWelcomeMessage() {
        const ctx = load();
        const hour = new Date().getHours();
        const greeting = hour < 12 ? 'صباح الخير' : hour < 17 ? 'مساء الخير' : 'مساء النور';

        // First time user
        if (!ctx.lastAction) {
            return {
                greeting,
                message: 'مرحباً بك في ستارتكس! ابدأ رحلتك الاستراتيجية',
                suggestion: null,
                icon: '👋'
            };
        }

        const lastPage = ctx.lastAction.page || '';
        const lastTime = ctx.lastAction.timestamp ? new Date(ctx.lastAction.timestamp) : null;
        const hoursSince = lastTime ? (Date.now() - lastTime.getTime()) / (1000 * 60 * 60) : 999;

        // Returning within same day
        if (hoursSince < 1) {
            return {
                greeting: 'عودتك سريعة!',
                message: 'أكمل من حيث توقفت',
                suggestion: getSuggestion(ctx),
                icon: '⚡'
            };
        }

        // Returning next day
        if (hoursSince < 24) {
            return {
                greeting,
                message: formatLastAction(ctx),
                suggestion: getSuggestion(ctx),
                icon: '🎯'
            };
        }

        // Been away 2+ days
        if (hoursSince >= 48) {
            return {
                greeting: `${greeting}! اشتقنا لك`,
                message: `آخر زيارة كانت قبل ${Math.round(hoursSince / 24)} يوم — خلنا نكمل`,
                suggestion: getSuggestion(ctx),
                icon: '🚀'
            };
        }

        return {
            greeting,
            message: formatLastAction(ctx),
            suggestion: getSuggestion(ctx),
            icon: '👋'
        };
    }

    // ── Format last action ──
    function formatLastAction(ctx) {
        if (!ctx.lastAction) return '';
        const page = ctx.lastAction.page || '';
        const pageNames = {
            '/dashboard.html': 'لوحة التحكم',
            '/ceo-dashboard.html': 'لوحة القيادة',
            '/dept-deep.html': 'استكشاف الإدارات',
            '/swot.html': 'تحليل SWOT',
            '/tows.html': 'مصفوفة TOWS',
            '/objectives.html': 'الأهداف الاستراتيجية',
            '/kpis.html': 'مؤشرات الأداء',
            '/initiatives.html': 'المبادرات',
            '/tasks.html': 'المهام',
            '/directions.html': 'الهوية المؤسسية',
            '/okrs.html': 'الأهداف والنتائج',
            '/annual-plan.html': 'الخطة السنوية',
            '/meeting-lab.html': 'معمل الاجتماعات',
            '/analysis.html': 'التحليل الاستراتيجي',
            '/company-health.html': 'صحة الشركة',
            '/strategic-tensions.html': 'التوترات الاستراتيجية',
            '/gap-analysis.html': 'تحليل الفجوات',
            '/auto-reports.html': 'التقارير',
        };

        // Check for tool-detail
        if (page.includes('tool-detail')) {
            const code = ctx.lastAction.toolCode || '';
            const toolNames = {
                'PESTEL': 'PESTEL', 'PORTER': 'Porter',
                'SWOT': 'SWOT', 'VALUE_CHAIN': 'سلسلة القيمة',
                'CORE_COMPETENCY': 'الكفاءات الجوهرية',
                'CUSTOMER_JOURNEY': 'رحلة العميل'
            };
            return `آخر عمل: تحليل ${toolNames[code] || code}`;
        }

        const pageName = pageNames[page] || page.replace(/[/.html]/g, '');
        return `آخر عمل: ${pageName}`;
    }

    // ── Suggest next action ──
    function getSuggestion(ctx) {
        const completed = ctx.completedTools || [];

        // Strategic flow: PESTEL → Porter → SWOT → Directions → OKRs
        if (!completed.includes('PESTEL')) {
            return { text: 'ابدأ بتحليل البيئة الخارجية', href: '/tool-detail.html?code=PESTEL', icon: '🌍' };
        }
        if (!completed.includes('PORTER')) {
            return { text: 'أكمل تحليل القوى التنافسية', href: '/tool-detail.html?code=PORTER', icon: '⚔️' };
        }
        if (!completed.includes('SWOT')) {
            return { text: 'اجمع كل شي في SWOT', href: '/tool-detail.html?code=SWOT', icon: '📊' };
        }

        // Check recent pages for continuity
        const lastPage = ctx.lastAction?.page || '';
        if (lastPage.includes('dept-deep')) {
            return { text: 'أكمل استكشاف الإدارات', href: '/dept-deep.html', icon: '🏢' };
        }
        if (lastPage.includes('initiatives')) {
            return { text: 'تابع مبادراتك', href: '/initiatives.html', icon: '🚀' };
        }

        // Default
        return { text: 'تابع التقدم في لوحة التحكم', href: '/dashboard.html', icon: '📊' };
    }

    // ── Render welcome banner ──
    function renderWelcome(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const welcome = getWelcomeMessage();

        // Only show if there's a meaningful message
        if (!welcome.suggestion && !welcome.message) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';
        container.innerHTML = `
            <div style="
                background:linear-gradient(135deg,rgba(102,126,234,0.06),rgba(118,75,162,0.04));
                border:1px solid rgba(102,126,234,0.12);
                border-radius:16px;
                padding:16px 20px;
                display:flex;
                align-items:center;
                gap:14px;
                margin-bottom:16px;
            ">
                <div style="font-size:28px;flex-shrink:0;">${welcome.icon}</div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:14px;font-weight:700;color:#1e293b;margin-bottom:2px;">${esc(welcome.greeting)}</div>
                    <div style="font-size:12px;color:#64748b;">${esc(welcome.message)}</div>
                </div>
                ${welcome.suggestion ? `
                    <a href="${welcome.suggestion.href}" style="
                        display:flex;align-items:center;gap:6px;
                        padding:8px 16px;border-radius:10px;
                        background:rgba(102,126,234,0.08);color:#667eea;
                        font-size:12px;font-weight:700;text-decoration:none;
                        border:1px solid rgba(102,126,234,0.15);
                        white-space:nowrap;transition:all .2s;font-family:inherit;
                    " onmouseover="this.style.background='rgba(102,126,234,0.15)'" onmouseout="this.style.background='rgba(102,126,234,0.08)'">
                        ${welcome.suggestion.icon} ${esc(welcome.suggestion.text)}
                    </a>
                ` : ''}
            </div>
        `;
    }

    // ── Auto-track page visit ──
    function autoTrack() {
        const page = window.location.pathname;
        const params = new URLSearchParams(window.location.search);
        const meta = {};

        if (params.get('code')) meta.toolCode = params.get('code');
        if (params.get('dept')) meta.department = params.get('dept');

        track('page_visit', meta);
    }

    // ── Escape HTML ──
    function esc(str) {
        if (typeof str !== 'string') return '';
        const d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    }

    // ── Storage ──
    function load() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
        catch { return {}; }
    }
    function save(ctx) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ctx));
    }

    // Auto-track on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoTrack);
    } else {
        autoTrack();
    }

    return {
        track,
        getWelcomeMessage,
        renderWelcome,
        getContext: load,
        reset() { localStorage.removeItem(STORAGE_KEY); }
    };
})();
