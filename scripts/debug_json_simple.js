

import fs from 'fs';
import path from 'path';

try {
  const filePath = path.join(process.cwd(), 'src', 'i18n', 'locales', 'zh.json');
  console.log('Reading file:', filePath);
  const content = fs.readFileSync(filePath, 'utf8');
  const pos = 102021;
  const start = Math.max(0, pos - 100);
  const end = Math.min(content.length, pos + 100);
  console.log('--- START CONTEXT ---');
  console.log(content.substring(start, end));
  console.log('--- END CONTEXT ---');
  
  // Find line number
  let line = 1;
  for(let i=0; i<pos; i++) {
    if(content[i] === '\n') line++;
  }
  console.log('Line Number:', line);
} catch(e) {
  console.error('Script Error:', e);
}

