const fs = require('fs');
let html = fs.readFileSync('src/ceo-dashboard.html', 'utf8');

// 1. Remove localStorage reads
html = html.replace(/const\s+token\s*=\s*localStorage\.getItem\(['"`]token['"`]\)\s*;?\s*if\s*\(!token\)\s*\{\s*sessionStorage\.setItem[^;]+;\s*location\.href\s*=\s*['"`]\/login\?from=restore['"`];?\s*\}/gm, '');
html = html.replace(/const\s+token\s*=\s*localStorage\.getItem\(['"]token['"]\)\s*\|\|\s*['"][^'"]*['"];?\n?/gm, '');
html = html.replace(/let\s+entityId\s*=\s*localStorage\.getItem\(['"]entityId['"]\)[^;]*;?\n?/gm, 'let entityId = null;\n');
html = html.replace(/const\s+userCat\s*=\s*localStorage\.getItem\(['"]userCategory['"]\)[^;]*;?\n?/gm, '');
html = html.replace(/const\s+currentUser\s*=\s*JSON\.parse\([^)]+\)[^;]*;?\n?/gm, '');

// 2. Replace fetch with apiRequest
html = html.replace(/await\s+fetch\(\s*([^,]+),\s*\{\s*(?:method:\s*['"`]POST['"`],\s*)?headers:\s*\{\s*['"`]Authorization['"`]:\s*[`'"]Bearer\s*\$\{\s*token\s*\}[`'"]\s*\}.*?\}\s*\)/gm, 'await window.apiRequest($1)');
html = html.replace(/await\s+fetch\(\s*([^,]+)\s*\)/gm, 'await window.apiRequest($1)');

// The specific ones with method: POST
html = html.replace(/await\s+fetch\(\s*([^,]+),\s*\{\s*method:\s*['"`]POST['"`],\s*headers:\s*\{\s*['"`]Authorization['"`]:\s*[`'"]Bearer\s*\$\{\s*token\s*\}[`'"]\s*\}\s*\}\s*\)/gm, 'await window.apiRequest($1, { method: "POST" })');

// 3. Add getCurrentUser() and attachEventHandlers
if (!html.includes('async function initCeoDashboard()')) {
    html = html.replace(/\/\/ === Init ===\s+loadDashboard\(\);\s+loadInsights\(\);\s+loadDeptCoverage\(\);\s+loadActivities\(\);\s+loadBreakEven\(\);\s+loadAlerts\(\);\s+renderChart\(\);/,
        `// === Init ===
        async function initCeoDashboard() {
            const user = await window.getCurrentUser();
            if (!user) return;
            entityId = user.entityId;

            attachEventHandlers();

            loadDashboard();
            loadInsights();
            loadDeptCoverage();
            loadActivities();
            loadBreakEven();
            loadAlerts();
            renderChart();
        }
        
        function attachEventHandlers() {
            const container = document.querySelector('.main-content');
            if (container) {
                container.addEventListener('click', async (e) => {
                    const target = e.target.closest('[data-action]');
                    if (!target) return;
                    
                    const action = target.dataset.action;
                    if (action === 'toggle-sidebar') {
                        toggleCeoSidebar();
                    }
                    if (action === 'logout') {
                        e.preventDefault();
                        if (window.apiRequest) {
                            try { await window.apiRequest('/api/auth/logout', { method: 'POST' }); } catch(e) {}
                        }
                        window.location.href = '/login.html';
                    }
                });
            }
        }

        document.addEventListener('DOMContentLoaded', initCeoDashboard);`
    );
}

// 4. onclick replacement
html = html.replace(/onclick="toggleCeoSidebar\(\)"/g, 'data-action="toggle-sidebar"');

fs.writeFileSync('src/ceo-dashboard.html', html);
console.log('Done fixing ceo-dashboard.html');
