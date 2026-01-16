import fs from 'fs';
import path from 'path';

const enPath = path.resolve('src/i18n/locales/en.json');
const zhPath = path.resolve('src/i18n/locales/zh.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const zh = JSON.parse(fs.readFileSync(zhPath, 'utf8'));

const newKeys = {
  "jobs": {
    "employerPortal": "EMPLOYER PORTAL",
    "jobApplication": "Job Application",
    "suggestedSkills": "Suggested based on subcategory:",
    "typeCustomSkill": "Type a custom skill...",
    "added": "Added",
    "addSkill": "+ {{skill}}",
    "categories": {
      "select": "Select Category",
      "subcategorySelect": "Select Subcategory"
    },
    "salary": {
      "currency": {
        "CNY": "CNY",
        "USD": "USD",
        "EUR": "EUR"
      },
      "period": {
        "hourly": "Hourly",
        "monthly": "Monthly",
        "yearly": "Yearly"
      }
    }
  },
  "marketplace": {
    "reportListing": "Report Listing",
    "sellerUnknown": "Unknown Seller",
    "categories": {
        "select": "Select Category",
        "subcategorySelect": "Select Subcategory"
    },
    "post": {
        "brand": {
            "select": "Select Brand",
            "other": "Other Brand",
            "enter": "Enter Brand",
            "placeholder": "Enter brand name"
        },
        "size": {
            "select": "Select Size",
            "placeholder": "Enter size (e.g. XL, 42, 10-inch)"
        },
        "location": {
            "selectProvince": "Select Province",
            "selectCity": "Select City"
        },
        "contact_methods": {
            "in_app": "In-app Messaging",
            "phone": "Phone",
            "wechat": "WeChat",
            "email": "Email"
        }
    }
  },
  "common": {
      "imageNumber": "Image {{number}}",
      "thumbnailNumber": "Thumbnail {{number}}",
      "urlPlaceholder": "https://..."
  }
};

const zhTranslations = {
  "jobs": {
    "employerPortal": "雇主入口",
    "jobApplication": "职位申请",
    "suggestedSkills": "根据子类别推荐：",
    "typeCustomSkill": "输入自定义技能...",
    "added": "已添加",
    "addSkill": "+ {{skill}}",
    "categories": {
      "select": "选择类别",
      "subcategorySelect": "选择子类别"
    },
    "salary": {
      "currency": {
        "CNY": "人民币 (CNY)",
        "USD": "美元 (USD)",
        "EUR": "欧元 (EUR)"
      },
      "period": {
        "hourly": "按小时",
        "monthly": "按月",
        "yearly": "按年"
      }
    }
  },
  "marketplace": {
    "reportListing": "举报商品",
    "sellerUnknown": "未知卖家",
    "categories": {
        "select": "选择类别",
        "subcategorySelect": "选择子类别"
    },
    "post": {
        "brand": {
            "select": "选择品牌",
            "other": "其他品牌",
            "enter": "输入品牌",
            "placeholder": "输入品牌名称"
        },
        "size": {
            "select": "选择尺码/规格",
            "placeholder": "输入尺码 (例如 XL, 42, 10寸)"
        },
        "location": {
            "selectProvince": "选择省份",
            "selectCity": "选择城市"
        },
        "contact_methods": {
            "in_app": "站内消息",
            "phone": "电话",
            "wechat": "微信",
            "email": "电子邮件"
        }
    }
  },
  "common": {
      "imageNumber": "图片 {{number}}",
      "thumbnailNumber": "缩略图 {{number}}",
      "urlPlaceholder": "https://..."
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
  console.log('✅ Updated en.json and zh.json with Jobs and Marketplace keys.');
} catch (error) {
  console.error('❌ Error updating translations:', error.message);
  process.exit(1);
}
