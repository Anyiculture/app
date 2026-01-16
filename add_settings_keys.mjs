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
        jobSeeker: {
            updateDesc: "Update your professional profile, skills, and experience.",
            applicationsDesc: "View and manage your job applications."
        },
        employer: {
            updateDesc: "Update your company details, logo, and contact information.",
            dashboard: "Employer Dashboard",
            dashboardDesc: "Manage your job postings and applicants.",
            goToDashboard: "Go to Dashboard"
        },
        hostFamily: {
            updateDesc: "Update your family description, house rules, and requirements.",
            viewDesc: "See how your profile looks to au pairs."
        },
        auPair: {
            updateDesc: "Update your availability, preferences, skills, and experience details.",
            viewDesc: "See how your profile looks to host families."
        },
        billing: {
            desc: "Manage your subscription and payment methods.",
            currentPlan: "Current Plan",
            premiumPlan: "Premium Plan",
            freePlan: "Free Plan",
            premium: "Premium",
            active: "Active",
            features: {
                basicProfile: "Basic Profile",
                unlimitedMessages: "Unlimited Messages",
                limitedMessages: "Limited Messages",
                premiumSupport: "Premium Support"
            },
            upgradePlan: "Upgrade Plan",
            redeemCode: "Redeem Code",
            redeemPlaceholder: "Enter code (e.g. VIP-123)",
            redeem: "Redeem",
            history: "Payment & Redemption History",
            noHistory: "No payment or redemption history available."
        },
        security: {
            desc: "Manage your password and account security settings.",
            passwordDesc: "Update your password to keep your account secure.",
            "2fa": "Two-Factor Authentication",
            "2faDesc": "Add an extra layer of security to your account.",
            deleteAccount: "Delete Account",
            deleteDesc: "Permanently delete your account and all data."
        }
    },
    common: {
        profile: "Profile",
        date: "Date",
        code: "Code",
        type: "Type",
        status: "Status",
        update: "Update",
        enable: "Enable",
        delete: "Delete",
        view: "View"
    },
    auth: {
        changePassword: "Change Password"
    }
};

const newKeysZh = {
    settings: {
        jobSeeker: {
            updateDesc: "更新您的专业资料、技能和经验。",
            applicationsDesc: "查看和管理您的求职申请。"
        },
        employer: {
            updateDesc: "更新您的公司详情、Logo和联系方式。",
            dashboard: "雇主仪表板",
            dashboardDesc: "管理您的职位发布和申请人。",
            goToDashboard: "前往仪表板"
        },
        hostFamily: {
            updateDesc: "更新您的家庭描述、家规和要求。",
            viewDesc: "查看您的资料在互惠生眼中的样子。"
        },
        auPair: {
            updateDesc: "更新您的可用性、偏好、技能和经验详情。",
            viewDesc: "查看您的资料在寄宿家庭眼中的样子。"
        },
        billing: {
            desc: "管理您的订阅和支付方式。",
            currentPlan: "当前计划",
            premiumPlan: "高级计划",
            freePlan: "免费计划",
            premium: "高级",
            active: "活跃",
            features: {
                basicProfile: "基本资料",
                unlimitedMessages: "无限消息",
                limitedMessages: "有限消息",
                premiumSupport: "高级支持"
            },
            upgradePlan: "升级计划",
            redeemCode: "兑换代码",
            redeemPlaceholder: "输入代码 (如 VIP-123)",
            redeem: "兑换",
            history: "支付与兑换历史",
            noHistory: "暂无支付或兑换历史。"
        },
        security: {
            desc: "管理您的密码和账户安全设置。",
            passwordDesc: "更新您的密码以保持账户安全。",
            "2fa": "双重认证",
            "2faDesc": "为您的账户添加额外的安全层。",
            deleteAccount: "删除账户",
            deleteDesc: "永久删除您的账户和所有数据。"
        }
    },
    common: {
        profile: "个人资料",
        date: "日期",
        code: "代码",
        type: "类型",
        status: "状态",
        update: "更新",
        enable: "启用",
        delete: "删除",
        view: "查看"
    },
    auth: {
        changePassword: "修改密码"
    }
};

function mergeDeep(target, source) {
    const isObject = (obj) => obj && typeof obj === 'object';
    if (!isObject(target) || !isObject(source)) return source;

    Object.keys(source).forEach(key => {
        const targetValue = target[key];
        const sourceValue = source[key];

        if (isObject(targetValue) && isObject(sourceValue)) {
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

console.log('Added settings keys.');
