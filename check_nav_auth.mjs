import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, 'src/i18n/locales/en.json');

try {
  const content = fs.readFileSync(filePath, 'utf8');
  console.log(`File match "nav": ${content.includes('"nav"')}`);
  console.log(`File match "auth": ${content.includes('"auth"')}`);
  
  // Check for value "todo"
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    if (line.toLowerCase().includes('todo')) {
      console.log(`Line ${i+1} has 'todo': ${line.trim()}`);
    }
  });

  const data = JSON.parse(content);
  if (data.nav) {
      console.log("✅ 'nav' key exists.");
      console.log("nav keys:", Object.keys(data.nav));
  } else {
      console.log("❌ 'nav' key MISSING.");
  }
  
  if (data.auth) {
      console.log("✅ 'auth' key exists.");
  } else {
      console.log("❌ 'auth' key MISSING.");
  }

} catch (e) {
  console.error(e.message);
}
