import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, 'src/i18n/locales/en.json');

try {
  const content = fs.readFileSync(filePath, 'utf8');
  // Parse (removes duplicates, keeping last one)
  const data = JSON.parse(content);
  // Write back formatted
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log("✅ en.json cleaned and deduped.");
} catch (e) {
  console.error("❌ Failed to clean JSON:", e.message);
}
