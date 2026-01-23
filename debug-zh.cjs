const fs = require('fs');

try {
  const zh = JSON.parse(fs.readFileSync('src/i18n/locales/zh.json', 'utf-8'));
  console.log("ZH JSON is valid.");
  
  if (zh.auPair && zh.auPair.onboarding && zh.auPair.onboarding.options && zh.auPair.onboarding.options.gender) {
    console.log("auPair.onboarding.options.gender:", zh.auPair.onboarding.options.gender);
  } else {
    console.log("auPair.onboarding.options.gender NOT FOUND");
    if (zh.auPair) console.log("auPair exists");
    if (zh.auPair && zh.auPair.onboarding) console.log("auPair.onboarding exists");
    if (zh.auPair && zh.auPair.onboarding && zh.auPair.onboarding.options) {
        console.log("auPair.onboarding.options exists. Keys:", Object.keys(zh.auPair.onboarding.options));
    }
  }

} catch (e) {
  console.error("ZH JSON Error:", e.message);
}
