import { readFileSync } from 'fs';
const content = readFileSync('src/i18n/locales/zh.json', 'utf-8');
let balance = 0;
let inString = false;
let escape = false;

for (let i = 0; i < content.length; i++) {
  const c = content[i];
  if (inString) {
    if (escape) {
      escape = false;
    } else if (c === '\\') {
      escape = true;
    } else if (c === '"') {
      inString = false;
    }
  } else {
    if (c === '"') {
      inString = true;
    } else if (c === '{') {
      balance++;
    } else if (c === '}') {
      balance--;
    }
  }
}
console.log('Final Balance:', balance);
