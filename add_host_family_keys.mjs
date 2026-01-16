import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const enPath = path.join(__dirname, 'src/i18n/locales/en.json');
const zhPath = path.join(__dirname, 'src/i18n/locales/zh.json');

const newKeys = {
  common: {
    confirmSaveTitle: "Save Changes?",
    confirmSaveMessage: "Are you sure you want to save these changes? This action is irreversible."
  },
  auPair: {
    onboarding: {
      hostFamily: {
        reviewDesc: "Please review all information before submitting. Click \"Edit\" to make changes."
      }
    }
  }
};

const cnKeys = {
  common: {
    confirmSaveTitle: "保存更改？",
    confirmSaveMessage: "您确定要保存这些更改吗？此操作无法撤消。"
  },
  auPair: {
    onboarding: {
      hostFamily: {
        reviewDesc: "请在提交前查看所有信息。点击“编辑”进行更改。"
      }
    }
  }
};

function deepMerge(target, source) {
  for (const key in source) {
    if (source[key] instanceof Object && key in target) {
      Object.assign(source[key], deepMerge(target[key], source[key]));
    }
  }
  Object.assign(target || {}, source);
  return target;
}

async function updateFile(filePath, keys) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let json = JSON.parse(content);
    
    // Simple deep merge for this specific structure
    if (!json.common) json.common = {};
    Object.assign(json.common, keys.common);

    if (json.auPair && json.auPair.onboarding && json.auPair.onboarding.hostFamily) {
        Object.assign(json.auPair.onboarding.hostFamily, keys.auPair.onboarding.hostFamily);
    } else {
        // Fallback if structure is missing (unlikely given previous views)
        console.log("Deep structure missing, merging manually");
        // Reuse deepMerge helper
         deepMerge(json, keys);
    }
    
    fs.writeFileSync(filePath, JSON.stringify(json, null, 2));
    console.log(`Updated ${filePath}`);
  } catch (err) {
    console.error(`Error updating ${filePath}:`, err);
  }
}

updateFile(enPath, newKeys);
updateFile(zhPath, cnKeys);
