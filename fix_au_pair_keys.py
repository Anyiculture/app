
import json
import os

def fix_zh_json():
    path = 'src/i18n/locales/zh.json'
    try:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error reading {path}: {e}")
        return

    if 'auPair' not in data:
        data['auPair'] = {}
    if 'onboarding' not in data['auPair']:
        data['auPair']['onboarding'] = {}
    
    # Structure to merge
    new_translations = {
        "basic": {
            "title": "基本信息",
            "firstName": "名字",
            "lastName": "姓氏",
            "middleName": "中间名",
            "optional": "可选",
            "displayNameLabel": "显示名称",
            "age": "年龄",
            "gender": "性别",
            "female": "女性",
            "male": "男性",
            "nonBinary": "非二元性别",
            "nationalityLocation": "国籍与所在地",
            "nationality": "国籍",
            "currentLocation": "当前所在地",
            "hobbies": {
                "reading": "阅读",
                "cooking": "烹饪",
                "travel": "旅行",
                "music": "音乐",
                "sports": "运动",
                "photography": "摄影",
                "arts_crafts": "手工艺",
                "hiking": "徒步",
                "swimming": "游泳",
                "gardening": "园艺",
                "dancing": "舞蹈",
                "writing": "写作",
                "volunteering": "志愿服务",
                "yoga": "瑜伽",
                "gaming": "游戏"
            }
        },
        "step1": {
            "hobbies": "爱好",
            "hobbiesPlaceholder": "选择你的爱好..."
        },
        "strengths": {
            "title": "优势与性格",
            "traitsLabel": "性格特征",
            "traitsDesc": "选择最能描述你的特征",
            "traitsPlaceholder": "选择特征...",
            "workStyleLabel": "工作风格",
            "workStyleDesc": "你如何工作？",
            "workStylePlaceholder": "选择工作风格...",
            "traits": {
                "energetic": "精力充沛",
                "playful": "爱玩耍",
                "calm": "冷静",
                "patient": "耐心",
                "organized": "有条理",
                "tidy": "整洁",
                "creative": "有创意",
                "artistic": "艺术型",
                "nurturing": "养育型",
                "warm": "热情",
                "independent": "独立",
                "flexible": "灵活",
                "adaptable": "适应力强",
                "responsible": "负责任",
                "serious": "严肃",
                "outgoing": "外向",
                "introverted": "内向",
                "outdoorsy": "户外型",
                "empathetic": "有同理心",
                "reliable": "可靠",
                "honest": "诚实",
                "enthusiastic": "热情洋溢",
                "proactive": "积极主动"
            },
            "workStyle": {
                "initiative": "主动进取",
                "direction": "听从指挥",
                "collaborative": "协作型",
                "autonomous": "自主型",
                "structured": "结构化",
                "flexible": "灵活变通",
                "communicative": "善于沟通",
                "observer": "观察型"
            }
        },
        "skills": {
            "title": "育儿技能",
            "ageComfortLabel": "照顾过的年龄段",
            "skillsLabel": "特殊技能",
            "experienceLabel": "详细经验描述",
            "experiencePlaceholder": "请详细描述您的育儿经验...",
            "ageComfort": {
                "infants": "婴儿 (0-1岁)",
                "toddlers": "幼儿 (1-3岁)",
                "preschool": "学龄前 (3-5岁)",
                "school_age": "学龄儿童 (6-12岁)",
                "teenagers": "青少年 (13+岁)"
            },
            "options": {
                "cooking": "烹饪",
                "driving": "驾驶",
                "swimming": "游泳",
                "tutoring": "辅导功课",
                "first_aid": "急救",
                "sports": "体育运动",
                "arts": "艺术",
                "music": "音乐",
                "pets": "照顾宠物",
                "special_needs": "特殊需求照顾",
                "infant_care": "婴儿护理",
                "language_teaching": "语言教学",
                "housekeeping": "家务",
                "gardening": "园艺",
                "elderly_care": "老人护理"
            }
        },
        "education": {
            "title": "教育背景",
            "level": "最高学历",
            "highSchool": "高中",
            "associate": "副学士",
            "bachelor": "学士",
            "master": "硕士",
            "phd": "博士",
            "fieldOfStudy": "专业",
            "fieldPlaceholder": "例如：心理学、教育学"
        },
        "rules": {
            "title": "家庭规则",
            "label": "可以接受的家规",
            "desc": "您愿意遵守哪些规则？",
            "options": {
                "curfew": "宵禁",
                "no_guests": "禁止访客",
                "screen_limit": "屏幕时间限制",
                "cleaning": "协助清洁",
                "pet_care": "协助照顾宠物",
                "vegan": "素食饮食"
            }
        },
        "preferences": {
            "title": "偏好设置",
            "familyTypeLabel": "偏好的家庭类型",
            "accommodationLabel": "住宿偏好",
            "liveIn": "住家",
            "liveOut": "不住家",
            "either": "均可",
            "familyType": {
                "active": "活跃型",
                "intellectual": "知识型",
                "travel": "喜爱旅行",
                "homebody": "居家型",
                "large": "大家庭",
                "single_parent": "单亲家庭"
            }
        },
        "availability": {
            "title": "时间安排",
            "availableFrom": "最早开始日期",
            "duration": "持续时长 (月)"
        },
        "languages": {
            "title": "语言能力",
            "languageLabel": "语言",
            "addLanguage": "添加语言",
            "english": "英语",
            "mandarin": "中文 (普通话)",
            "cantonese": "中文 (粤语)",
            "spanish": "西班牙语",
            "french": "法语",
            "german": "德语",
            "japanese": "日语",
            "korean": "韩语",
            "russian": "俄语",
            "italian": "意大利语",
            "portuguese": "葡萄牙语"
        },
        "step7": {
             "proficiencyLabel": "熟练程度",
             "native": "母语",
             "fluent": "流利",
             "intermediate": "中级",
             "beginner": "初级"
        },
        "media": {
            "title": "照片与视频",
            "photosLabel": "个人照片",
            "photosDesc": "上传照片展示你的个性",
            "photosHelp": "第一张照片将作为头像",
            "videoLabel": "介绍视频",
            "uploadVideo": "上传视频",
            "videoDesc": "上传一段简短的自我介绍视频"
        },
        "review": {
            "title": "检查资料",
            "desc": "提交前请核对您的信息。",
            "submit": "提交申请"
        },
        "exit": "退出",
        "pleaseWait": "请稍候...",
        "step8": {
           "creating": "正在创建...",
           "submit": "提交申请"
        },
        "exitModal": {
            "title": "退出导览?",
            "progressSaved": "您的进度已保存为草稿。",
            "returnLater": "您可以稍后回来完成。",
            "continueOnboarding": "继续填写",
            "exitToBrowse": "退出"
        }
    }

    # Recursive update to preserve existing keys not in new_translations
    def recursive_update(d, u):
        if not isinstance(d, dict):
            d = {}
        for k, v in u.items():
            if isinstance(v, dict):
                d[k] = recursive_update(d.get(k, {}), v)
            else:
                d[k] = v
        return d

    recursive_update(data['auPair']['onboarding'], new_translations)

    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print("Successfully updated zh.json with Au Pair Onboarding translations.")

fix_zh_json()
