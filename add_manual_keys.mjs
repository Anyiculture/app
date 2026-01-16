import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const enPath = path.join(__dirname, 'src/i18n/locales/en.json');
const zhPath = path.join(__dirname, 'src/i18n/locales/zh.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const zh = JSON.parse(fs.readFileSync(zhPath, 'utf8'));

const newKeys = {
    settings: {
        profileSettings: "Profile Settings",
        editAuPairProfile: "Edit Au Pair Profile"
    },
    auPair: {
        profile: {
            bioDesc: "Personal Biography & Introduction",
            bioPlaceholder: "Tell families about yourself...",
            historyIdentity: "Childcare History & Identity",
            commSkills: "Communication Skills",
            languagesSpoken: "Languages Spoken (comma separated)",
            languagesPlaceholder: "English, Chinese, Spanish..."
        }
    },
    admin: {
        stats: {
            activeUsers: "Active Users",
            interactions: "Interactions"
        },
        feed: {
            live: "Live Feed"
        },
        modules: {
            jobsDesc: "Control and moderate professional job listings"
        },
        common: {
            views: "Views",
            apps: "Apps"
        },
        users: {
            profileStatus: "Profile Status",
            createdAt: "Created At",
            userId: "User ID",
            rawMetadata: "Raw Metadata"
        }
    }
};

const newKeysZh = {
    settings: {
        profileSettings: "个人资料设置",
        editAuPairProfile: "编辑互惠生资料"
    },
    auPair: {
        profile: {
            bioDesc: "个人简介与介绍",
            bioPlaceholder: "向家庭介绍一下你自己...",
            historyIdentity: "育儿经历与身份",
            commSkills: "沟通能力",
            languagesSpoken: "语言能力（逗号分隔）",
            languagesPlaceholder: "英语，中文，西班牙语..."
        }
    },
    admin: {
        stats: {
            activeUsers: "活跃用户",
            interactions: "互动"
        },
        feed: {
            live: "实时动态"
        },
        modules: {
            jobsDesc: "管理和审核专业职位列表"
        },
        common: {
            views: "浏览",
            apps: "申请"
        },
        users: {
            profileStatus: "资料状态",
            createdAt: "创建于",
            userId: "用户ID",
            rawMetadata: "原始元数据"
        }
    }
};

function mergeDeep(target, source) {
    const isObject = (obj) => obj && typeof obj === 'object';
    if (!isObject(target) || !isObject(source)) return source;

    Object.keys(source).forEach(key => {
        const targetValue = target[key];
        const sourceValue = source[key];

        if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
            // target[key] = targetValue.concat(sourceValue); // Don't concat arrays for now
        } else if (isObject(targetValue) && isObject(sourceValue)) {
            target[key] = mergeDeep(Object.assign({}, targetValue), sourceValue);
        } else {
            if (target[key] === undefined) {
                target[key] = sourceValue;
            } else if (typeof target[key] === 'string' && typeof sourceValue === 'object') {
                 console.log(`Conflict at ${key}: existing string vs new object. Merging...`);
                 target[key] = mergeDeep({ title: target[key] }, sourceValue);
            }
        }
    });
    return target;
}

mergeDeep(en, newKeys);
mergeDeep(zh, newKeysZh);

fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
fs.writeFileSync(zhPath, JSON.stringify(zh, null, 2));

console.log('Added batch 2 keys.');
