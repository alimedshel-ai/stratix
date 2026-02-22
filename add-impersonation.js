const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'public');
const files = fs.readdirSync(dir).filter(f =>
    f.endsWith('.html') && f !== 'login.html' && f !== 'admin.html' && f !== 'dashboard-improved.html'
);

const scriptTag = '<script src="/js/impersonation.js"></script>';

let updated = 0;
files.forEach(f => {
    const filepath = path.join(dir, f);
    let html = fs.readFileSync(filepath, 'utf8');

    if (html.includes('impersonation.js')) {
        console.log(`⏭️  ${f} — already has impersonation script`);
        return;
    }

    // إضافة السكربت قبل </body>
    if (html.includes('</body>')) {
        html = html.replace('</body>', `  ${scriptTag}\n</body>`);
        fs.writeFileSync(filepath, html, 'utf8');
        updated++;
        console.log(`✅ ${f}`);
    } else {
        console.log(`⚠️  ${f} — no </body> found`);
    }
});

console.log(`\nDone! Updated ${updated} files.`);
