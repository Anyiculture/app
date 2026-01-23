const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, 'src', 'i18n', 'locales', 'en.json');
const zhPath = path.join(__dirname, 'src', 'i18n', 'locales', 'zh.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const zh = JSON.parse(fs.readFileSync(zhPath, 'utf8'));

const keysToCheck = [
    'auPair.profile.available',
    'auPair.role.au_pair',
    'auPair.role.host_family',
    'admin.auPairManagement',
    'auPair.onboarding.options.housing.house',
    'hostFamily.profile.premiumMatch',
    'hostFamily.profile.premiumMatchDesc'
];

let errors = [];

function getValue(obj, keyPath) {
    return keyPath.split('.').reduce((acc, key) => acc && acc[key], obj);
}

console.log('Checking keys...');

console.log('EN Top Level Keys:', Object.keys(en));
console.log('ZH Top Level Keys:', Object.keys(zh));

if (en.auPair && en.auPair.role) console.log('EN auPair.role:', en.auPair.role);
else console.log('EN auPair.role: MISSING');

if (zh.auPair && zh.auPair.role) console.log('ZH auPair.role:', zh.auPair.role);
else console.log('ZH auPair.role: MISSING');

keysToCheck.forEach(key => {
    const enVal = getValue(en, key);
    const zhVal = getValue(zh, key);
    
    if (!enVal) errors.push(`Missing in EN: ${key}`);
    else console.log(`[OK] EN ${key}: ${enVal}`);
    
    if (!zhVal) errors.push(`Missing in ZH: ${key}`);
    else console.log(`[OK] ZH ${key}: ${zhVal}`);
});

if (errors.length > 0) {
    console.error('Validation Failed:');
    errors.forEach(e => console.error(e));
    process.exit(1);
} else {
    console.log('All Translation Gap keys present in both languages.');
}
