
import fs from 'fs';
const content = fs.readFileSync('C:/Users/OMEN/OneDrive/Desktop/Anicient tech/Anyiculture_final-main/Anyiculture_final-main/src/i18n/locales/zh.json', 'utf8');
const offset = 78792;
const start = Math.max(0, offset - 100);
const end = Math.min(content.length, offset + 100);
console.log('Context around ' + offset + ':');
console.log(content.substring(start, end));
console.log('--- At offset: ---');
console.log(content.substring(offset, offset + 1));
