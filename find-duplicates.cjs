const fs = require('fs');

const content = fs.readFileSync('src/i18n/locales/zh.json', 'utf-8');
const lines = content.split('\n');
const keys = [];

lines.forEach((line, index) => {
  const match = line.match(/^\s*"([^"]+)":/);
  if (match) {
    // Check indentation to guess level (rough check)
    const indentation = line.search(/\S/);
    if (indentation === 2) { // Top level usually 2 spaces indent in this file
       keys.push({ key: match[1], line: index + 1 });
       console.log(`Found top-level key: ${match[1]} at line ${index + 1}`);
    }
  }
});

// Check for duplicates
const counts = {};
keys.forEach(k => {
  counts[k.key] = (counts[k.key] || 0) + 1;
});

Object.keys(counts).forEach(key => {
  if (counts[key] > 1) {
    console.log(`DUPLICATE KEY FOUND: ${key}`);
    keys.filter(k => k.key === key).forEach(k => console.log(`  - at line ${k.line}`));
  }
});
