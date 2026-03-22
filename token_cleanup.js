const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.html') || file.endsWith('.js')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(srcDir);
let changedFiles = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Pattern 1:
    // const token = localStorage.getItem('token');
    // if (!token) { ... }
    content = content.replace(/const\s+token\s*=\s*localStorage\.getItem\(['"`]token['"`]\)\s*(?:\|\|\s*['"`]['"`])?\s*;?\s*if\s*\(!token\)\s*\{[^}]*\}/gm, '/* Legacy token redirect removed */');

    // Pattern 2: single line if (!token) { location.href = ... }
    content = content.replace(/if\s*\(!token\)\s*\{?\s*(?:sessionStorage\.setItem[^;]+;\s*)?window\.location(?:\.href)?\s*=\s*['"`]\/login[^'"`]*['"`];?\s*\}?/gm, '/* Legacy token redirect removed */');

    // Pattern 3: let token = ... if (!token) return location.href ...
    content = content.replace(/if\s*\(!token\)\s*(?:return\s*)?(?:window\.)?location(?:\.href)?\s*=\s*['"`]\/login[^'"`]*['"`];?/gm, '/* Legacy token redirect removed */');

    // Pattern 4: direct if (!localStorage.getItem('token'))
    content = content.replace(/if\s*\(!localStorage\.getItem\(['"`]token['"`]\)\)\s*\{[^}]*\}/gm, '/* Legacy token redirect removed */');

    // Also inject monkeypatch into api.js if it's that file
    if (file.endsWith('api.js')) {
        if (!content.includes('// Monkeypatch global fetch')) {
            const monkeypatch = `
// Monkeypatch global fetch to automatically include credentials for internal APIs
const originalFetch = window.fetch;
window.fetch = async function () {
    let [resource, config] = arguments;
    if (!config) config = {};
    
    const urlStr = typeof resource === 'string' ? resource : (resource instanceof Request ? resource.url : '');
    const isInternal = urlStr.includes('/api/');
    if (isInternal) {
        config.credentials = 'include';
        // Avoid sending 'null' as Bearer token if it got pulled from empty localStorage
        if (config.headers) {
            if (config.headers instanceof Headers) {
                const auth = config.headers.get('Authorization');
                if (auth && (auth === 'Bearer null' || auth === 'Bearer ')) {
                    config.headers.delete('Authorization');
                }
            } else {
                const auth = config.headers['Authorization'] || config.headers['authorization'];
                if (auth && (auth === 'Bearer null' || auth === 'Bearer ')) {
                    delete config.headers['Authorization'];
                    delete config.headers['authorization'];
                }
            }
        }
    }
    
    // Also patch resource if it's a Request object with headers
    if (resource instanceof Request && isInternal) {
        const auth = resource.headers.get('Authorization');
         if (auth && (auth === 'Bearer null' || auth === 'Bearer ')) {
             resource.headers.delete('Authorization');
         }
    }
    
    return originalFetch.call(this, resource, config);
};
`;
            content = content + '\n' + monkeypatch;
        }
    }

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        changedFiles++;
    }
}

console.log(`Successfully cleaned legacy token checks and patched api.js. Modified \${changedFiles} files.`);
