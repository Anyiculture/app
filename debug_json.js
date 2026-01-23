const fs = require('fs');

const filePath = 'src/i18n/locales/en.json';
const content = fs.readFileSync(filePath, 'utf8');

try {
    JSON.parse(content);
    console.log("JSON is valid!");
} catch (e) {
    console.error("JSON Error:", e.message);
    const match = e.message.match(/position (\d+)/);
    if (match) {
        const pos = parseInt(match[1]);
        const start = Math.max(0, pos - 100);
        const end = Math.min(content.length, pos + 100);
        console.log("Error around position:", pos);
        console.log("Snippet:");
        console.log(content.substring(start, pos) + ">>>" + content.substring(pos, end));
        
        // Find line number
        const lines = content.substring(0, pos).split('\n');
        console.log("Line number (approx):", lines.length);
    }
}
