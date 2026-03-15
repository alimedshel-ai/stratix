/**
 * 🔧 إصلاح مشكلة الأقواس في إعادة التوجيه الذكية
 * السكريبت السابق أنتج كود بدون {} مما يسبب redirect دائمي
 */
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');
const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.html') && f !== 'login.html');

let fixed = 0;

for (const file of files) {
    const fp = path.join(srcDir, file);
    let c = fs.readFileSync(fp, 'utf8');
    const o = c;

    // Fix: if (!token) sessionStorage...; location.href = ...;
    // Into: if (!token) { sessionStorage...; location.href = ...; }
    c = c.replace(
        /if\s*\(([^)]+)\)\s*sessionStorage\.setItem\('stratix_return_url',\s*location\.pathname\s*\+\s*location\.search\);\s*location\.href\s*=\s*'\/login\?from=restore';/g,
        "if ($1) { sessionStorage.setItem('stratix_return_url', location.pathname + location.search); location.href = '/login?from=restore'; }"
    );

    if (c !== o) {
        fs.writeFileSync(fp, c);
        fixed++;
        console.log('✅ Fixed:', file);
    }
}

console.log(`\n📊 Fixed ${fixed} files`);
