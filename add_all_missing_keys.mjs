import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const reportPath = path.join(__dirname, 'missing_keys_report.json');
const enPath = path.join(__dirname, 'src/i18n/locales/en.json');

try {
  const reportContent = fs.readFileSync(reportPath, 'utf8');
  const missingKeysStructure = JSON.parse(reportContent);
  
  const enContent = fs.readFileSync(enPath, 'utf8');
  const enData = JSON.parse(enContent);
  
  function formatValue(key) {
    // Convert camelCase to Space Separated
    const lastPart = key.split('.').pop();
    const spaced = lastPart.replace(/([A-Z])/g, ' $1').trim();
    // Capitalize first letter
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
  }

  let addedCount = 0;

  function mergeStructure(target, source, prefix = '') {
    for (const key in source) {
       const fullPath = prefix ? `${prefix}.${key}` : key;
      if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
        // Recurse
        if (!target[key] || typeof target[key] !== 'object') {
            target[key] = {}; // Create object if doesn't exist or is a string (collision)
        }
        mergeStructure(target[key], source[key], fullPath);
      } else if (typeof source[key] === 'string' && source[key].startsWith('[MISSING]')) {
        // It's a missing key leaf
        if (!target[key]) {
           target[key] = formatValue(fullPath);
           addedCount++;
        }
      }
    }
  }

  console.log("Merging missing keys into en.json...");
  mergeStructure(enData, missingKeysStructure);
  
  fs.writeFileSync(enPath, JSON.stringify(enData, null, 2));
  console.log(`✅ Successfully added ${addedCount} missing keys to en.json`);

} catch (e) {
  console.error(e);
}
