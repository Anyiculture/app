const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, 'src', 'i18n', 'locales', 'en.json');
const zhPath = path.join(__dirname, 'src', 'i18n', 'locales', 'zh.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const zh = JSON.parse(fs.readFileSync(zhPath, 'utf8'));

const keysToCheck = [
    'common.back',
    'auPair.profile.safety',
    'auPair.profile.personalDetails',
    'auPair.profile.age',
    'auPair.profile.gender',
    'auPair.profile.nationality',
    'auPair.profile.educationLevel',
    'auPair.profile.fieldOfStudy',
    'auPair.profile.experienceYears',
    'auPair.profile.experience',
    'auPair.profile.bio',
    'auPair.profile.bioNotProvided',
    'auPair.preferredLocation',
    'auPair.duration',
    'auPair.startDate',
    'auPair.ageGroups',
    'auPair.aboutMe'
];

let errors = [];

function getValue(obj, keyPath) {
    return keyPath.split('.').reduce((acc, key) => acc && acc[key], obj);
}

keysToCheck.forEach(key => {
    if (!getValue(en, key)) errors.push(`Missing in EN: ${key}`);
    if (!getValue(zh, key)) errors.push(`Missing in ZH: ${key}`);
});

if (errors.length > 0) {
    console.error('Validation Failed:');
    errors.forEach(e => console.error(e));
    process.exit(1);
} else {
    console.log('All Au Pair keys present in both languages.');
}
