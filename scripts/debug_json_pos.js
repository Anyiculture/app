
const fs = require('fs');
const content = fs.readFileSync('src/i18n/locales/zh.json', 'utf8');
const pos = 102021;
const start = Math.max(0, pos - 100);
const end = Math.min(content.length, pos + 100);
console.log('Context around position ' + pos + ':');
console.log('--------------------------------------------------');
console.log(content.substring(start, end));
console.log('--------------------------------------------------');
console.log('Target char: >>>' + content[pos] + '<<<');

// Also try to find line number manually
let line = 1;
for(let i=0; i<pos; i++) {
  if(content[i] === '\n') line++;
}
console.log('Calculated Line Number:', line);
