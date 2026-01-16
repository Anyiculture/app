import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, 'src/i18n/locales/en.json');

try {
  const content = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(content);
  
  if (!data.admin) {
    data.admin = {};
  }
  
  const additionalKeys = {
    "jobDeleteFailed": "Failed to delete job",
    "itemDeleteFailed": "Failed to delete item",
    "eventUpdateFailed": "Failed to update event",
    "codeDeleteFailed": "Failed to delete code",
    "codeGenerationFailed": "Failed to generate code",
    "jobUpdateFailed": "Failed to update job",
    "jobStatusFailed": "Failed to update job status",
    "statusUpdated": "Status updated successfully",
    "updateFailed": "Update failed",
    "contactCopied": "Contact info copied to clipboard",
    // NEW KEYS ADDED HERE
    "eventDeleteFailed": "Failed to delete event",
    "deletionCancelled": "Deletion cancelled",
    "applicationUpdated": "Application updated successfully",
    "statusUpdateFailed": "Failed to update status",
    "conversationFailed": "Failed to update conversation",
    
    "education": {
       "applications": "Education Applications",
       "filter": {
          "all": "All",
          "submitted": "Submitted",
          "underReview": "Under Review",
          "approved": "Approved",
          "rejected": "Rejected"
       },
       "noApplications": "No applications found",
       "markReview": "Mark for Review",
       "approve": "Approve",
       "reject": "Reject"
    }
  };
  
  // Merge keys
  Object.assign(data.admin, additionalKeys);
  
  if (data.admin.education) {
     Object.assign(data.admin.education, additionalKeys.education);
  } else {
     data.admin.education = additionalKeys.education;
  }
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log("✅ Added ALL missing admin keys to en.json");

} catch (e) {
  console.error(e);
}
