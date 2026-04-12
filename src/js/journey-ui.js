/**
 * Startix — Journey UI 🚀
 * =======================
 * مكوّن الـ Dashboard/Header لعرض المسار الاستراتيجي والرحلة الذكية.
 */

(function () {
    'use strict';

    function init() {
        const engine = window.PathEngine;
        if (!engine || !engine.isPathMode()) return;

        const path = engine.getPath();
        if (!path) return;

        injectStyles();
        renderHeader();
    }

    function renderHeader() {
        // نبحث عن حاوية المحتوى الرئيسي في ستارتكس
        const target = document.querySelector('.main-content') || document.querySelector('.stx-container') || document.body;
        if (!target) return;

        // التأكد من عدم التكرار
        if (document.getElementById('stxJourneyHeader')) return;

        const progress = window.PathEngine.getSmartProgress();
        const currentStep = progress.steps.find(s => !s.done) || progress.steps[progress.steps.length - 1];

        const html = `
      <div id="stxJourneyHeader" class="stx-journey-header">
        <div class="sjh-main">
          <div class="sjh-left">
            <div class="sjh-badge" style="background: ${path.color}15; color: ${path.color}">
              ${path.emoji} ${path.name}
            </div>
            <div class="sjh-info">
              <h2 class="sjh-title">${progress.percent === 100 ? '🎉 اكتمل المسار الاستراتيجي' : 'المحطة التالية: ' + currentStep.label}</h2>
              <p class="sjh-rationale-teaser">
                ${path.description}
                <button class="sjh-why-btn" onclick="window.JourneyUI.showRationale()">لماذا هذا المسار؟</button>
              </p>
            </div>
          </div>
          <div class="sjh-right">
            <div class="sjh-stats">
              <div class="sjh-stat">
                <span class="sjh-stat-val">${progress.completed}/${progress.total}</span>
                <span class="sjh-stat-lbl">الخطوات</span>
              </div>
              <div class="sjh-stat">
                <span class="sjh-stat-val">${progress.percent}%</span>
                <span class="sjh-stat-lbl">الإنجاز</span>
              </div>
            </div>
            <div class="sjh-progress-mega">
               <div class="sjh-progress-track">
                  <div class="sjh-progress-fill" style="width: ${progress.percent}%; background: ${path.color}"></div>
               </div>
            </div>
          </div>
        </div>

        <div id="sjhRationaleModal" class="sjh-modal" style="display:none">
          <div class="sjh-modal-content">
            <div class="sjh-modal-header">
              <h3>لماذا تم اختيار "${path.name}"؟</h3>
              <button onclick="window.JourneyUI.hideRationale()"><i class="bi bi-x-lg"></i></button>
            </div>
            <div class="sjh-modal-body">
              <div class="sjh-explanation">
                <div class="sjh-expl-icon" style="background:${path.color}">${path.emoji}</div>
                <div class="sjh-expl-text">
                  <p>${path.rationale || 'هذا المسار مصمم خصيصاً لمساعدة منشأتك على الانتقال من وضعها الحالي إلى أهدافها الاستراتيجية المنشودة بكفاءة عالية.'}</p>
                  <div class="sjh-key-info">
                    <strong>💡 نصيحة ستارتكس:</strong>
                    التركيز على المهام المحددة في هذا المسار يضمن لك تحقيق أثر سريع (Quick Wins) وبناء أساس متين للمراحل التالية.
                  </div>
                </div>
              </div>

              <div class="sjh-steps-preview">
                <h4>خارطة الطريق الخاصة بك:</h4>
                <div class="sjh-steps-grid">
                  ${progress.steps.map(s => `
                    <div class="sjh-step-card ${s.done ? 'done' : ''} ${s.isEssential ? 'essential' : ''}">
                      <div class="sjh-step-header">
                        <i class="bi ${s.icon}"></i>
                        ${s.isEssential ? '<span class="sjh-essential-badge">مهم جداً</span>' : ''}
                      </div>
                      <div class="sjh-step-name">${s.label}</div>
                      <div class="sjh-step-status">${s.done ? '✅ مكتمل' : '⏳ قيد الانتظار'}</div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

        // حقن الهيدر في بداية المحتوى
        if (target === document.body) {
            target.insertAdjacentHTML('afterbegin', html);
        } else {
            target.prepend(createElementFromHTML(html));
        }
    }

    function createElementFromHTML(htmlString) {
        var div = document.createElement('div');
        div.innerHTML = htmlString.trim();
        return div.firstChild;
    }

    function injectStyles() {
        if (document.getElementById('sjh-styles')) return;
        const style = document.createElement('style');
        style.id = 'sjh-styles';
        style.textContent = `
      .stx-journey-header {
        margin: 24px 32px 0;
        background: linear-gradient(135deg, rgba(23, 26, 42, 1), rgba(23, 26, 42, 0.7));
        border: 1px solid rgba(102, 126, 234, 0.15);
        border-radius: 20px;
        padding: 24px;
        position: relative;
        overflow: hidden;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        animation: slideDownFade 0.7s ease-out;
      }
      @keyframes slideDownFade {
        from { opacity: 0; transform: translateY(-20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .sjh-main { display: flex; justify-content: space-between; align-items: center; gap: 32px; }
      .sjh-left { flex: 1; }
      .sjh-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; margin-bottom: 12px; }
      .sjh-title { font-size: 20px; font-weight: 800; margin-bottom: 4px; color: #fff; }
      .sjh-rationale-teaser { font-size: 13px; color: #94a3b8; margin: 0; display: flex; align-items: center; gap: 8px; }
      .sjh-why-btn { background: none; border: none; color: #667eea; font-weight: 700; font-size: 11px; cursor: pointer; padding: 0; text-decoration: underline; }
      .sjh-why-btn:hover { color: #8b5cf6; }

      .sjh-right { width: 300px; }
      .sjh-stats { display: flex; justify-content: flex-end; gap: 24px; margin-bottom: 12px; }
      .sjh-stat { text-align: left; }
      .sjh-stat-val { display: block; font-size: 20px; font-weight: 900; line-height: 1; color: #fff; }
      .sjh-stat-lbl { font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }

      .sjh-progress-mega { height: 8px; background: rgba(255,255,255,0.05); border-radius: 4px; overflow: hidden; }
      .sjh-progress-fill { height: 100%; transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1); }

      /* Modal */
      .sjh-modal { position: fixed; inset: 0; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 10000; backdrop-filter: blur(8px); padding: 20px; }
      .sjh-modal-content { background: #171a2a; border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; width: 100%; max-width: 800px; max-height: 90vh; overflow-y: auto; animation: zoomIn 0.3s ease; }
      @keyframes zoomIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      .sjh-modal-header { padding: 24px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; }
      .sjh-modal-header h3 { font-size: 18px; font-weight: 800; margin: 0; }
      .sjh-modal-header button { background: none; border: none; color: #94a3b8; font-size: 20px; cursor: pointer; }

      .sjh-modal-body { padding: 24px; }
      .sjh-explanation { display: flex; gap: 24px; background: rgba(255,255,255,0.02); padding: 20px; border-radius: 16px; margin-bottom: 32px; border: 1px solid rgba(255,255,255,0.03); }
      .sjh-expl-icon { width: 64px; height: 64px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 32px; flex-shrink: 0; }
      .sjh-expl-text { flex: 1; }
      .sjh-expl-text p { font-size: 15px; line-height: 1.8; color: #e2e8f0; margin-bottom: 12px; }
      .sjh-key-info { background: rgba(102,126,234,0.1); border-right: 4px solid #667eea; padding: 12px 16px; border-radius: 4px 12px 12px 4px; font-size: 13px; color: #fff; }

      .sjh-steps-preview h4 { font-size: 16px; font-weight: 800; margin-bottom: 16px; color: #94a3b8; }
      .sjh-steps-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; }
      .sjh-step-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 14px; position: relative; }
      .sjh-step-card.done { border-color: rgba(34,197,94,0.3); background: rgba(34,197,94,0.05); }
      .sjh-step-card.essential { border-style: dashed; border-color: rgba(102,126,234,0.4); }
      .sjh-step-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
      .sjh-step-header i { font-size: 18px; color: #667eea; }
      .sjh-essential-badge { font-size: 8px; font-weight: 800; background: #667eea; color: #fff; padding: 1px 5px; border-radius: 4px; text-transform: uppercase; }
      .sjh-step-name { font-size: 13px; font-weight: 700; margin-bottom: 4px; }
      .sjh-step-status { font-size: 10px; color: #94a3b8; }

      /* Responsive */
      @media (max-width: 991px) {
        .sjh-main { flex-direction: column; gap: 20px; }
        .sjh-right { width: 100%; }
        .sjh-stats { justify-content: space-between; }
        .stx-journey-header { margin: 16px; }
      }
    `;
        document.head.appendChild(style);
    }

    window.JourneyUI = {
        showRationale: function () {
            const modal = document.getElementById('sjhRationaleModal');
            if (modal) modal.style.display = 'flex';
        },
        hideRationale: function () {
            const modal = document.getElementById('sjhRationaleModal');
            if (modal) modal.style.display = 'none';
        }
    };

    // المبادرة بعد تحميل الصفحة
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
