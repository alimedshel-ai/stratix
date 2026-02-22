/**
 * إضافة api.js لكل صفحات HTML اللي ما عندها
 * يضيفها قبل sidebar.js عشان تكون جاهزة قبل ما الصفحة تحمّل
 */
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');

// كل ملفات HTML في المجلد الرئيسي
const files = fs.readdirSync(publicDir).filter(f => f.endsWith('.html'));

let fixed = 0;

files.forEach(file => {
    const filePath = path.join(publicDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Skip if already has api.js
    if (content.includes('/js/api.js')) return;

    // Find sidebar.js line and add api.js before it
    if (content.includes('/js/sidebar.js')) {
        content = content.replace(
            /<script src="\/js\/sidebar\.js"><\/script>/,
            '<script src="/js/api.js"></script>\n    <script src="/js/sidebar.js"></script>'
        );
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ ${file} — added api.js`);
        fixed++;
    } else {
        console.log(`⏭️  ${file} — no sidebar.js found`);
    }
});

console.log(`\n📦 Total: ${fixed} files updated`);
