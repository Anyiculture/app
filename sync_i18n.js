import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const enPath = path.join(__dirname, 'src/i18n/locales/en.json');
const zhPath = path.join(__dirname, 'src/i18n/locales/zh.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const zh = JSON.parse(fs.readFileSync(zhPath, 'utf8'));

function flattenKeys(obj, prefix = '', target = {}) {
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      flattenKeys(obj[key], fullKey, target);
    } else {
      target[fullKey] = obj[key];
    }
  }
  return target;
}

const flatZh = flattenKeys(zh);

// Helper to find a value in flatZh even if the prefix is slightly different
// e.g. if we are looking for 'events.myEvents.title' but flatZh only has 'myEvents.title'
function findValue(fullKey, flatTarget) {
  if (flatTarget[fullKey]) return flatTarget[fullKey];
  
  // Try suffixes for known structural discrepancies
  const parts = fullKey.split('.');
  if (parts.length > 1) {
    const suffix = parts.slice(1).join('.');
    if (flatTarget[suffix]) return flatTarget[suffix];
  }
  
  return null;
}

function sync(sourceObj, flatTarget, prefix = '') {
  const result = {};
  for (const key in sourceObj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof sourceObj[key] === 'object' && sourceObj[key] !== null && !Array.isArray(sourceObj[key])) {
      result[key] = sync(sourceObj[key], flatTarget, fullKey);
    } else {
      const existingValue = findValue(fullKey, flatTarget);
      result[key] = existingValue !== null ? existingValue : "TODO";
    }
  }
  return result;
}

const syncedZh = sync(en, flatZh);

fs.writeFileSync(zhPath, JSON.stringify(syncedZh, null, 2), 'utf8');
console.log('Successfully synchronized zh.json with en.json structure.');
