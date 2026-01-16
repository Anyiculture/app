import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, 'src/i18n/locales/en.json');

try {
  const content = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(content);
  
  const keysToCheck = [
    'dashboard.platformStatus',
    'dashboard.smoothRunning',
    'dashboard.joinMembers',
    'common.viewAsSeeker',
    'common.editProfile',
    'common.basedOnPreferences'
  ];
  
  function getValue(obj, path) {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  }
  
  keysToCheck.forEach(key => {
    const val = getValue(data, key);
    if (val) {
      console.log(`✅ Found ${key}: "${val}"`);
    } else {
      console.log(`❌ MISSING ${key}`);
    }
  });

} catch (e) {
  console.error(e.message);
}
