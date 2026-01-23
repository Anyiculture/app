
const fs = require('fs');
const path = require('path');

const files = [
    'src/i18n/locales/en.json',
    'src/i18n/locales/zh.json'
];

files.forEach(relativePath => {
    const filePath = path.join(__dirname, relativePath);
    console.log(`Processing ${filePath}...`);
    
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        // Parse JSON - this automatically discards duplicate keys (keeps last one)
        const data = JSON.parse(content);
        
        // Write back with consistent formatting
        const newContent = JSON.stringify(data, null, 2);
        
        if (content.length === newContent.length) {
             console.log(`No size change for ${relativePath}. (Might still be fixed if structure was identical)`);
        } else {
             console.log(`Size changed for ${relativePath}: ${content.length} -> ${newContent.length}`);
        }

        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`Successfully fixed ${relativePath}`);
    } catch (e) {
        console.error(`Error processing ${relativePath}:`, e);
    }
});
