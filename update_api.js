const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const scriptTag = '<script src="/assets/js/api.js"></script>';

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    let modified = false;

    // 1. إضافة script tag إذا لم يكن موجوداً
    // ولكن تأكد أننا لا نضيفه لملفات لا تستدعي API
    if (content.includes('fetch(') || content.includes('fetch (')) {
        if (!content.includes('api.js')) {
            // نضيف قبل أول script tag إن وجد، أو قبل </body>
            const firstScriptIndex = content.indexOf('<script>');
            if (firstScriptIndex !== -1) {
                content = content.slice(0, firstScriptIndex) + `${scriptTag}\n    ` + content.slice(firstScriptIndex);
            } else if (content.includes('</body>')) {
                content = content.replace('</body>', `${scriptTag}\n</body>`);
            } else if (content.includes('</head>')) {
                content = content.replace('</head>', `${scriptTag}\n</head>`);
            } else {
                content += `\n${scriptTag}`;
            }
            modified = true;
        }

        // 2. استبدال fetch('/api/ ...) بـ window.apiRequest
        const fetchRegex = /\bfetch\s*\(/g;
        if (fetchRegex.test(content)) {
            content = content.replace(fetchRegex, 'window.apiRequest(');
            modified = true;
        }
    }

    if (modified && content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ تم تعديل: ${path.basename(filePath)}`);
    } else {
        // console.log(`⏩ لا تغييرات: ${path.basename(filePath)}`);
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (file.endsWith('.html')) {
            processFile(fullPath);
        }
    });
}

console.log('⏳ جاري تحديث جميع الصفحات للعمل عبر window.apiRequest...');
walkDir(srcDir);
console.log('🎉 انتهى السكربت. جميع الاستدعاءات أصبحت مؤمنة!');
