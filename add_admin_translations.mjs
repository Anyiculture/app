import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, 'src/i18n/locales/en.json');

const adminTranslations = {
    "portal": "Admin Portal",
    "manageContent": "Manage Content & Users",
    "switchToUserView": "Switch to User View",
    "backToOverview": "Back to Overview",
    "welcomeBack": "Welcome Back",
    "totalUsers": "Total Users",
    "totalJobs": "Total Jobs",
    "educationPrograms": "Education Programs",
    "totalEvents": "Total Events",
    "pendingJobApplications": "Pending Job Applications",
    "pendingVisaApplications": "Pending Visa Applications",
    "pendingEducationInterests": "Pending Education Interests",
    "activeConversations": "Active Conversations",
    "needsReview": "Needs Review",
    "quickActions": "Quick Actions",
    "educationManagement": "Education Management",
    "jobsManagement": "Jobs Management",
    "userManagement": "User Management",
    "visaManagement": "Visa Management",
    "auPairManagement": "Au Pair Management",
    "marketplace": {
        "moderation": "Marketplace Moderation"
    },
    "contactCopied": "Contact info copied to clipboard",
    "statusUpdated": "Status updated successfully",
    "updateFailed": "Failed to update status",
    "jobUpdateFailed": "Failed to update job",
    "jobStatusFailed": "Failed to update job status",
    "education": {
        "applications": "Education Applications",
        "filter": {
            "all": "All Applications",
            "submitted": "Submitted",
            "underReview": "Under Review",
            "approved": "Approved",
            "rejected": "Rejected"
        },
        "noApplications": "No applications found matching your filter.",
        "markReview": "Mark for Review",
        "approve": "Approve",
        "reject": "Reject"
    }
};

try {
  const content = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(content);
  
  // Add admin key
  data.admin = adminTranslations;
  
  // Write back formatted
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log("✅ Added admin translations to en.json");
} catch (e) {
  console.error("❌ Failed to add translations:", e.message);
}
