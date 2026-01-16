
import fs from 'fs';
try {
  const content = fs.readFileSync('C:/Users/OMEN/OneDrive/Desktop/Anicient tech/Anyiculture_final-main/Anyiculture_final-main/src/i18n/locales/zh.json', 'utf8');
  JSON.parse(content);
  console.log("JSON is valid!");
} catch (error) {
  console.log("JSON Error:", error.message);
  // print context around error
  if (error.message.includes('position')) {
    const pos = parseInt(error.message.match(/position (\d+)/)[1]);
    console.log(content.substring(Math.max(0, pos - 50), Math.min(content.length, pos + 50)));
  }
}
