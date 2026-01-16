import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const enPath = path.join(__dirname, 'src/i18n/locales/en.json');
const zhPath = path.join(__dirname, 'src/i18n/locales/zh.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const zh = JSON.parse(fs.readFileSync(zhPath, 'utf8'));

// Fix en.json
if (typeof en.community.createPost === 'string') {
    console.log('Converting en.community.createPost to object...');
    const oldValue = en.community.createPost;
    en.community.createPost = {
        "heading": oldValue, // Preserve old value just in case
        "title": "Create Post",
        "category": "Category",
        "content": "Content",
        "contentPlaceholder": "Write your post content here...",
        "postButton": "Post",
        "postTitle": "Post Title",
        "posting": "Posting...",
        "success": "Post created successfully",
        "titlePlaceholder": "Enter post title..."
    };
}

// Fix zh.json
if (typeof zh.community.createPost === 'string') {
    console.log('Converting zh.community.createPost to object...');
    const oldValue = zh.community.createPost;
    zh.community.createPost = {
        "heading": oldValue,
        "title": "发布帖子",
        "category": "分类",
        "content": "内容",
        "contentPlaceholder": "在此输入帖子内容...",
        "postButton": "发布",
        "postTitle": "帖子标题",
        "posting": "发布中...",
        "success": "发布成功",
        "titlePlaceholder": "输入标题..."
    };
} else if (zh.community.createPost && typeof zh.community.createPost === 'object') {
     // Ensure keys exist
     const defaults = {
        "title": "发布帖子",
        "category": "分类",
        "content": "内容",
        "contentPlaceholder": "在此输入帖子内容...",
        "postButton": "发布",
        "postTitle": "帖子标题",
        "posting": "发布中...",
        "success": "发布成功",
        "titlePlaceholder": "输入标题..."
    };
    Object.assign(zh.community.createPost, defaults);
}

// Fix education.apply (en)
if (en.education && typeof en.education.apply === 'string') {
    console.log('Converting en.education.apply to object...');
    const oldValue = en.education.apply;
    en.education.apply = {
        "button": oldValue,
        "title": "Apply for Education Program",
        "step": "Step",
        "personalInfo": "Personal Information",
        "academicBackground": "Academic Background",
        "motivationSection": "Motivation",
        "fullName": "Full Name",
        "fullNamePlaceholder": "Enter your full name",
        "email": "Email Address",
        "emailHelp": "We will contact you via this email",
        "phone": "Phone Number",
        "nationality": "Nationality",
        "nationalityPlaceholder": "Select nationality",
        "location": "Current Location",
        "locationPlaceholder": "City, Country",
        "dob": "Date of Birth",
        "educationLevel": "Education Level",
        "educationLevelPlaceholder": "Select level",
        "fieldOfStudy": "Field of Study",
        "fieldOfStudyPlaceholder": "e.g. Computer Science",
        "institution": "Institution",
        "institutionPlaceholder": "University/School Name",
        "gpa": "GPA (Optional)",
        "gpaPlaceholder": "e.g. 3.5/4.0",
        "languageProficiency": "Language Proficiency",
        "languagePlaceholder": "Select level",
        "motivation": "Motivation Letter",
        "motivationPlaceholder": "Why do you want to join this program?",
        "characterCount": "characters",
        "additionalInfo": "Additional Information",
        "additionalInfoPlaceholder": "Any other details...",
        "workExperience": "Work Experience",
        "workExperiencePlaceholder": "Relevant experience...",
        "startDate": "Preferred Start Date",
        "submit": "Submit Application",
        "errors": {
            "submit": "Failed to submit application"
        },
        "validation": {
            "required": "Required",
            "motivation": "Motivation is required"
        },
        "level_professional": "Professional",
        "additionalMessage": "Message",
        "additionalMessagePlaceholder": "Optional message..."
    };
}

// Fix education.apply (zh)
if (zh.education && typeof zh.education.apply === 'string') {
    console.log('Converting zh.education.apply to object...');
    const oldValue = zh.education.apply;
    zh.education.apply = {
        "button": oldValue,
        "title": "申请教育项目",
        "step": "步骤",
        "personalInfo": "个人信息",
        "academicBackground": "学术背景",
        "motivationSection": "动机信",
        "fullName": "全名",
        "fullNamePlaceholder": "输入全名",
        "email": "电子邮件",
        "phone": "电话号码",
        "nationality": "国籍",
        "nationalityPlaceholder": "选择国籍",
        "location": "当前位置",
        "locationPlaceholder": "城市，国家",
        "dob": "出生日期",
        "educationLevel": "教育程度",
        "educationLevelPlaceholder": "选择程度",
        "fieldOfStudy": "专业",
        "fieldOfStudyPlaceholder": "例如：计算机科学",
        "institution": "院校",
        "institutionPlaceholder": "大学/学校名称",
        "gpa": "GPA (可选)",
        "gpaPlaceholder": "例如：3.5/4.0",
        "languageProficiency": "语言能力",
        "languagePlaceholder": "选择等级",
        "motivation": "动机信",
        "motivationPlaceholder": "您为什么要参加这个项目？",
        "characterCount": "字数",
        "additionalInfo": "附加信息",
        "additionalInfoPlaceholder": "其他详情...",
        "workExperience": "工作经验",
        "workExperiencePlaceholder": "相关经验...",
        "startDate": "期望开始日期",
        "submit": "提交申请",
        "errors": {
            "submit": "提交申请失败"
        },
        "validation": {
            "required": "必填",
            "motivation": "需要填写动机信"
        },
        "level_professional": "专业人士",
        "additionalMessage": "留言",
        "additionalMessagePlaceholder": "可选留言..."
    };
}

// Fix jobs.salary (en)
if (en.jobs && typeof en.jobs.salary === 'string') {
    console.log('Converting en.jobs.salary to object...');
    const oldValue = en.jobs.salary;
    en.jobs.salary = {
        "label": oldValue,
        "currency": {
            "CNY": "CNY (¥)",
            "EUR": "EUR (€)",
            "USD": "USD ($)"
        },
        "period": {
            "hourly": "Hourly",
            "monthly": "Monthly",
            "yearly": "Yearly"
        }
    };
}

// Fix jobs.salary (zh)
if (zh.jobs && typeof zh.jobs.salary === 'string') {
    console.log('Converting zh.jobs.salary to object...');
    const oldValue = zh.jobs.salary;
    zh.jobs.salary = {
        "label": oldValue,
        "currency": {
            "CNY": "人民币 (¥)",
            "EUR": "欧元 (€)",
            "USD": "美元 ($)"
        },
        "period": {
            "hourly": "每小时",
            "monthly": "每月",
            "yearly": "每年"
        }
    };
}

// Fix marketplace.categories (en)
if (en.marketplace) {
    console.log('Updating en.marketplace.categories...');
    en.marketplace.categories = Object.assign(en.marketplace.categories || {}, {
        "category": "Category",
        "select": "Select Category",
        "subcategory": "Subcategory",
        "subcategorySelect": "Select Subcategory"
    });
}

// Fix marketplace.categories (zh)
if (zh.marketplace) {
    console.log('Updating zh.marketplace.categories...');
    zh.marketplace.categories = Object.assign(zh.marketplace.categories || {}, {
        "category": "分类",
        "select": "选择分类",
        "subcategory": "子分类",
        "subcategorySelect": "选择子分类"
    });
}

// Write back
fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
fs.writeFileSync(zhPath, JSON.stringify(zh, null, 2));

console.log('Structure fixed.');
