import fs from 'fs';
import path from 'path';

const enPath = path.resolve('src/i18n/locales/en.json');
const zhPath = path.resolve('src/i18n/locales/zh.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const zh = JSON.parse(fs.readFileSync(zhPath, 'utf8'));

const newKeys = {
  "events": {
    "detail": {
      "registered": "registered",
      "eventPastMessage": "This event has already taken place.",
      "aboutEvent": "About this event",
      "noDescription": "No description provided.",
      "organizer": "Organizer",
      "eventOrganizer": "Event Organizer",
      "unregister": "Unregister",
      "registerForEvent": "Register for Event",
      "signInToRegister": "Sign in to Register",
      "youAreOrganizer": "You are the organizer",
      "contactOrganizer": "Contact Organizer",
      "unableToContactOrganizer": "Unable to contact organizer at this time.",
      "failedToStartConversation": "Failed to start conversation.",
      "failedToUpdateRegistration": "Failed to update registration."
    }
  },
  "education": {
    "levels": {
      "k-12": "K-12",
      "undergraduate": "Undergraduate",
      "graduate": "Graduate",
      "doctoral": "Doctoral",
      "postdoctoral": "Postdoctoral",
      "vocational": "Vocational",
      "continuing-education": "Continuing Education"
    },
    "programTypes": {
      "language_course": "Language Course",
      "degree_program": "Degree Program",
      "certificate": "Certificate",
      "workshop": "Workshop",
      "bootcamp": "Bootcamp",
      "exchange": "Exchange Program"
    },
    "deliveryModes": {
      "oncampus": "On-Campus",
      "online": "Online",
      "hybrid": "Hybrid"
    },
    "scheduleTypes": {
      "fulltime": "Full-Time",
      "parttime": "Part-Time",
      "flexible": "Flexible"
    },
    "detail": {
      "applicationSubmitted": "Application Submitted",
      "trackApplication": "You can track your application in your dashboard.",
      "saved": "Saved",
      "spots": "spots",
      "aboutProgram": "About this Program",
      "visitWebsite": "Visit Institution Website",
      "contactProgram": "Contact Program",
      "createdByYou": "Created by you",
      "contact": "Contact Information",
      "applyToProgram": "Apply to Program"
    }
  }
};

const zhTranslations = {
  "events": {
    "detail": {
      "registered": "已报名",
      "eventPastMessage": "此活动已结束。",
      "aboutEvent": "关于此活动",
      "noDescription": "未提供描述。",
      "organizer": "组织者",
      "eventOrganizer": "活动组织者",
      "unregister": "取消报名",
      "registerForEvent": "报名参加",
      "signInToRegister": "登录后报名",
      "youAreOrganizer": "您是组织者",
      "contactOrganizer": "联系组织者",
      "unableToContactOrganizer": "此时无法联系组织者。",
      "failedToStartConversation": "启动对话失败。",
      "failedToUpdateRegistration": "更新报名状态失败。"
    }
  },
  "education": {
    "levels": {
      "k-12": "K-12",
      "undergraduate": "本科",
      "graduate": "研究生",
      "doctoral": "博士",
      "postdoctoral": "博士后",
      "vocational": "职业教育",
      "continuing-education": "继续教育"
    },
    "programTypes": {
      "language_course": "语言课程",
      "degree_program": "学位项目",
      "certificate": "证书项目",
      "workshop": "工作坊",
      "bootcamp": "训练营",
      "exchange": "交换项目"
    },
    "deliveryModes": {
      "oncampus": "校内",
      "online": "在线",
      "hybrid": "混合模式"
    },
    "scheduleTypes": {
      "fulltime": "全日制",
      "parttime": "兼职",
      "flexible": "灵活安排"
    },
    "detail": {
      "applicationSubmitted": "申请已提交",
      "trackApplication": "您可以在控制面板中跟踪您的申请。",
      "saved": "已收藏",
      "spots": "名额",
      "aboutProgram": "关于此项目",
      "visitWebsite": "访问机构网站",
      "contactProgram": "联系项目方",
      "createdByYou": "由您创建",
      "contact": "联系信息",
      "applyToProgram": "申请项目"
    }
  }
};

function deepMerge(target, source) {
  for (const key in source) {
    if (source[key] instanceof Object && key in target) {
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

deepMerge(en, newKeys);
deepMerge(zh, zhTranslations);

fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
fs.writeFileSync(zhPath, JSON.stringify(zh, null, 2));

console.log('✅ Updated en.json and zh.json with Global Localization keys.');
