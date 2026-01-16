import fs from 'fs';
import path from 'path';

const enPath = path.resolve('src/i18n/locales/en.json');
const zhPath = path.resolve('src/i18n/locales/zh.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const zh = JSON.parse(fs.readFileSync(zhPath, 'utf8'));

const newKeys = {
  "events": {
    "foundCount": "Found {{count}} events",
    "savedCount": "Saved {{count}} events"
  },
  "education": {
    "browse": {
      "foundCount": "Found {{count}} programs",
      "savedCount": "Saved {{count}} programs"
    }
  },
  "common": {
      "backTo": "Back to"
  }
};

const zhTranslations = {
  "events": {
    "foundCount": "找到 {{count}} 个活动",
    "savedCount": "收藏了 {{count}} 个活动"
  },
  "education": {
    "browse": {
      "foundCount": "找到 {{count}} 个项目",
      "savedCount": "收藏了 {{count}} 个项目"
    }
  },
  "common": {
      "backTo": "返回"
  }
};

function deepMerge(target, source) {
  for (const key in source) {
    if (source[key] instanceof Object && key in target && target[key] instanceof Object) {
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

try {
  deepMerge(en, newKeys);
  deepMerge(zh, zhTranslations);
  fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
  fs.writeFileSync(zhPath, JSON.stringify(zh, null, 2));
  console.log('✅ Updated en.json and zh.json with Events and Education browse keys.');
} catch (error) {
  console.error('❌ Error updating translations:', error.message);
  process.exit(1);
}
