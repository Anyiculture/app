import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const enPath = path.join(__dirname, 'src/i18n/locales/en.json');
const zhPath = path.join(__dirname, 'src/i18n/locales/zh.json');

const newKeys = {
  "admin": {
    "dashboard": {
      "quickActionsSubtitle": "Instant access to critical management modules",
      "growthOverview": "Platform Growth Overview",
      "analyticsSubtitle": "Deep dive into revenue, retention, and user behavioral patterns.",
      "systemHealth": "System Health",
      "database": "Database",
      "optimal": "Optimal",
      "apiLatency": "API Latency",
      "liveInquiries": "Live Inquiries",
      "analyticsDescription": "Real-time platform performance and user engagement metrics",
      "marketplaceSubtitle": "Moderate community listings and marketplace activity",
      "eventsSubtitle": "Coordinate and moderate platform-wide community events",
      "userManagementSubtitle": "Manage user accounts and permissions",
      "activityLogSubtitle": "Audit trail of all administrative actions on the platform",
      "chartPlaceholder": "[ Interactive Analytics Chart Placeholder ]",
      "views": "Views",
      "apps": "Apps",
      "awaitingAssessment": "Awaiting assessment",
      "needsVerification": "Needs verification",
      "liveChatInteractions": "Live chat interactions",
      "activeLearningModules": "Active learning modules",
      "filter": {
        "last30Days": "Last 30 Days",
        "last6Months": "Last 6 Months"
      }
    },
    "activityLog": "Activity Log",
    "activityLogRefresh": "Refresh Logs",
    "users": {
      "title": "User Management",
      "searchPlaceholder": "Search by name, email, or user ID...",
      "totalUsers": "Total Users",
      "activeUsers": "Active Users",
      "bannedUsers": "Banned Users",
      "page": "Page",
      "ban": "Ban",
      "unban": "Unban",
      "columns": {
        "user": "User",
        "email": "Email",
        "joined": "Joined",
        "status": "Status",
        "actions": "Actions"
      },
      "status": {
        "active": "Active",
        "banned": "Banned"
      },
      "confirm": {
        "banTitle": "Ban User",
        "banMessage": "Are you sure you want to ban {{userName}}? They will no longer be able to log in.",
        "unbanTitle": "Unban User",
        "unbanMessage": "Are you sure you want to restore access for {{userName}}?",
        "deleteTitle": "Delete User",
        "deleteMessage": "Are you sure you want to permanently delete {{userName}} and all their data? This action is irreversible."
      }
    },
    "analytics": {
      "pendingReviews": "Critical Pending Reviews",
      "platformActivity": "Live Platform Activity",
      "exportData": "Full Platform Data Export",
      "exportDesc": "Download a comprehensive audit of all system records in CSV format.",
      "exportCsv": "Export to CSV"
    },
    "messages": {
      "title": "Messages",
      "subtitle": "Inbound support requests and customer messages",
      "contentLabel": "Message Content",
      "subject": "Contact Submission Reply",
      "reply": "Email Reply",
      "markRead": "Mark as Read",
      "markReplied": "Mark as Replied",
      "filter": {
        "all": "All Messages",
        "new": "New Only",
        "read": "Read",
        "replied": "Replied"
      }
    },
    "payments": {
      "title": "Payment Management",
      "subtitle": "Manage platform redemption codes and payment settings",
      "code": "Redemption Code",
      "redeemedBy": "Redeemed By",
      "createdAt": "Created At",
      "noCodes": "No redemption codes found.",
      "generating": "Generating...",
      "generate": "Generate New Code",
      "copied": "Code copied to clipboard!"
    },
    "auPair": {
      "managementSubtitle": "Manage and verify Au Pair and Host Family profiles",
      "profileType": "Profile Type",
      "children": "Children",
      "noDescription": "No description provided.",
      "auPairs": "Au Pairs",
      "hostFamilies": "Host Families"
    },
    "events": {
      "rsvps": "RSVPs"
    },
    "visa": {
      "title": "Visa Management",
      "subtitle": "Track and process visa sponsorship applications",
      "actions": {
        "acknowledge": "Acknowledge",
        "requestDocs": "Request Documents",
        "approve": "Approve",
        "reject": "Reject"
      },
      "details": {
        "title": "Visa Application Details",
        "info": "Applicant Information",
        "data": "Purpose-Specific Data",
        "notes": "Admin Internal Notes"
      },
      "columns": {
        "applicant": "Applicant",
        "type": "Type",
        "status": "Status",
        "submitted": "Submitted",
        "actions": "Actions"
      },
      "filter": {
        "all": "All Applications",
        "submitted": "Submitted",
        "inReview": "In Review",
        "approved": "Approved",
        "rejected": "Rejected"
      },
      "confirmStatus": "Are you sure you want to change the status to {{status}}?",
      "initialMessage": "Hello {{name}}, I'm reaching out regarding your {{type}} visa application. How can I assist you today?"
    },
    "common": {
      "contact": "Contact",
      "noEmail": "No email",
      "notSubmitted": "Not submitted",
      "unknown": "Unknown",
      "applicant": "Applicant"
    },
    "education": {
       "studentMotivation": "Student Motivation"
    }
  }
};

const newKeysZh = {
  "admin": {
    "dashboard": {
      "quickActionsSubtitle": "快速访问关键管理模块",
      "growthOverview": "平台增长概览",
      "analyticsSubtitle": "深入了解收入、留存和用户行为模式。",
      "systemHealth": "系统健康状况",
      "database": "数据库",
      "optimal": "最佳",
      "apiLatency": "API 延迟",
      "liveInquiries": "实时查询",
      "analyticsDescription": "实时平台性能和用户参与度指标",
      "marketplaceSubtitle": "监管社区列表和市场活动",
      "eventsSubtitle": "协调和监管全平台的社区活动",
      "userManagementSubtitle": "管理用户帐户和权限",
      "activityLogSubtitle": "平台所有行政操作的操作日志",
      "chartPlaceholder": "[ 交互式分析图表占位符 ]",
      "views": "浏览量",
      "apps": "申请数",
      "awaitingAssessment": "等待评估",
      "needsVerification": "需要验证",
      "liveChatInteractions": "实时聊天互动",
      "activeLearningModules": "活跃的学习模块",
      "filter": {
        "last30Days": "最近 30 天",
        "last6Months": "最近 6 个月"
      }
    },
    "activityLog": "操作日志",
    "activityLogRefresh": "刷新日志",
    "users": {
      "title": "用户管理",
      "searchPlaceholder": "通过姓名、邮箱或用户 ID 搜索...",
      "totalUsers": "总用户数",
      "activeUsers": "活跃用户",
      "bannedUsers": "已封禁用户",
      "page": "页码",
      "ban": "封禁",
      "unban": "解封",
      "columns": {
        "user": "用户",
        "email": "电子邮箱",
        "joined": "加入时间",
        "status": "状态",
        "actions": "操作"
      },
      "status": {
        "active": "活跃",
        "banned": "已封禁"
      },
      "confirm": {
        "banTitle": "封禁用户",
        "banMessage": "您确定要封禁 {{userName}} 吗？他们将无法再登录。",
        "unbanTitle": "解封用户",
        "unbanMessage": "您确定要恢复 {{userName}} 的访问权限吗？",
        "deleteTitle": "删除用户",
        "deleteMessage": "您确定要永久删除 {{userName}} 及其所有数据吗？此操作不可逆。"
      }
    },
    "analytics": {
      "pendingReviews": "关键待审核项",
      "platformActivity": "实时平台活动",
      "exportData": "完整平台数据导出",
      "exportDesc": "以 CSV 格式下载所有系统记录的全面审计。",
      "exportCsv": "导出为 CSV"
    },
    "messages": {
      "title": "消息",
      "subtitle": "收到的支持请求和客户消息",
      "contentLabel": "消息内容",
      "subject": "联系提交回复",
      "reply": "邮件回复",
      "markRead": "标记为已读",
      "markReplied": "标记为已回复",
      "filter": {
        "all": "所有消息",
        "new": "仅新消息",
        "read": "已读",
        "replied": "已回复"
      }
    },
    "payments": {
      "title": "支付管理",
      "subtitle": "管理平台兑换码和支付设置",
      "code": "兑换码",
      "redeemedBy": "兑换者",
      "createdAt": "创建时间",
      "noCodes": "未找到兑换码。",
      "generating": "正在生成...",
      "generate": "生成新代码",
      "copied": "代码已复制到剪贴板！"
    },
    "auPair": {
      "managementSubtitle": "管理和验证 Au Pair 和互惠家庭资料",
      "profileType": "资料类型",
      "children": "孩子",
      "noDescription": "未提供描述。",
      "auPairs": "Au Pair",
      "hostFamilies": "互惠家庭"
    },
    "events": {
      "rsvps": "响应人数"
    },
    "visa": {
      "title": "签证管理",
      "subtitle": "跟踪和处理签证担保申请",
      "actions": {
        "acknowledge": "受理",
        "requestDocs": "请求文件",
        "approve": "批准",
        "reject": "驳回"
      },
      "details": {
        "title": "签证申请详情",
        "info": "申请人信息",
        "data": "特定目的数据",
        "notes": "管理员内部备注"
      },
      "columns": {
        "applicant": "申请人",
        "type": "类型",
        "status": "状态",
        "submitted": "提交时间",
        "actions": "操作"
      },
      "filter": {
        "all": "所有申请",
        "submitted": "已提交",
        "inReview": "审核中",
        "approved": "已通过",
        "rejected": "已驳回"
      },
      "confirmStatus": "您确定要将状态更改为“{{status}}”吗？",
      "initialMessage": "您好 {{name}}，我是针对您的 {{type}} 签证申请与您联系的。今天我能为您提供什么帮助吗？"
    },
    "common": {
      "contact": "联系方式",
      "noEmail": "无邮箱",
      "notSubmitted": "未提交",
      "unknown": "未知",
      "applicant": "申请人"
    },
    "education": {
       "studentMotivation": "学生意愿"
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
}

function updateFile(filePath, data) {
  const content = fs.readFileSync(filePath, 'utf8');
  let jsonData = JSON.parse(content);
  deepMerge(jsonData, data);
  fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));
}

updateFile(enPath, newKeys);
updateFile(zhPath, newKeysZh);
console.log("✅ Updated en.json and zh.json with new keys.");
