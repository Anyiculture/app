const fs = require('fs');

// Load locale files
const en = JSON.parse(fs.readFileSync('src/i18n/locales/en.json', 'utf-8'));
const zh = JSON.parse(fs.readFileSync('src/i18n/locales/zh.json', 'utf-8'));

// Translation keys used in HostFamilyOnboarding
const keys = [
  // Step 1
  'auPair.onboarding.familyName',
  'auPair.onboarding.familyNamePlaceholder',
  'auPair.onboarding.adultsAndKids',
  'auPair.onboarding.totalMembers',
  'auPair.onboarding.children',
  'auPair.onboarding.location',
  'auPair.onboarding.homeType',
  'auPair.onboarding.householdVibe',
  'auPair.onboarding.homeTypeHouse',
  'auPair.onboarding.homeTypeApartment',
  'auPair.onboarding.homeTypeFarm',
  'auPair.onboarding.homeTypeTownhouse',
  'auPair.onboarding.vibeActive',
  'auPair.onboarding.vibeCalm',
  'auPair.onboarding.vibeCreative',
  'auPair.onboarding.vibeIntellectual',
  'auPair.onboarding.vibeSocial',
  'auPair.onboarding.vibeStructured',
  'auPair.onboarding.vibeRelaxed',
  'auPair.onboarding.vibeNature',
  // Step 2
  'auPair.onboarding.questionParenting',
  'auPair.onboarding.options.parentingDescription',
  'auPair.onboarding.questionDiscipline',
  // New Au Pair Options
  'auPair.onboarding.options.hobbies.reading',
  'auPair.onboarding.options.traits.energetic',
  'auPair.onboarding.options.workStyle.initiative',
  'auPair.onboarding.options.ageComfort.infants',
  'auPair.onboarding.options.skills.cooking',
  'auPair.onboarding.options.rules.curfew',
  'auPair.onboarding.options.rules.vegan',
  'auPair.onboarding.options.rules.vegan',
  'auPair.onboarding.options.familyType.active',
  'auPair.onboarding.options.gender.female',
  // Host Family Specific
  'hostFamily.familyName',
  'admin.auPair.columns.children',
  // Step 3
  'auPair.onboarding.questionRules',
  'auPair.onboarding.questionRulesDetails',
  'auPair.onboarding.elaborateRulesPlaceholder',
  // Common
  'common.back',
  'common.edit',
  'common.editProfile',
  'common.adminBypass',
  'common.adminBypassDesc',
  'common.name',
  'common.location',
  'common.select',
  'common.months',
  'common.photos',
  'common.uploaded',
  'common.video',
  'common.yes',
  'common.no',
  'common.saving',
  'common.saveChanges',
  'common.confirmSaveTitle',
  'common.confirmSaveMessage',
  'common.startDate'
];

function checkKey(key, obj) {
  const parts = key.split('.');
  let current = obj;
  for (const part of parts) {
    if (!current || typeof current !== 'object' || !(part in current)) {
      return false;
    }
    current = current[part];
  }
  return true;
}

console.log('Checking HostFamilyOnboarding translation keys...\n');

const missing_en = [];
const missing_zh = [];

keys.forEach(key => {
  const en_exists = checkKey(key, en);
  const zh_exists = checkKey(key, zh);
  
  if (!en_exists) missing_en.push(key);
  if (!zh_exists) missing_zh.push(key);
  
  const status_en = en_exists ? '✓' : '✗';
  const status_zh = zh_exists ? '✓' : '✗';
  
  console.log(`${status_en} EN | ${status_zh} ZH | ${key}`);
});

console.log(`\n=== SUMMARY ===`);
console.log(`Total keys checked: ${keys.length}`);
console.log(`Missing in EN: ${missing_en.length}`);
console.log(`Missing in ZH: ${missing_zh.length}`);

if (missing_en.length > 0) {
  console.log(`\n=== MISSING IN EN.JSON ===`);
  missing_en.forEach(k => console.log(k));
}

if (missing_zh.length > 0) {
  console.log(`\n=== MISSING IN ZH.JSON ===`);
  missing_zh.forEach(k => console.log(k));
}
