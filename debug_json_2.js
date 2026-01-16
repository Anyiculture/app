
import fs from 'fs';
const content = fs.readFileSync('C:/Users/OMEN/OneDrive/Desktop/Anicient tech/Anyiculture_final-main/Anyiculture_final-main/src/i18n/locales/zh.json', 'utf8');
const offset = 78792;
console.log('File length:', content.length);
console.log('Content from ' + offset + ' to ' + (offset + 200) + ':');
console.log(content.substring(offset, offset + 200));
