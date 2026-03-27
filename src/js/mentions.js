class Mentions {
    constructor(textareaId) {
        this.textarea = document.getElementById(textareaId);
        if (!this.textarea) return;

        // تغليف حقل النص لضمان ظهور القائمة فوقه بشكل صحيح
        this.wrapper = document.createElement('div');
        this.wrapper.style.position = 'relative';
        this.textarea.parentNode.insertBefore(this.wrapper, this.textarea);
        this.wrapper.appendChild(this.textarea);

        // إنشاء القائمة المنسدلة
        this.dropdown = document.createElement('ul');
        this.dropdown.className = 'mention-dropdown';
        this.dropdown.style.cssText = 'position:absolute; display:none; background:var(--bg-card, #1a1d2e); border:1px solid var(--primary, #667eea); border-radius:10px; list-style:none; padding:4px; margin:0; z-index:1000; max-height:160px; overflow-y:auto; box-shadow:0 8px 25px rgba(0,0,0,0.4); min-width:220px; text-align:right; right:10px;';
        this.wrapper.appendChild(this.dropdown);

        this.mentionedUsers = []; // تخزين الأفراد الذين تم اختيارهم

        this.textarea.addEventListener('input', this.handleInput.bind(this));
        document.addEventListener('click', (e) => {
            if (!this.wrapper.contains(e.target)) this.hideDropdown();
        });
    }

    async handleInput() {
        const text = this.textarea.value;
        const cursorPos = this.textarea.selectionStart;
        const textBeforeCursor = text.substring(0, cursorPos);

        // التقاط حرف @ يتبعه أحرف عربية أو إنجليزية
        const match = textBeforeCursor.match(/@([\u0600-\u06FF\w]*)$/);

        if (match) {
            await this.fetchUsers(match[1]);
        } else {
            this.hideDropdown();
        }
    }

    async fetchUsers(query) {
        try {
            const token = localStorage.getItem('token') || '';
            const headers = { 'Content-Type': 'application/json' };
            if (token && token !== 'secure-cookie-active') {
                headers['Authorization'] = `Bearer ${token}`;
            }
            const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
                credentials: 'include',
                headers
            });
            if (!res.ok) { this.hideDropdown(); return; }
            const data = await res.json();
            if (data.users && data.users.length > 0) {
                this.showDropdown(data.users);
            } else {
                this.hideDropdown();
            }
        } catch (err) { console.error('Mention fetch error:', err); }
    }

    showDropdown(users) {
        this.dropdown.innerHTML = users.map(u => `
            <li data-id="${u.id}" data-name="${u.name}" style="padding:10px 12px; cursor:pointer; display:flex; align-items:center; gap:10px; border-radius:8px; color:var(--text); font-size:13px; font-weight:600; transition:all 0.2s;" onmouseover="this.style.background='rgba(102,126,234,0.15)'; this.style.color='var(--primary)'" onmouseout="this.style.background='transparent'; this.style.color='var(--text)'">
                <div style="width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg, var(--primary), var(--secondary));color:white;display:flex;align-items:center;justify-content:center;font-size:11px;">${u.name.charAt(0)}</div>
                ${u.name}
            </li>
        `).join('');

        this.dropdown.querySelectorAll('li').forEach(li => {
            li.addEventListener('click', () => this.selectUser(li.dataset.id, li.dataset.name));
        });

        this.dropdown.style.display = 'block';
        this.dropdown.style.top = `${this.textarea.offsetHeight + 5}px`;
    }

    hideDropdown() { this.dropdown.style.display = 'none'; }

    selectUser(id, name) {
        const text = this.textarea.value;
        const cursorPos = this.textarea.selectionStart;
        const newText = text.substring(0, cursorPos).replace(/@([\u0600-\u06FF\w]*)$/, `@${name} `) + text.substring(cursorPos);
        this.textarea.value = newText;
        if (!this.mentionedUsers.find(u => u.id === id)) this.mentionedUsers.push({ id, name });
        this.hideDropdown();
        this.textarea.focus();
    }

    getMentionedIds() {
        // إرجاع الـ IDs للأشخاص الذين لا زالت أسماؤهم موجودة في النص
        return this.mentionedUsers.filter(u => this.textarea.value.includes(`@${u.name}`)).map(u => u.id);
    }
}
window.Mentions = Mentions;