import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, 'src/i18n/locales/en.json');

try {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Custom parser to find duplicates
  const keys = new Set();
  const duplicates = [];
  
  // Simple regex scan for duplicates at same indentation level (imperfect but helps finding copy-paste errors)
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    const match = line.match(/"([^"]+)":/);
    if (match) {
        // This is very noisy for nested structures with same keys (e.g. "title" in multiple objects).
        // We only care if the JSON format is invalid.
    }
  });

  JSON.parse(content);
  console.log("✅ JSON is valid syntax.");
} catch (e) {
  console.log("❌ JSON Invalid:");
  console.log(e.message);
}
