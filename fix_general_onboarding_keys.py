
import json
import collections

en_file = 'src/i18n/locales/en.json'
zh_file = 'src/i18n/locales/zh.json'

new_keys_en = {
    "onboarding": {
      "title": "Welcome Onboard",
      "personalInfo": "Personal Information",
      "personalInfoDesc": "Let's start with some basic details about you.",
      "displayName": "Display Name",
      "displayNamePlaceholder": "How should we call you?",
      "displayNameHelp": "This name will be visible to other users.",
      "phoneNumber": "Phone Number",
      "dateOfBirth": "Date of Birth",
      "gender": "Gender",
      "male": "Male",
      "female": "Female",
      "other": "Other",
      "preferNotToSay": "Prefer not to say",
      "citizenshipCountry": "Citizenship",
      "selectCitizenshipCountry": "Select Citizenship",
      "citizenshipCountryHelp": "Your country of citizenship.",
      "residenceCountry": "Current Residence",
      "residenceCountryDesc": "Where are you currently living?",
      "residenceCountryHelp": "This helps us show you relevant local content.",
      "interests": "Your Interests",
      "interestsDesc": "What brings you to AnyiCulture?",
      "interestedModules": "Interested Areas",
      "selectMultipleInterests": "Select all that apply.",
      "primaryInterest": "Primary Interest",
      "primaryInterestHelp": "We'll prioritize content from this area.",
      "almostDone": "Almost Done",
      "almostDoneDesc": "Just a few final details.",
      "userGoals": "What is your main goal?",
      "userGoalsDesc": "Help us tailor your experience.",
      "platformIntent": "How do you plan to use the platform?",
      "platformIntentDesc": "Select the option that best describes you.",
      "consentDataProcessing": "I agree to the processing of my personal data.",
      "consentCommunications": "I would like to receive updates and news.",
      "saveFailed": "Failed to save your profile. Please try again.",
      "complete": "Complete",
      "goToDashboardNow": "Go to Dashboard Now",
      "redirectingIn": "Redirecting in {{count}}s...",
      "successMessage": "You have successfully completed the onboarding process.",
      "goals": {
        "findJob": "Find a Job",
        "network": "Professional Networking",
        "learnLanguage": "Learn Language",
        "culturalExperience": "Cultural Experience",
        "education": "Education & Courses"
      },
      "intents": {
        "browseJobs": "Browse Jobs",
        "marketplace": "Buy/Sell Items",
        "attendEvents": "Attend Events",
        "joinCommunity": "Join Community",
        "auPair": "Au Pair Program"
      }
    }
}

new_keys_zh = {
    "onboarding": {
      "title": "欢迎加入",
      "personalInfo": "个人信息",
      "personalInfoDesc": "让我们从您的一些基本信息开始。",
      "displayName": "显示名称",
      "displayNamePlaceholder": "我们该如何称呼您？",
      "displayNameHelp": "此名称将对其他用户可见。",
      "phoneNumber": "电话号码",
      "dateOfBirth": "出生日期",
      "gender": "性别",
      "male": "男",
      "female": "女",
      "other": "其他",
      "preferNotToSay": "不愿透露",
      "citizenshipCountry": "国籍",
      "selectCitizenshipCountry": "选择国籍",
      "citizenshipCountryHelp": "您的国籍国家。",
      "residenceCountry": "当前居住地",
      "residenceCountryDesc": "您目前住在哪里？",
      "residenceCountryHelp": "这有助于我们为您显示相关的本地内容。",
      "interests": "您的兴趣",
      "interestsDesc": "什么吸引您来到 AnyiCulture？",
      "interestedModules": "感兴趣的领域",
      "selectMultipleInterests": "选择所有适用的选项。",
      "primaryInterest": "主要兴趣",
      "primaryInterestHelp": "我们将优先显示此领域的内容。",
      "almostDone": "快完成了",
      "almostDoneDesc": "只差最后几步。",
      "userGoals": "您的主要目标是什么？",
      "userGoalsDesc": "帮助我们为您定制体验。",
      "platformIntent": "您打算如何使用平台？",
      "platformIntentDesc": "选择最符合您描述的选项。",
      "consentDataProcessing": "我同意处理我的个人数据。",
      "consentCommunications": "我愿意接收更新和新闻。",
      "saveFailed": "保存个人资料失败。请重试。",
      "complete": "完成",
      "goToDashboardNow": "立即前往仪表板",
      "redirectingIn": "将在 {{count}} 秒后跳转...",
      "successMessage": "您已成功完成入职流程。",
      "goals": {
        "findJob": "找工作",
        "network": "职业社交",
        "learnLanguage": "学习语言",
        "culturalExperience": "文化体验",
        "education": "教育与课程"
      },
      "intents": {
        "browseJobs": "浏览职位",
        "marketplace": "买卖物品",
        "attendEvents": "参加活动",
        "joinCommunity": "加入社区",
        "auPair": "互惠生项目"
      }
    }
}

def update_json(file_path, new_keys_data):
    print(f"Updating {file_path}...")
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f, object_pairs_hook=collections.OrderedDict)
        
        # Merge onboarding keys
        if "onboarding" not in data:
            data["onboarding"] = collections.OrderedDict()
            
        # Recursive merge helper (simple version for this specific depth)
        for k, v in new_keys_data["onboarding"].items():
            if isinstance(v, dict):
                if k not in data["onboarding"] or not isinstance(data["onboarding"][k], dict):
                    data["onboarding"][k] = collections.OrderedDict()
                for sub_k, sub_v in v.items():
                    data["onboarding"][k][sub_k] = sub_v
            else:
                data["onboarding"][k] = v
            
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print("JSON Update Success.")
        
    except Exception as e:
        print(f"Error updating {file_path}: {e}")

if __name__ == "__main__":
    update_json(en_file, new_keys_en)
    update_json(zh_file, new_keys_zh)
