const fs = require('fs');

const path = './obsolete/startix-v10-single.html';
const content = fs.readFileSync(path, 'utf8');

function extractObject(varName) {
    // Regex to match "const VARNAME = { ... };"
    // Since it's a huge object, we need a robust regex or we can just eval a slice.
    // We'll slice between "const VARNAME = {" and the next "};"
    const startTag = `const ${varName} = `;
    const startIndex = content.indexOf(startTag);
    if (startIndex === -1) return null;

    // Find the end by counting braces
    let i = startIndex + startTag.length;
    let braceCount = 0;
    let foundInitialBrace = false;
    let endIndex = -1;

    for (; i < content.length; i++) {
        if (content[i] === '{' || content[i] === '[') {
            braceCount++;
            foundInitialBrace = true;
        } else if (content[i] === '}' || content[i] === ']') {
            braceCount--;
        }

        if (foundInitialBrace && braceCount === 0) {
            endIndex = i;
            break;
        }
    }

    if (endIndex === -1) return null;

    // Extract the JS object raw string
    const rawObjStr = content.substring(startIndex + startTag.length, endIndex + 1);

    try {
        // We evaluate it creatively to get a valid JSON object because JSON.parse fails on unquoted keys
        const obj = eval(`(${rawObjStr})`);
        return obj;
    } catch (e) {
        console.error("Failed to eval", varName, e.message);
        return null;
    }
}

try {
    const SECTOR_GROUPS = extractObject('SECTOR_GROUPS');
    const SUB_SECTORS = extractObject('SUB_SECTORS');
    const SECTOR_SPECIFIC = extractObject('SECTOR_SPECIFIC');

    // Mingle them nicely
    const output = {
        meta: {
            title: "المخالفات التنظيمية والاشتراطات",
            description: "قاعدة بيانات الامتثال المخصصة حسب القطاع والنشاط"
        },
        groups: SECTOR_GROUPS,
        subSectors: SUB_SECTORS,
        fines: SECTOR_SPECIFIC
    };

    // Ensure assets/data directory exists
    const dataDir = './src/assets/data';
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    // Write to JSON
    fs.writeFileSync(`${dataDir}/compliance-fines.json`, JSON.stringify(output, null, 2), 'utf8');
    console.log(`✅ Success! Combined JSON size: ${JSON.stringify(output).length} bytes. Saved to: ${dataDir}/compliance-fines.json`);

} catch (err) {
    console.error(err);
}
