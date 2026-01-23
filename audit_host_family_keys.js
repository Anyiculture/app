import { readFileSync } from 'fs';

try {
  const componentCode = readFileSync('src/components/HostFamilyOnboarding.tsx', 'utf-8');
  let zh;
  try {
    zh = JSON.parse(readFileSync('src/i18n/locales/zh.json', 'utf-8'));
  } catch (e) {
    console.error('Error parsing zh.json:', e.message);
    process.exit(1);
  }

  // Regex to find t('key') or t("key")
  const regex = /t\(['"]([^'"]+)['"]\)/g;
  let match;
  const keys = new Set();
  
  while ((match = regex.exec(componentCode)) !== null) {
    keys.add(match[1]);
  }

  // Also manually add keys constructed dynamically if any (didn't see obvious ones, but being safe)
  
  function check(obj, key) {
    const parts = key.split('.');
    let curr = obj;
    for (const part of parts) {
      if (!curr || !curr[part]) return false;
      curr = curr[part];
    }
    return true;
  }

  console.log(`Found ${keys.size} distinct translation keys in HostFamilyOnboarding.tsx`);
  
  let missing = 0;
  keys.forEach(k => {
    if (!check(zh, k)) {
      console.log('MISSING in zh: ' + k);
      missing++;
    }
  });

  if (missing === 0) {
    console.log('All keys present in zh.json!');
  } else {
    console.log(`Found ${missing} missing keys in zh.json`);
  }

} catch (e) {
  console.error(e);
}
