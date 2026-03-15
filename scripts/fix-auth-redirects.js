/**
 * 🔄 تحديث إعادة التوجيه الذكية في جميع صفحات HTML
 * يبحث عن أنماط if (!token) ... location.href = '/login'
 * ويضيف sessionStorage.setItem قبل كل redirect
 */
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');
const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.html') && f !== 'login.html');

let totalChanges = 0;
let changedFiles = [];

for (const file of files) {
    const filePath = path.join(srcDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;

    // البحث عن أنماط auth-redirect (سطور تحتوي !token وتحويل لـ login)
    // لا نعدل على أنماط logout (اللي فيها removeItem أو clear)
    const lines = content.split('\n');
    let changed = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // تخطي أسطر logout (تحتوي clear أو removeItem)
        if (line.includes('removeItem') || line.includes('.clear()') || line.includes('logout')) continue;

        // تخطي الأسطر اللي فيها بالفعل stratix_return_url
        if (line.includes('stratix_return_url')) continue;

        // البحث عن نمط: !token ... location.href = '/login'
        if ((line.includes('!token') || line.includes('!state.token') || line.includes('!user')) &&
            (line.includes("'/login'") || line.includes("'/login.html'") || line.includes('"/login"') || line.includes('"/login.html"'))) {

            // استبدال location.href = '/login...' بنسخة تحفظ الرابط أولاً
            const newLine = line
                .replace(
                    /(?:window\.)?location\.href\s*=\s*['"]\/login(?:\.html)?['"]/g,
                    "sessionStorage.setItem('stratix_return_url', location.pathname + location.search); location.href = '/login?from=restore'"
                );

            if (newLine !== line) {
                lines[i] = newLine;
                changed = true;
                totalChanges++;
            }
        }
    }

    if (changed) {
        fs.writeFileSync(filePath, lines.join('\n'));
        changedFiles.push(file);
        console.log(`  ✅ ${file}`);
    }
}

console.log(`\n${'═'.repeat(50)}`);
console.log(`📊 النتيجة: ${totalChanges} تعديل في ${changedFiles.length} ملف`);
console.log(`${'═'.repeat(50)}`);

if (changedFiles.length === 0) {
    console.log('⚠️ لم يتم العثور على أنماط للتعديل');
}
