
const fs = require('fs');
const buffer = fs.readFileSync('src/i18n/locales/zh.json');
const targetOffset = 102021;

let line = 1;
let lastNewline = 0;
for (let i = 0; i < targetOffset && i < buffer.length; i++) {
  if (buffer[i] === 10) { // \n
    line++;
    lastNewline = i;
  }
}

console.log('Offset ' + targetOffset + ' corresponds to line: ' + line);
console.log('Context around offset:');
const start = Math.max(0, targetOffset - 50);
const end = Math.min(buffer.length, targetOffset + 50);
console.log(buffer.slice(start, end).toString());
