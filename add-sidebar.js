const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'public');
const files = fs.readdirSync(dir).filter(f =>
    f.endsWith('.html') && f !== 'login.html' && f !== 'admin.html' && f !== 'dashboard.html' && f !== 'dashboard-improved.html'
);

const scriptTag = '<script src="/js/sidebar.js"></script>';

let updated = 0;
files.forEach(f => {
    const filepath = path.join(dir, f);
    let html = fs.readFileSync(filepath, 'utf8');

    if (html.includes('sidebar.js')) {
        console.log(`⏭️  ${f} — already has sidebar script`);
        return;
    }

    // إضافة السكربت قبل impersonation.js أو قبل </body>
    if (html.includes('impersonation.js')) {
        html = html.replace('<script src="/js/impersonation.js"></script>', `${scriptTag}\n  <script src="/js/impersonation.js"></script>`);
    } else if (html.includes('</body>')) {
        html = html.replace('</body>', `  ${scriptTag}\n</body>`);
    }

    fs.writeFileSync(filepath, html, 'utf8');
    updated++;
    console.log(`✅ ${f}`);
});

console.log(`\nDone! Updated ${updated} files.`);
