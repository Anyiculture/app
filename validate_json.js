import fs from 'fs';

try {
  const content = fs.readFileSync('src/i18n/locales/en.json', 'utf8');
  JSON.parse(content);
  console.log('en.json is valid');
} catch (e) {
  console.error('en.json error:', e.message);
}

try {
  const content = fs.readFileSync('src/i18n/locales/zh.json', 'utf8');
  JSON.parse(content);
  console.log('zh.json is valid');
} catch (e) {
  console.error('zh.json error:', e.message);
}
