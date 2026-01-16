import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const enPath = path.join(__dirname, 'src/i18n/locales/en.json');
const zhPath = path.join(__dirname, 'src/i18n/locales/zh.json');
const reportPath = path.join(__dirname, 'missing_keys_report.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const zh = JSON.parse(fs.readFileSync(zhPath, 'utf8'));
let missingKeys = {};

if (fs.existsSync(reportPath)) {
    missingKeys = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
}

function mergeDeep(target, source, prefix = '') {
    const isObject = (obj) => obj && typeof obj === 'object';

    if (!isObject(target) || !isObject(source)) {
        return source;
    }

    Object.keys(source).forEach(key => {
        const targetValue = target[key];
        const sourceValue = source[key];

        if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
            target[key] = targetValue.concat(sourceValue);
        } else if (isObject(targetValue) && isObject(sourceValue)) {
            target[key] = mergeDeep(Object.assign({}, targetValue), sourceValue, prefix ? `${prefix}.${key}` : key);
        } else {
            if (targetValue === undefined) {
                 // Value is missing in target.
                 // If sourceValue is a string like "[MISSING] key.path", clean it up.
                 if (typeof sourceValue === 'string' && sourceValue.startsWith('[MISSING] ')) {
                     const cleanKey = sourceValue.replace('[MISSING] ', '');
                     // Generate a human readable string from the key
                     const parts = cleanKey.split('.');
                     const lastPart = parts[parts.length - 1];
                     // Convert camelCase to Title Case
                     const readable = lastPart
                        .replace(/([A-Z])/g, ' $1')
                        .replace(/^./, (str) => str.toUpperCase())
                        .trim();
                     
                     target[key] = readable;
                 } else {
                     target[key] = sourceValue;
                 }
                 console.log(`Added missing key: ${prefix ? `${prefix}.${key}` : key}`);
            }
        }
    });

    return target;
}

console.log("Merging missing keys into en.json...");
mergeDeep(en, missingKeys);

console.log("Merging missing keys into zh.json...");
// For ZH, we merge the same structure. 
// Ideally we want to mark them as untranslated.
function mergeDeepZh(target, source, prefix = '') {
    const isObject = (obj) => obj && typeof obj === 'object';

    if (!isObject(target) || !isObject(source)) {
        return source;
    }

    Object.keys(source).forEach(key => {
        const targetValue = target[key];
        const sourceValue = source[key];

        if (isObject(targetValue) && isObject(sourceValue)) {
            target[key] = mergeDeepZh(Object.assign({}, targetValue), sourceValue, prefix ? `${prefix}.${key}` : key);
        } else {
            if (targetValue === undefined) {
                 if (typeof sourceValue === 'string' && sourceValue.startsWith('[MISSING] ')) {
                     const cleanKey = sourceValue.replace('[MISSING] ', '');
                     const parts = cleanKey.split('.');
                     const lastPart = parts[parts.length - 1];
                     const readable = lastPart
                        .replace(/([A-Z])/g, ' $1')
                        .replace(/^./, (str) => str.toUpperCase())
                        .trim();
                     target[key] = `[ZH] ${readable}`;
                 } else {
                     target[key] = `[ZH] ${sourceValue}`;
                 }
            }
        }
    });

    return target;
}
mergeDeepZh(zh, missingKeys);

// Now sync EN and ZH to ensure they have the same keys
function syncKeys(obj1, obj2, prefix = '') {
    // Add keys from obj2 to obj1
    Object.keys(obj2).forEach(key => {
        if (obj1[key] === undefined) {
            if (typeof obj2[key] === 'object') {
                obj1[key] = {};
                syncKeys(obj1[key], obj2[key], `${prefix}${key}.`);
            } else {
                obj1[key] = obj2[key]; // Copy value as placeholder
                console.log(`Synced key from other locale: ${prefix}${key}`);
            }
        } else if (typeof obj1[key] === 'object' && typeof obj2[key] === 'object') {
            syncKeys(obj1[key], obj2[key], `${prefix}${key}.`);
        }
    });
}

console.log("Syncing EN keys to ZH...");
syncKeys(zh, en);
console.log("Syncing ZH keys to EN...");
syncKeys(en, zh);


fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
fs.writeFileSync(zhPath, JSON.stringify(zh, null, 2));

console.log("Done! Locales updated.");
