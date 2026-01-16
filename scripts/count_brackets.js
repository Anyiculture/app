
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'src', 'i18n', 'locales', 'zh.json');
const content = fs.readFileSync(filePath, 'utf8');

let level = 0;
for (let i = 0; i < content.length; i++) {
  const char = content[i];
  if (char === '{') {
    level++;
  } else if (char === '}') {
    level--;
    if (level < 0) {
      console.log('Negative nesting level at offset ' + i);
      // print context
      console.log(content.substring(Math.max(0, i-50), Math.min(content.length, i+50)));
      break;
    }
  }
}

console.log('Final nesting level: ' + level);
if (level > 0) {
  console.log('File ends with ' + level + ' unclosed braces');
}
