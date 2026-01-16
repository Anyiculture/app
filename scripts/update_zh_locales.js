
const fs = require('fs');
const path = require('path');

const zhPath = path.join(__dirname, '../src/i18n/locales/zh.json');

try {
  const zhContent = fs.readFileSync(zhPath, 'utf8');
  const zhJson = JSON.parse(zhContent);

  if (!zhJson.auPair) {
    zhJson.auPair = {};
  }

  if (!zhJson.auPair.onboarding) {
    zhJson.auPair.onboarding = {};
  }

  const missingKeys = {
    "familyLifestyle": "家庭生活方式",
    "parenting": "育儿理念",
    "houseRules": "家庭规则",
    "preferences": "互惠生偏好",
    "workStructure": "工作安排",
    "benefits": "福利待遇",
    "familyName": "家庭名称",
    "familyNamePlaceholder": "例如：Smith 家庭",
    "adultsAndKids": "成人与儿童",
    "totalMembers": "家庭成员总数",
    "children": "孩子",
    "location": "位置",
    "homeType": "房屋类型",
    "householdVibe": "家庭氛围",
    "homeTypeHouse": "独栋别墅",
    "homeTypeApartment": "公寓",
    "homeTypeFarm": "农场",
    "homeTypeTownhouse": "联排别墅",
    "vibeActive": "活跃",
    "vibeCalm": "安静",
    "vibeCreative": "创意",
    "vibeIntellectual": "知识型",
    "vibeSocial": "社交型",
    "vibeStructured": "规律",
    "vibeRelaxed": "放松",
    "vibeNature": "热爱自然",
    "questionParenting": "您的育儿风格是什么？",
    "questionDiscipline": "您如何处理纪律问题？",
    "questionRules": "哪些活动/行为是不允许的？",
    "questionRulesDetails": "详细说明您的家庭规则（可选）",
    "elaborateRulesPlaceholder": "例如：我们希望晚上9点后保持安静...",
    "questionTraits": "您在寻找什么样的性格特征？",
    "preferredNationalities": "首选国籍",
    "labelIdealCandidate": "理想候选人资料",
    "labelLookingFor": "寻找这样的人",
    "questionDuties": "互惠生的主要职责是什么？",
    "startDate": "开始日期",
    "endDate": "结束日期",
    "questionSalary": "每月零用钱 (人民币)",
    "labelPrivateRoom": "独立房间",
    "questionBenefits": "额外福利",
    "labelReview": "审核您的资料",
    "nextStep": "下一步",
    "completeProfile": "完成资料",
    "creatingProfile": "正在创建资料...",
    "pleaseWait": "请稍候..."
  };

  // Merge missing keys with existing onboarding keys
  // We want missing keys to be at the top if possible, or just merged.
  // Using Object.assign or spread
  zhJson.auPair.onboarding = {
    ...missingKeys,
    ...zhJson.auPair.onboarding
  };

  fs.writeFileSync(zhPath, JSON.stringify(zhJson, null, 2), 'utf8');
  console.log('Successfully updated zh.json with missing onboarding keys.');

} catch (error) {
  console.error('Error updating zh.json:', error);
  process.exit(1);
}
