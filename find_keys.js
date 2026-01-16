const fs = require('fs');

const bgPath = 'src/i18n/locales/en.json';

try {
  const content = fs.readFileSync(bgPath, 'utf8');
  console.log(`File size: ${content.length} bytes`);
  
  const lines = content.split('\n');
  
  const keysToFind = ['"common"', '"postJob"', '"admin"', '"todo"', '"TODO"'];
  
  keysToFind.forEach(key => {
    const validLines = [];
    lines.forEach((line, idx) => {
      if (line.includes(key)) {
        validLines.push(idx + 1);
      }
    });
    
    if (validLines.length > 0) {
      console.log(`Found ${key} at lines: ${validLines.join(', ')}`);
    } else {
      console.log(`Did not find ${key}`);
    }
  });
  
} catch (e) {
  console.error(e);
}
