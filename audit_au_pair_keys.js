import { readFileSync } from 'fs';

// Helper to check key existence in JSON object
function check(obj, key) {
  const parts = key.split('.');
  let curr = obj;
  for (const part of parts) {
    if (!curr || !curr[part]) return false;
    curr = curr[part];
  }
  return true;
}

try {
  const componentCode = readFileSync('src/components/AuPairOnboarding.tsx', 'utf-8');
  let zh;
  let en;
  try {
    zh = JSON.parse(readFileSync('src/i18n/locales/zh.json', 'utf-8'));
    en = JSON.parse(readFileSync('src/i18n/locales/en.json', 'utf-8'));
  } catch (e) {
    console.error('Error parsing locale files:', e.message);
    process.exit(1);
  }

  const keys = new Set();
  const missingInZh = [];
  const missingInEn = [];

  // 1. Extract static t('key') calls
  const regex = /t\(['"]([^'"]+)['"]\)/g;
  let match;
  while ((match = regex.exec(componentCode)) !== null) {
    keys.add(match[1]);
  }

  // 2. Extract dynamic keys from Options arrays
  // We'll mimic the detailed extraction based on the known structure in the file
  
  // Mappings from the file
  const CATEGORIES = {
    "hobbies": "auPair.onboarding.options.hobbies",
    "traits": "auPair.onboarding.options.traits",
    "workStyle": "auPair.onboarding.options.workStyle",
    "ageComfort": "auPair.onboarding.options.ageComfort",
    "skills": "auPair.onboarding.options.skills",
    "rules": "auPair.onboarding.options.rules",
    "familyType": "auPair.onboarding.options.familyType",
    "languages": "auPair.onboarding.languages"
  };

  // Helper to extract IDs from source code text for a given option array name
  function extractIds(varName) {
    // Look for const varName = [ ... ]
    // non-greedy match until ]
    const arrayRegex = new RegExp(`const ${varName} = \\s*\\[([\\s\\S]*?)\\]`, 'm');
    const match = arrayRegex.exec(componentCode);
    if (!match) return [];
    
    const content = match[1];
    const ids = [];
    // Look for { id: 'value'
    const idRegex = /id:\s*['"]([^'"]+)['"]/g;
    let idMatch;
    while ((idMatch = idRegex.exec(content)) !== null) {
      ids.push(idMatch[1]);
    }
    return ids;
  }

  const hobbiesIds = extractIds('hobbiesOptions');
  hobbiesIds.forEach(id => keys.add(`${CATEGORIES.hobbies}.${id}`));

  const personalityIds = extractIds('personalityOptions');
  personalityIds.forEach(id => keys.add(`${CATEGORIES.traits}.${id}`));
  
  const workStyleIds = extractIds('workStyleOptions');
  workStyleIds.forEach(id => keys.add(`${CATEGORIES.workStyle}.${id}`));
  
  const ageComfortIds = extractIds('ageComfortOptions');
  ageComfortIds.forEach(id => keys.add(`${CATEGORIES.ageComfort}.${id}`));
  
  const skillsIds = extractIds('skillsOptions');
  skillsIds.forEach(id => keys.add(`${CATEGORIES.skills}.${id}`));
  
  const rulesIds = extractIds('rulesComfortOptions');
  rulesIds.forEach(id => keys.add(`${CATEGORIES.rules}.${id}`));
  
  const familyTypeIds = extractIds('familyTypeOptions');
  familyTypeIds.forEach(id => keys.add(`${CATEGORIES.familyType}.${id}`));
  
  // Language keys seem to be dynamic but handled
  // getTranslatedOptions('languages', ...) isn't actually usage, it was getTranslatedOptions('hobbies', ...) etc.
  // But wait, the file has:
  /*
    const languageOptions = [
    { id: 'English', label: t('auPair.onboarding.languages.english') || 'English' },
    ...
    ]
  */
  // These are caught by Step 1 regex because they are explicit t() calls.
  // But let's check `getTranslatedOptions` calls to see if we missed any categories.
  // The file has: getTranslatedOptions('hobbies', hobbiesOptions) -> hobbies defined above.
  
  // So we are good.

  // 3. Verify keys
  let brokenCount = 0;
  keys.forEach(k => {
    let missingZh = !check(zh, k);
    let missingEn = !check(en, k);
    
    if (missingZh) missingInZh.push(k);
    if (missingEn) missingInEn.push(k);
    
    if (missingZh || missingEn) brokenCount++;
  });

  console.log(`Audited ${keys.size} keys.`);
  console.log(`Missing in EN: ${missingInEn.length}`);
  if (missingInEn.length > 0) console.log(missingInEn);
  
  console.log(`Missing in ZH: ${missingInZh.length}`);
  if (missingInZh.length > 0) {
      missingInZh.forEach(k => console.log(`zh_missing: ${k}`));
  }

} catch (e) {
  console.error("Script error:", e);
}
