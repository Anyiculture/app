import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getKeys(obj, prefix = '') {
  let keys = [];
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys = keys.concat(getKeys(obj[key], `${prefix}${key}.`));
    } else {
      keys.push(`${prefix}${key}`);
    }
  }
  return keys;
}

const enPath = path.join(__dirname, 'src/i18n/locales/en.json');
const zhPath = path.join(__dirname, 'src/i18n/locales/zh.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const zh = JSON.parse(fs.readFileSync(zhPath, 'utf8'));

const enKeys = new Set(getKeys(en));
const zhKeys = new Set(getKeys(zh));

console.log('--- Keys in EN but not in ZH ---');
const missingInZh = [...enKeys].filter(k => !zhKeys.has(k)).sort();
missingInZh.forEach(k => console.log(k));

console.log('\n--- Keys in ZH but not in EN ---');
const missingInEn = [...zhKeys].filter(k => !enKeys.has(k)).sort();
missingInEn.forEach(k => console.log(k));
