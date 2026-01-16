import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const zhPath = path.join(__dirname, 'src/i18n/locales/zh.json');

const translations = {
  "dashboard": {
    "title": "仪表板",
    "readyAdventure": "准备好开始新的冒险了吗？",
    "welcomeBack": "欢迎回来",
    "platformStatus": "平台状态",
    "smoothRunning": "一切运行顺利",
    "joinMembers": "加入我们的会员",
    "premiumFeature": "高级功能",
    "aiMatchScore": "AI 匹配评分",
    "findTalent": "寻找人才",
    "findWork": "寻找工作",
    "findHelp": "寻找帮助",
    "findFamily": "寻找家庭",
    "marketplaceSubtitle": "发现社区中的独特好物",
    "jobsSubtitle": "发现为您量身定制的工作机会",
    "eventsSubtitle": "参加本地聚会和活动",
    "educationSubtitle": "获取优质教育资源",
    "recommendedCandidates": "推荐候选人",
    "candidatesSubtitle": "为您推荐的顶尖人才",
    "verifiedAuPairs": "已验证的互惠生",
    "auPairsSubtitle": "寻找最适合您家庭的互惠生",
    "hostFamiliesMatching": "匹配的寄宿家庭",
    "hostFamiliesSubtitle": "寻找温暖的寄宿家庭",
    "communityDiscussions": "社区讨论",
    "communitySubtitle": "与同伴交流心得"
  },
  "common": {
    "viewAsSeeker": "以求职者身份查看",
    "viewAsEmployer": "以雇佣者身份查看",
    "basedOnPreferences": "基于您的偏好",
    "backToDashboard": "返回仪表板"
  },
  "admin": {
    "jobDeleteFailed": "删除职位失败",
    "itemDeleteFailed": "删除物品失败",
    "eventUpdateFailed": "更新活动失败",
    "statusUpdateFailed": "更新状态失败"
  }
};

try {
  const zhContent = fs.readFileSync(zhPath, 'utf8');
  let zhData = JSON.parse(zhContent);

  function deepMerge(target, source) {
    for (const key in source) {
      if (source[key] instanceof Object && key in target) {
        deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }

  console.log("Applying high-quality translations to zh.json...");
  deepMerge(zhData, translations);
  
  fs.writeFileSync(zhPath, JSON.stringify(zhData, null, 2));
  console.log("✅ Successfully updated zh.json with Chinese content.");
} catch (e) {
  console.error(e);
}
