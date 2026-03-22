// src/tool-detail.js
/**
 * Centralized event handling for the tool-detail page.
 * This file is extracted from the inline script in src/tool-detail.html
 * so that it can be imported in unit tests.
 */

function attachEventHandlers() {
    const area = document.getElementById('contentArea');
    if (!area) return;

    // Click delegation
    area.addEventListener('click', function (e) {
        const target = e.target.closest('[data-action]');
        if (!target) return;
        const action = target.dataset.action;
        const key = target.dataset.key || '';
        const color = target.dataset.color || '';
        const idx = target.dataset.idx ? parseInt(target.dataset.idx, 10) : undefined;

        switch (action) {
            case 'add-pestel-item':
            case 'add-item':
                if (typeof addPestelItem === 'function') addPestelItem(key, color);
                break;
            case 'add-vc-item':
                if (typeof addVcItem === 'function') addVcItem(key, target.value, color);
                break;
            case 'remove-item':
                if (typeof removeItem === 'function') removeItem(key, idx);
                break;
            case 'toggle-vc':
                if (typeof toggleVcActivity === 'function') toggleVcActivity(key);
                break;
            case 'fill-example':
                // Example chips fill the related input field
                const input = document.getElementById('input-' + key);
                if (input) {
                    input.value = target.dataset.value || '';
                    input.focus();
                }
                break;
            case 'scroll-to':
                const el = document.getElementById('section-' + key);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                break;
            // Add other cases as needed
        }
    });

    // Keydown delegation (Enter key)
    area.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        const target = e.target.closest('[data-action]');
        if (!target) return;
        const action = target.dataset.action;
        const key = target.dataset.key || '';
        const color = target.dataset.color || '';
        const idx = target.dataset.idx ? parseInt(target.dataset.idx, 10) : undefined;

        switch (action) {
            case 'add-pestel-item':
            case 'add-item':
                if (typeof addPestelItem === 'function') addPestelItem(key, color);
                break;
            case 'add-vc-item':
                if (typeof addVcItem === 'function') addVcItem(key, target.value, color);
                break;
            // other keydown actions can be added here
        }
    });
}

module.exports = { attachEventHandlers };
