
const fs = require('fs');
const path = require('path');

const zhPath = path.join(__dirname, '../src/i18n/locales/zh.json');
const enPath = path.join(__dirname, '../src/i18n/locales/en.json');

const enKeys = {
  "myEvents": {
    "title": "My Events",
    "subtitle": "Manage your event listings",
    "createEvent": "Create Event",
    "searchPlaceholder": "Search events...",
    "noEvents": "No events yet",
    "startPosting": "Start by creating your first event",
    "createFirstEvent": "Create Your First Event",
    "loading": "Loading your events...",
    "deleteConfirm": "Are you sure you want to delete this event?",
    "deleteError": "Failed to delete event",
    "attendees": "attendees",
    "status": {
      "published": "Published",
      "draft": "Draft",
      "cancelled": "Cancelled"
    }
  }
};

const zhKeys = {
  "myEvents": {
    "title": "我的活动",
    "subtitle": "管理您的活动列表",
    "createEvent": "创建活动",
    "searchPlaceholder": "搜索活动...",
    "noEvents": "暂无活动",
    "startPosting": "开始创建您的第一个活动",
    "createFirstEvent": "创建您的第一个活动",
    "loading": "正在加载您的活动...",
    "deleteConfirm": "您确定要删除此活动吗？",
    "deleteError": "删除活动失败",
    "attendees": "参与者",
    "status": {
      "published": "已发布",
      "draft": "草稿",
      "cancelled": "已取消"
    }
  }
};

function updateFile(filePath, newKeys) {
  const content = fs.readFileSync(filePath, 'utf8');
  const json = JSON.parse(content);

  // Merge myEvents
  json.myEvents = { ...newKeys.myEvents, ...(json.myEvents || {}) };

  fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf8');
  console.log(`Updated ${filePath}`);
}

try {
  updateFile(enPath, enKeys);
  updateFile(zhPath, zhKeys);
  console.log('MyEvents locales updated successfully.');
} catch (error) {
  console.error('Error updating locales:', error);
  process.exit(1);
}
