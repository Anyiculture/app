const fs = require('fs');
const path = 'src/i18n/locales/en.json';

try {
  const fileContent = fs.readFileSync(path, 'utf8');
  JSON.parse(fileContent);
  console.log('JSON is valid');
} catch (e) {
  console.error('JSON Error:', e.message);
  // detailed position
  if (e.message.indexOf('at position') !== -1) {
    const pos = parseInt(e.message.split('at position ')[1]);
    const before = fileContent.substring(Math.max(0, pos - 50), pos);
    const after = fileContent.substring(pos, Math.min(fileContent.length, pos + 50));
    console.log('Context:');
    console.log(before + ' >>>ERROR<<< ' + after);
  }
}
