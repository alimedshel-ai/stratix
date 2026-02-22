/**
 * سكريبت لإضافة checkPermission على كل routes الكتابة
 * يقرأ الملف، يبدل router.post/patch/put/delete الي ما عندها checkPermission
 * ويضيف checkPermission('EDITOR') بعد verifyToken
 */
const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, '..', 'routes');

// الملفات اللي نبي نحميها + الدور المطلوب
const filesToProtect = [
    { file: 'directions.js', role: 'EDITOR' },
    { file: 'choices.js', role: 'EDITOR' },
    { file: 'reviews.js', role: 'EDITOR' },
    { file: 'corrections.js', role: 'EDITOR' },
    { file: 'assessments.js', role: 'EDITOR' },
    { file: 'okrs.js', role: 'EDITOR' },
    { file: 'tows.js', role: 'EDITOR' },
    { file: 'analysis.js', role: 'EDITOR' },
    { file: 'versions.js', role: 'ADMIN' },
    { file: 'entities.js', role: 'ADMIN' },
    { file: 'users.js', role: 'ADMIN' },
];

let totalFixed = 0;

filesToProtect.forEach(({ file, role }) => {
    const filePath = path.join(routesDir, file);
    if (!fs.existsSync(filePath)) {
        console.log(`⏭️  ${file} — not found, skipping`);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let count = 0;

    // Pattern: router.post/patch/put/delete('...', verifyToken, async
    // But NOT already having checkPermission or checkDataEntryPermission
    const pattern = /router\.(post|put|patch|delete)\(([^)]*),\s*verifyToken,\s*async/g;

    const newContent = content.replace(pattern, (match, method, routePath) => {
        // Skip if already has permission check
        if (match.includes('checkPermission') || match.includes('checkDataEntry') || match.includes('requireRole')) {
            return match;
        }
        count++;
        return `router.${method}(${routePath}, verifyToken, checkPermission('${role}'), async`;
    });

    if (count > 0) {
        // Add import if not already there
        if (!newContent.includes('checkPermission')) {
            // This shouldn't happen since we just added it, but just in case
        }

        // Add require at top if not present
        let finalContent = newContent;
        if (!finalContent.includes("require('../middleware/permission')")) {
            finalContent = finalContent.replace(
                /const { verifyToken } = require\('\.\.\/middleware\/auth'\);/,
                "const { verifyToken } = require('../middleware/auth');\nconst { checkPermission } = require('../middleware/permission');"
            );
        }

        fs.writeFileSync(filePath, finalContent, 'utf8');
        console.log(`✅ ${file} — protected ${count} routes with checkPermission('${role}')`);
        totalFixed += count;
    } else {
        console.log(`⏭️  ${file} — already protected`);
    }
});

// Also handle kpi-entries.js delete specifically
const kpiFile = path.join(routesDir, 'kpi-entries.js');
if (fs.existsSync(kpiFile)) {
    let content = fs.readFileSync(kpiFile, 'utf8');
    // The delete route doesn't have checkDataEntryPermission
    if (content.includes("router.delete('/:id', verifyToken, async")) {
        content = content.replace(
            "router.delete('/:id', verifyToken, async",
            "router.delete('/:id', verifyToken, checkPermission('EDITOR'), async"
        );
        if (!content.includes("require('../middleware/permission')")) {
            content = content.replace(
                /const { verifyToken } = require\('\.\.\/middleware\/auth'\);/,
                "const { verifyToken } = require('../middleware/auth');\nconst { checkPermission } = require('../middleware/permission');"
            );
        }
        fs.writeFileSync(kpiFile, content, 'utf8');
        console.log(`✅ kpi-entries.js — protected delete route`);
        totalFixed++;
    }
}

console.log(`\n🔐 Total: ${totalFixed} routes protected`);
