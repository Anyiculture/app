const fs = require('fs');
const path = require('path');

const files = [
  'src/i18n/locales/en.json',
  'src/i18n/locales/zh.json'
];

files.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    JSON.parse(content);
    console.log(`✅ ${file} is valid JSON`);
  } catch (error) {
    console.error(`❌ ${file} is INVALID JSON`);
    console.error(error.message);
  }
});
