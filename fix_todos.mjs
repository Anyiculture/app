import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const enPath = path.join(__dirname, 'src/i18n/locales/en.json');
const zhPath = path.join(__dirname, 'src/i18n/locales/zh.json');

try {
  const enContent = fs.readFileSync(enPath, 'utf8');
  const zhContent = fs.readFileSync(zhPath, 'utf8');
  
  const enData = JSON.parse(enContent);
  const zhData = JSON.parse(zhContent);
  
  let fixedCount = 0;
  let missingEnCount = 0;
  
  function traverse(node, pathStack, enNode) {
    for (const key in node) {
      if (typeof node[key] === 'object' && node[key] !== null) {
        if (enNode && enNode[key]) {
           traverse(node[key], [...pathStack, key], enNode[key]);
        } else {
           console.log(`⚠️ Key missing in EN: ${[...pathStack, key].join('.')}`);
           missingEnCount++;
           traverse(node[key], [...pathStack, key], null);
        }
      } else {
        const val = node[key];
        if (val === 'TODO' || (typeof val === 'string' && val.startsWith('[MISSING_EN]'))) {
          if (enNode && enNode[key]) {
             node[key] = enNode[key]; // Replace with English
             fixedCount++;
          } else {
             console.log(`❌ Value is TODO/MISSING in ZH and Key MISSING in EN: ${[...pathStack, key].join('.')}`);
             missingEnCount++;
             node[key] = `[MISSING_EN] ${key}`;
          }
        }
      }
    }
  }
  
  traverse(zhData, [], enData);
  
  console.log(`\nFixed ${fixedCount} keys.`);
  console.log(`Found ${missingEnCount} missing keys in EN.`);
  
  fs.writeFileSync(zhPath, JSON.stringify(zhData, null, 2));
  console.log("✅ Updated zh.json");

} catch (e) {
  console.error(e);
}
