const fs = require('fs');
const path = require('path');

const filePath = path.resolve('src/i18n/locales/en.json');
console.log('Reading:', filePath);
const content = fs.readFileSync(filePath, 'utf8');

function findDuplicateKeys(obj, path = '') {
    const keys = new Set();
    const duplicates = [];
    
    if (typeof obj !== 'object' || obj === null) return [];
    
    for (const key in obj) {
        if (keys.has(key)) {
            duplicates.push(path + '.' + key);
        }
        keys.add(key);
        if (typeof obj[key] === 'object') {
            duplicates.push(...findDuplicateKeys(obj[key], path + '.' + key));
        }
    }
    return duplicates;
}

try {
    const parsed = JSON.parse(content);
    console.log("JSON is valid!");
    // JSON.parse ignores duplicate keys (last one wins), but we can find them via some tricks or regex if needed.
    // For standard JSON.parse, it doesn't throw on duplicates.
} catch (e) {
    console.error("JSON Error:", e.message);
    const match = e.message.match(/at position (\d+)/);
    if (match) {
        const pos = parseInt(match[1]);
        const start = Math.max(0, pos - 100);
        const end = Math.min(content.length, pos + 100);
        console.log("Error around position:", pos);
        console.log("Snippet:");
        console.log(content.substring(start, pos) + ">>>" + content.substring(pos, end));
        
        const lines = content.substring(0, pos).split('\n');
        console.log("Line number (approx):", lines.length);
    }
}
