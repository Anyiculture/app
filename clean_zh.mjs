import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, 'src/i18n/locales/zh.json');

try {
  if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log("✅ zh.json cleaned and deduped.");
  } else {
      console.log("⚠️ zh.json not found.");
  }
} catch (e) {
  console.error("❌ Failed to clean zh.json:", e.message);
}
