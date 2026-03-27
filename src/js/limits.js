/**
 * ستارتكس — نظام الحدود والاشتراكات (Freemium)
 * يُستورد في أي صفحة: <script src="/js/limits.js"></script>
 */

const PLANS = {
    free: {
        id: 'free',
        name: 'مجاني',
        nameEn: 'Free',
        price: 0,
        period: 'دائماً',
        limits: {
            objectives: 2,
            kpis: 3,
            initiatives: 2,
            projects: 1,
            tasks: 10,
            assessments: 1,
            swotPoints: 2,       // نقطتين في كل ربع
            scenarios: 0,
            versions: 1,
            teamMembers: 1,
            okrs: 1,
            reports: 0,          // لا تصدير PDF
            aiAnalysis: 1,       // تحليل واحد شهرياً
            integrations: 0,     // لا ربط خارجي
        }
    },
    starter: {
        id: 'starter',
        name: 'أساسي',
        nameEn: 'Starter',
        price: 99,
        period: 'شهرياً',
        limits: {
            objectives: 10,
            kpis: 20,
            initiatives: 10,
            projects: 10,
            tasks: 100,
            assessments: 5,
            swotPoints: Infinity,
            scenarios: 3,
            versions: 5,
            teamMembers: 5,
            okrs: 5,
            reports: 5,
            aiAnalysis: 10,
            integrations: 1,
        }
    },
    pro: {
        id: 'pro',
        name: 'احترافي',
        nameEn: 'Pro',
        price: 249,
        period: 'شهرياً',
        popular: true,
        limits: {
            objectives: Infinity,
            kpis: Infinity,
            initiatives: Infinity,
            projects: Infinity,
            tasks: Infinity,
            assessments: Infinity,
            swotPoints: Infinity,
            scenarios: 10,
            versions: Infinity,
            teamMembers: 15,
            okrs: Infinity,
            reports: Infinity,
            aiAnalysis: 50,
            integrations: 3,
        }
    },
    enterprise: {
        id: 'enterprise',
        name: 'المؤسسات',
        nameEn: 'Enterprise',
        price: -1, // Custom
        period: 'سنوياً',
        limits: {
            objectives: Infinity,
            kpis: Infinity,
            initiatives: Infinity,
            projects: Infinity,
            tasks: Infinity,
            assessments: Infinity,
            swotPoints: Infinity,
            scenarios: Infinity,
            versions: Infinity,
            teamMembers: Infinity,
            okrs: Infinity,
            reports: Infinity,
            aiAnalysis: Infinity,
            integrations: Infinity,
        }
    }
};

const FEATURE_LABELS = {
    objectives: 'الأهداف الاستراتيجية',
    kpis: 'مؤشرات الأداء',
    initiatives: 'المبادرات',
    projects: 'المشاريع',
    tasks: 'المهام',
    assessments: 'التقييمات',
    swotPoints: 'نقاط SWOT',
    scenarios: 'سيناريوهات المحاكاة',
    versions: 'إصدارات الاستراتيجية',
    teamMembers: 'أعضاء الفريق',
    okrs: 'أهداف OKR',
    reports: 'تقارير PDF',
    aiAnalysis: 'تحليلات AI شهرياً',
    integrations: 'تكاملات خارجية',
};

// === Get current plan ===
function getCurrentPlan() {
    return localStorage.getItem('startix_plan') || 'free';
}

function getPlanData() {
    return PLANS[getCurrentPlan()] || PLANS.free;
}

function isPro() {
    return ['pro', 'enterprise'].includes(getCurrentPlan());
}

function isStarter() {
    return getCurrentPlan() !== 'free';
}

// === Check limits ===
function getLimit(feature) {
    const plan = getPlanData();
    return plan.limits[feature] ?? 0;
}

function checkLimit(feature, currentCount) {
    const limit = getLimit(feature);
    if (limit === Infinity) return { allowed: true, remaining: Infinity };
    const remaining = Math.max(0, limit - currentCount);
    return { allowed: currentCount < limit, remaining, limit, current: currentCount };
}

function enforceLimit(feature, currentCount, options = {}) {
    const check = checkLimit(feature, currentCount);
    if (!check.allowed) {
        showUpgradeModal(feature, options.context || '');
        return false;
    }
    return true;
}

// === Upgrade Modal ===
function showUpgradeModal(feature, context) {
    const label = FEATURE_LABELS[feature] || feature;
    const plan = getPlanData();
    const limit = plan.limits[feature] ?? 0;
    const nextPlan = plan.id === 'free' ? PLANS.starter : PLANS.pro;

    // Remove existing modal
    const existing = document.getElementById('upgradeModalOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'upgradeModalOverlay';
    overlay.innerHTML = `
    <style>
      #upgradeModalOverlay { position:fixed; inset:0; z-index:99999; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.7); backdrop-filter:blur(6px); animation:umFadeIn 0.3s ease; }
      @keyframes umFadeIn { from{opacity:0} to{opacity:1} }
      .um-card { background:#1a1d2e; border:1px solid rgba(255,255,255,0.1); border-radius:20px; max-width:520px; width:90%; padding:36px; color:#e2e8f0; font-family:'Tajawal',sans-serif; position:relative; animation:umSlideUp 0.4s ease; }
      @keyframes umSlideUp { from{transform:translateY(30px);opacity:0} to{transform:translateY(0);opacity:1} }
      .um-close { position:absolute; top:14px; left:14px; width:32px; height:32px; border-radius:8px; border:1px solid rgba(255,255,255,0.1); background:transparent; color:#94a3b8; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:16px; }
      .um-icon { text-align:center; margin-bottom:16px; }
      .um-icon span { font-size:52px; }
      .um-title { text-align:center; font-size:22px; font-weight:800; margin-bottom:6px; }
      .um-subtitle { text-align:center; font-size:14px; color:#94a3b8; margin-bottom:20px; line-height:1.6; }
      .um-limit-info { background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.2); border-radius:12px; padding:14px 18px; text-align:center; margin-bottom:20px; font-size:14px; color:#f87171; }
      .um-features { margin-bottom:24px; }
      .um-feature { display:flex; align-items:center; gap:10px; padding:8px 0; font-size:13px; }
      .um-feature i { color:#22c55e; font-size:16px; }
      .um-cta { display:flex; gap:10px; }
      .um-btn { flex:1; padding:14px; border-radius:12px; font-family:inherit; font-size:14px; font-weight:700; cursor:pointer; text-align:center; transition:all 0.3s; text-decoration:none; display:flex; align-items:center; justify-content:center; gap:6px; }
      .um-btn.primary { background:linear-gradient(135deg,#667eea,#764ba2); color:white; border:none; }
      .um-btn.primary:hover { box-shadow:0 8px 25px rgba(102,126,234,0.4); transform:translateY(-2px); }
      .um-btn.secondary { background:rgba(255,255,255,0.06); color:#e2e8f0; border:1px solid rgba(255,255,255,0.1); }
      .um-price { text-align:center; margin-bottom:16px; }
      .um-price-value { font-size:36px; font-weight:900; color:#667eea; }
      .um-price-period { font-size:13px; color:#94a3b8; }
      .um-trial { text-align:center; font-size:12px; color:#22c55e; margin-top:12px; }
    </style>
    <div class="um-card">
      <button class="um-close" onclick="document.getElementById('upgradeModalOverlay').remove()"><i class="bi bi-x-lg"></i></button>
      <div class="um-icon"><span>🔒</span></div>
      <div class="um-title">وصلت للحد المجاني!</div>
      <div class="um-subtitle">خطتك الحالية (<strong>${plan.name}</strong>) تسمح بـ <strong>${limit === 0 ? 'بدون وصول' : limit + ' ' + label}</strong> فقط.</div>
      <div class="um-limit-info"><i class="bi bi-exclamation-triangle"></i> لإضافة المزيد من ${label}، ارتقِ لخطة <strong>${nextPlan.name}</strong></div>
      <div class="um-price">
        <div class="um-price-value">${nextPlan.price} <span style="font-size:16px">ريال</span></div>
        <div class="um-price-period">${nextPlan.period}</div>
      </div>
      <div class="um-features">
        <div class="um-feature"><i class="bi bi-check-circle-fill"></i> ${label}: <strong>${nextPlan.limits[feature] === Infinity ? 'لا محدود' : nextPlan.limits[feature]}</strong></div>
        <div class="um-feature"><i class="bi bi-check-circle-fill"></i> أعضاء فريق: <strong>${nextPlan.limits.teamMembers}</strong></div>
        <div class="um-feature"><i class="bi bi-check-circle-fill"></i> تحليلات AI: <strong>${nextPlan.limits.aiAnalysis}/شهر</strong></div>
        <div class="um-feature"><i class="bi bi-check-circle-fill"></i> تقارير PDF وتصدير كامل</div>
      </div>
      <div class="um-cta">
        <a href="/pricing.html" class="um-btn primary"><i class="bi bi-rocket-takeoff"></i> اكتشف الخطط</a>
        <button class="um-btn secondary" onclick="document.getElementById('upgradeModalOverlay').remove()">أكمل بالمجاني</button>
      </div>
      <div class="um-trial"><i class="bi bi-gift"></i> جرّب ١٤ يوم مجاناً — بدون بطاقة ائتمان</div>
    </div>
  `;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

// === Plan Badge (for sidebar/header) ===
function getPlanBadgeHTML() {
    const plan = getPlanData();
    const colors = { free: '#94a3b8', starter: '#667eea', pro: '#22c55e', enterprise: '#facc15' };
    const color = colors[plan.id] || '#94a3b8';
    return `<span style="padding:3px 8px;border-radius:6px;font-size:10px;font-weight:700;background:${color}22;color:${color};margin-right:6px">${plan.name}</span>`;
}

console.log('[Startix Limits] Plan:', getCurrentPlan(), '| Loaded');
