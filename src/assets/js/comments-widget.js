/**
 * ستارتكس — نظام التعليقات المدمج (Comment Widget)
 * يُضاف لأي صفحة: <script src="/js/comments-widget.js"></script>
 * ثم: StartixComments.init({ targetType: 'OBJECTIVE', targetId: 'xxx', targetName: 'اسم الهدف', container: '#comments-container' })
 */
(function () {
    'use strict';

    const API = '/api/comments';
    const token = () => localStorage.getItem('token');
    const currentUser = () => {
        try { return JSON.parse(atob(token().split('.')[1])); } catch { return { name: 'مستخدم', id: '' }; }
    };

    // === Styles (injected once) ===
    function injectStyles() {
        if (document.getElementById('commentWidgetStyles')) return;
        const style = document.createElement('style');
        style.id = 'commentWidgetStyles';
        style.textContent = `
      .cw-wrap{margin-top:20px;border-top:1px solid rgba(255,255,255,0.06);padding-top:20px}
      .cw-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
      .cw-title{font-size:15px;font-weight:700;display:flex;align-items:center;gap:8px;color:#e2e8f0}
      .cw-count{padding:2px 10px;border-radius:12px;font-size:11px;font-weight:700;background:rgba(102,126,234,0.1);color:#667eea}
      .cw-input-wrap{display:flex;gap:10px;margin-bottom:16px;align-items:flex-start}
      .cw-avatar{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#667eea,#764ba2);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;color:white;flex-shrink:0}
      .cw-input{flex:1;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:10px 14px;color:#e2e8f0;font-family:inherit;font-size:13px;resize:none;min-height:42px;max-height:120px;transition:border-color 0.2s}
      .cw-input:focus{outline:none;border-color:rgba(102,126,234,0.4)}
      .cw-input::placeholder{color:#64748b}
      .cw-send{width:38px;height:38px;border-radius:10px;border:none;background:linear-gradient(135deg,#667eea,#764ba2);color:white;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s;flex-shrink:0}
      .cw-send:hover{transform:scale(1.05);filter:brightness(1.1)}
      .cw-send:disabled{opacity:0.4;cursor:not-allowed;transform:none}
      .cw-list{display:flex;flex-direction:column;gap:8px}
      .cw-comment{display:flex;gap:10px;padding:12px;border-radius:12px;background:rgba(255,255,255,0.02);border:1px solid transparent;transition:all 0.2s}
      .cw-comment:hover{background:rgba(255,255,255,0.04);border-color:rgba(255,255,255,0.06)}
      .cw-comment-body{flex:1;min-width:0}
      .cw-comment-header{display:flex;align-items:center;gap:8px;margin-bottom:4px}
      .cw-comment-name{font-size:13px;font-weight:700;color:#667eea}
      .cw-comment-time{font-size:10px;color:#64748b}
      .cw-comment-text{font-size:13px;line-height:1.7;color:#c8d0dd}
      .cw-comment-actions{display:flex;gap:8px;margin-top:6px}
      .cw-comment-action{background:none;border:none;color:#64748b;font-size:11px;font-family:inherit;cursor:pointer;padding:2px 6px;border-radius:6px;transition:all 0.2s}
      .cw-comment-action:hover{color:#667eea;background:rgba(102,126,234,0.08)}
      .cw-replies{margin-right:46px;margin-top:6px;border-right:2px solid rgba(255,255,255,0.04);padding-right:12px}
      .cw-reply-input{display:none;margin-top:8px}
      .cw-reply-input.show{display:flex}
      .cw-empty{text-align:center;padding:24px;color:#64748b;font-size:13px}
      .cw-empty i{display:block;font-size:24px;margin-bottom:6px;opacity:0.3}
      .cw-login-prompt{text-align:center;padding:16px;color:#64748b;font-size:13px;background:rgba(255,255,255,0.02);border-radius:12px}
      .cw-login-prompt a{color:#667eea;text-decoration:none}
    `;
        document.head.appendChild(style);
    }

    function formatTime(iso) {
        const diff = Math.floor((Date.now() - new Date(iso)) / 60000);
        if (diff < 1) return 'الآن';
        if (diff < 60) return `منذ ${diff} د`;
        if (diff < 1440) return `منذ ${Math.floor(diff / 60)} س`;
        return `منذ ${Math.floor(diff / 1440)} يوم`;
    }

    // === Init ===
    function init(config) {
        const { targetType, targetId, targetName, container, entityId } = config;
        const el = typeof container === 'string' ? document.querySelector(container) : container;
        if (!el) return console.warn('Comments: container not found');

        injectStyles();

        const user = currentUser();
        const initial = user.name ? user.name.charAt(0) : '?';

        el.innerHTML = `
      <div class="cw-wrap">
        <div class="cw-header">
          <div class="cw-title"><i class="bi bi-chat-dots"></i> التعليقات <span class="cw-count" id="cwCount">0</span></div>
        </div>
        ${token() ? `
          <div class="cw-input-wrap">
            <div class="cw-avatar">${initial}</div>
            <textarea class="cw-input" id="cwInput" placeholder="اكتب تعليقك..." rows="1"></textarea>
            <button class="cw-send" id="cwSend" disabled><i class="bi bi-send"></i></button>
          </div>
        ` : '<div class="cw-login-prompt"><a href="/login.html">سجّل دخولك</a> لإضافة تعليق</div>'}
        <div class="cw-list" id="cwList">
          <div class="cw-empty"><i class="bi bi-chat"></i> لا توجد تعليقات بعد — كن أول المعلّقين!</div>
        </div>
      </div>
    `;

        // Input handler
        const input = document.getElementById('cwInput');
        const sendBtn = document.getElementById('cwSend');
        if (input) {
            input.addEventListener('input', () => {
                sendBtn.disabled = !input.value.trim();
                input.style.height = 'auto';
                input.style.height = Math.min(input.scrollHeight, 120) + 'px';
            });
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(); }
            });
        }
        if (sendBtn) sendBtn.addEventListener('click', submitComment);

        // Load comments
        loadComments();

        async function loadComments() {
            if (!token()) return;
            try {
                const res = await fetch(`${API}?targetType=${targetType}&targetId=${targetId}`, {
                    headers: { 'Authorization': `Bearer ${token()}` }
                });
                if (!res.ok) return;
                const data = await res.json();
                renderComments(data.data || []);
                document.getElementById('cwCount').textContent = data.total || 0;
            } catch (e) {
                console.warn('Comments load failed:', e);
            }
        }

        function renderComments(comments) {
            const list = document.getElementById('cwList');
            if (!comments.length) {
                list.innerHTML = '<div class="cw-empty"><i class="bi bi-chat"></i> لا توجد تعليقات بعد — كن أول المعلّقين!</div>';
                return;
            }

            list.innerHTML = comments.map(c => `
        <div class="cw-comment" id="comment-${c.id}">
          <div class="cw-avatar" style="background:linear-gradient(135deg,#${hashColor(c.userName)},#${hashColor(c.userName + 'x')})">${(c.userName || '?').charAt(0)}</div>
          <div class="cw-comment-body">
            <div class="cw-comment-header">
              <span class="cw-comment-name">${c.userName}</span>
              <span class="cw-comment-time">${formatTime(c.createdAt)}</span>
            </div>
            <div class="cw-comment-text">${escapeHtml(c.content)}</div>
            <div class="cw-comment-actions">
              <button class="cw-comment-action" onclick="cwReply('${c.id}')"><i class="bi bi-reply"></i> رد</button>
              ${c.userId === user.id ? `<button class="cw-comment-action" onclick="cwDelete('${c.id}')"><i class="bi bi-trash"></i> حذف</button>` : ''}
            </div>
            ${c.replies && c.replies.length ? `
              <div class="cw-replies">
                ${c.replies.map(r => `
                  <div class="cw-comment" style="padding:8px">
                    <div class="cw-avatar" style="width:28px;height:28px;font-size:11px;background:linear-gradient(135deg,#${hashColor(r.userName)},#${hashColor(r.userName + 'x')})">${(r.userName || '?').charAt(0)}</div>
                    <div class="cw-comment-body">
                      <div class="cw-comment-header"><span class="cw-comment-name">${r.userName}</span><span class="cw-comment-time">${formatTime(r.createdAt)}</span></div>
                      <div class="cw-comment-text">${escapeHtml(r.content)}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : ''}
            <div class="cw-reply-input" id="reply-${c.id}">
              <div class="cw-input-wrap" style="margin:0">
                <textarea class="cw-input" id="replyInput-${c.id}" placeholder="اكتب ردك..." rows="1" style="font-size:12px"></textarea>
                <button class="cw-send" onclick="cwSubmitReply('${c.id}')" style="width:32px;height:32px;font-size:13px"><i class="bi bi-send"></i></button>
              </div>
            </div>
          </div>
        </div>
      `).join('');
        }

        async function submitComment() {
            const content = input.value.trim();
            if (!content) return;

            sendBtn.disabled = true;
            try {
                const res = await fetch(API, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token()}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content, targetType, targetId, targetName, entityId })
                });
                if (res.ok) {
                    input.value = '';
                    input.style.height = 'auto';
                    loadComments();
                    if (window.StartixAchievements) window.StartixAchievements.unlock('first_comment');
                }
            } catch (e) { console.error('Comment submit error:', e); }
            sendBtn.disabled = false;
        }

        window.cwReply = (id) => {
            const el = document.getElementById(`reply-${id}`);
            el.classList.toggle('show');
            if (el.classList.contains('show')) document.getElementById(`replyInput-${id}`).focus();
        };

        window.cwSubmitReply = async (parentId) => {
            const input = document.getElementById(`replyInput-${parentId}`);
            const content = input.value.trim();
            if (!content) return;
            try {
                await fetch(API, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token()}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content, targetType, targetId, targetName, parentId, entityId })
                });
                input.value = '';
                loadComments();
            } catch (e) { console.error(e); }
        };

        window.cwDelete = async (id) => {
            if (!confirm('حذف التعليق؟')) return;
            try {
                await fetch(`${API}/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token()}` } });
                loadComments();
            } catch (e) { console.error(e); }
        };
    }

    function hashColor(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
        const h = Math.abs(hash) % 360;
        return hslToHex(h, 65, 55);
    }
    function hslToHex(h, s, l) {
        s /= 100; l /= 100;
        const a = s * Math.min(l, 1 - l);
        const f = n => { const k = (n + h / 30) % 12; const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1); return Math.round(255 * c).toString(16).padStart(2, '0'); };
        return f(0) + f(8) + f(4);
    }
    function escapeHtml(t) { return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>'); }

    window.StartixComments = { init };
})();
