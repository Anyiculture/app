# i18n Audit Report

**Generated:** 2026-01-15T16:43:41.169Z

**Files Scanned:** 202

**English Translation Keys:** 2711

**Chinese Translation Keys:** 2711

---

## Summary

| Category | Count | Severity |
|----------|-------|----------|
| Hardcoded Strings | 395 | 142 critical, 253 high |
| Missing Translation Keys | 0 | High |
| TODO Values (Chinese) | 2275 | Medium |
| Recommendations | 19 | Low |

## Hardcoded Strings Found

> [!WARNING]
> 395 hardcoded strings detected that should use translation keys.

### Critical (142)

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\EmployerOnboarding.tsx:198]**

- **String:** `User profile missing. Please contact support.`
- **Context:** `throw new Error('User profile missing. Please contact support.');`
- **Suggested Key:** `common.user_profile_missing_please_contact_support`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\jobs\InterviewScheduler.tsx:49]**

- **String:** `Not authenticated`
- **Context:** `if (!user) throw new Error('Not authenticated');`
- **Suggested Key:** `common.not_authenticated`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\jobs\QuickChatButton.tsx:47]**

- **String:** `Failed to start conversation. Please try again.`
- **Context:** `alert('Failed to start conversation. Please try again.');`
- **Suggested Key:** `common.failed_to_start_conversation_please_try_again`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\JobSeekerOnboarding.tsx:312]**

- **String:** `User profile missing. Please contact support.`
- **Context:** `throw new Error('User profile missing. Please contact support.');`
- **Suggested Key:** `common.user_profile_missing_please_contact_support`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\ui\EmailInput.tsx:30]**

- **String:** `Email is required`
- **Context:** `setError('Email is required');`
- **Suggested Key:** `common.email_is_required`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\ui\EmailInput.tsx:38]**

- **String:** `Please enter a valid email address`
- **Context:** `setError('Please enter a valid email address');`
- **Suggested Key:** `common.please_enter_a_valid_email_address`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\ui\Toast.tsx:76]**

- **String:** `useToast must be used within ToastProvider`
- **Context:** `if (!context) throw new Error('useToast must be used within ToastProvider');`
- **Suggested Key:** `common.usetoast_must_be_used_within_toastprovider`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\contexts\AuthContext.tsx:186]**

- **String:** `useAuth must be within AuthProvider`
- **Context:** `if (!context) throw new Error('useAuth must be within AuthProvider');`
- **Suggested Key:** `common.useauth_must_be_within_authprovider`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\contexts\I18nContext.tsx:64]**

- **String:** `useI18n must be within I18nProvider`
- **Context:** `if (!ctx) throw new Error('useI18n must be within I18nProvider');`
- **Suggested Key:** `common.usei18n_must_be_within_i18nprovider`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\contexts\PersonalizationContext.tsx:210]**

- **String:** `usePersonalization must be used within a PersonalizationProvider`
- **Context:** `throw new Error('usePersonalization must be used within a PersonalizationProvider');`
- **Suggested Key:** `common.usepersonalization_must_be_used_within_a_personali`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\hooks\useStripe.ts:48]**

- **String:** `User not authenticated`
- **Context:** `if (!user) throw new Error('User not authenticated');`
- **Suggested Key:** `common.user_not_authenticated`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\hooks\useStripe.ts:64]**

- **String:** `Failed to create checkout session`
- **Context:** `throw new Error('Failed to create checkout session');`
- **Suggested Key:** `common.failed_to_create_checkout_session`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\lib\stripe.ts:19]**

- **String:** `No authentication token found`
- **Context:** `throw new Error('No authentication token found');`
- **Suggested Key:** `common.no_authentication_token_found`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\pages\AdminPortalPage.tsx:494]**

- **String:** `Contact info copied!`
- **Context:** `alert('Contact info copied!');`
- **Suggested Key:** `adminportal.contact_info_copied`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\pages\AdminPortalPage.tsx:598]**

- **String:** `Status updated successfully!`
- **Context:** `alert('Status updated successfully!');`
- **Suggested Key:** `adminportal.status_updated_successfully`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\pages\AdminPortalPage.tsx:601]**

- **String:** `Failed to update status`
- **Context:** `alert('Failed to update status');`
- **Suggested Key:** `adminportal.failed_to_update_status`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\pages\AdminPortalPage.tsx:678]**

- **String:** `Contact info copied!`
- **Context:** `alert('Contact info copied!');`
- **Suggested Key:** `adminportal.contact_info_copied`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\pages\AdminPortalPage.tsx:780]**

- **String:** `Failed to update job`
- **Context:** `alert('Failed to update job');`
- **Suggested Key:** `adminportal.failed_to_update_job`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\pages\AdminPortalPage.tsx:792]**

- **String:** `Failed to update job status`
- **Context:** `alert('Failed to update job status');`
- **Suggested Key:** `adminportal.failed_to_update_job_status`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\pages\AdminPortalPage.tsx:804]**

- **String:** `Failed to delete job`
- **Context:** `alert('Failed to delete job');`
- **Suggested Key:** `adminportal.failed_to_delete_job`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\pages\AdminPortalPage.tsx:1018]**

- **String:** `Failed to delete item`
- **Context:** `alert('Failed to delete item');`
- **Suggested Key:** `adminportal.failed_to_delete_item`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\pages\AdminPortalPage.tsx:1217]**

- **String:** `Failed to update event`
- **Context:** `alert('Failed to update event');`
- **Suggested Key:** `adminportal.failed_to_update_event`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\pages\AdminPortalPage.tsx:1229]**

- **String:** `Failed to delete event`
- **Context:** `alert('Failed to delete event');`
- **Suggested Key:** `adminportal.failed_to_delete_event`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\pages\AdminPortalPage.tsx:1486]**

- **String:** `Deletion cancelled - confirmation failed`
- **Context:** `alert('Deletion cancelled - confirmation failed');`
- **Suggested Key:** `adminportal.deletion_cancelled_confirmation_failed`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\pages\AdminPortalPage.tsx:1955]**

- **String:** `Application status updated successfully`
- **Context:** `alert('Application status updated successfully');`
- **Suggested Key:** `adminportal.application_status_updated_successfully`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\pages\AdminPortalPage.tsx:1958]**

- **String:** `Failed to update status`
- **Context:** `alert('Failed to update status');`
- **Suggested Key:** `adminportal.failed_to_update_status`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\pages\AdminPortalPage.tsx:2006]**

- **String:** `Failed to initiate conversation`
- **Context:** `alert('Failed to initiate conversation');`
- **Suggested Key:** `adminportal.failed_to_initiate_conversation`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\pages\AdminPortalPage.tsx:2338]**

- **String:** `Failed to update status`
- **Context:** `alert('Failed to update status');`
- **Suggested Key:** `adminportal.failed_to_update_status`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\pages\AdminPortalPage.tsx:2486]**

- **String:** `Failed to generate code`
- **Context:** `alert('Failed to generate code');`
- **Suggested Key:** `adminportal.failed_to_generate_code`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\pages\AdminPortalPage.tsx:2504]**

- **String:** `Failed to delete code`
- **Context:** `alert('Failed to delete code');`
- **Suggested Key:** `adminportal.failed_to_delete_code`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\pages\AuPairEditProfilePage.tsx:85]**

- **String:** `Failed to update profile.`
- **Context:** `alert('Failed to update profile.');`
- **Suggested Key:** `aupaireditprofile.failed_to_update_profile`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\pages\AuPairPaymentPage.tsx:26]**

- **String:** `Payment initiation failed. Please try again.`
- **Context:** `setError('Payment initiation failed. Please try again.');`
- **Suggested Key:** `aupairpayment.payment_initiation_failed_please_try_again`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\pages\AuPairPaymentPage.tsx:34]**

- **String:** `Please enter a verification code`
- **Context:** `setError('Please enter a verification code');`
- **Suggested Key:** `aupairpayment.please_enter_a_verification_code`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\pages\AuPairProfilePage.tsx:103]**

- **String:** `Failed to start conversation. Please try again.`
- **Context:** `alert('Failed to start conversation. Please try again.');`
- **Suggested Key:** `aupairprofile.failed_to_start_conversation_please_try_again`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\pages\AuPairRoleSelectionPage.tsx:29]**

- **String:** `Failed to set role. Please try again.`
- **Context:** `alert('Failed to set role. Please try again.');`
- **Suggested Key:** `aupairroleselection.failed_to_set_role_please_try_again`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\pages\HostFamilyProfilePage.tsx:102]**

- **String:** `Failed to start conversation. Please try again.`
- **Context:** `alert('Failed to start conversation. Please try again.');`
- **Suggested Key:** `hostfamilyprofile.failed_to_start_conversation_please_try_again`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\pages\MarketplaceEditPage.tsx:82]**

- **String:** `Item not found`
- **Context:** `alert('Item not found');`
- **Suggested Key:** `marketplaceedit.item_not_found`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\pages\MarketplaceEditPage.tsx:89]**

- **String:** `You do not have permission to edit this item`
- **Context:** `alert('You do not have permission to edit this item');`
- **Suggested Key:** `marketplaceedit.you_do_not_have_permission_to_edit_this_item`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\pages\MarketplaceEditPage.tsx:129]**

- **String:** `Failed to load item details`
- **Context:** `alert('Failed to load item details');`
- **Suggested Key:** `marketplaceedit.failed_to_load_item_details`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\pages\MarketplaceEditPage.tsx:185]**

- **String:** `Please fill in all required fields`
- **Context:** `alert('Please fill in all required fields');`
- **Suggested Key:** `marketplaceedit.please_fill_in_all_required_fields`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\pages\MarketplaceEditPage.tsx:190]**

- **String:** `Please upload at least one image`
- **Context:** `alert('Please upload at least one image');`
- **Suggested Key:** `marketplaceedit.please_upload_at_least_one_image`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\pages\MarketplaceEditPage.tsx:231]**

- **String:** `Failed to update listing. Please try again.`
- **Context:** `alert('Failed to update listing. Please try again.');`
- **Suggested Key:** `marketplaceedit.failed_to_update_listing_please_try_again`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\pages\MarketplaceEditPage.tsx:244]**

- **String:** `Maximum 10 images allowed`
- **Context:** `alert('Maximum 10 images allowed');`
- **Suggested Key:** `marketplaceedit.maximum_10_images_allowed`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\pages\MarketplaceEditPage.tsx:257]**

- **String:** `Failed to upload images. Please try again.`
- **Context:** `alert('Failed to upload images. Please try again.');`
- **Suggested Key:** `marketplaceedit.failed_to_upload_images_please_try_again`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\pages\MessagingPage.tsx:221]**

- **String:** `Failed to upload file`
- **Context:** `alert('Failed to upload file');`
- **Suggested Key:** `messaging.failed_to_upload_file`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\pages\MessagingPage.tsx:253]**

- **String:** `Failed to schedule meeting`
- **Context:** `alert('Failed to schedule meeting');`
- **Suggested Key:** `messaging.failed_to_schedule_meeting`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\pages\MyJobsPage.tsx:445]**

- **String:** `Edit functionality coming soon`
- **Context:** `<button onClick={() => alert('Edit functionality coming soon')} className="text-gray-400 cursor-not-`
- **Suggested Key:** `myjobs.edit_functionality_coming_soon`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\pages\PostJobPage.tsx:104]**

- **String:** `You must be logged in to post a job`
- **Context:** `setError('You must be logged in to post a job');`
- **Suggested Key:** `postjob.you_must_be_logged_in_to_post_a_job`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\pages\PostJobPage.tsx:109]**

- **String:** `Please fill in all required fields`
- **Context:** `setError('Please fill in all required fields');`
- **Suggested Key:** `postjob.please_fill_in_all_required_fields`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\pages\ProfilePage.tsx:108]**

- **String:** `Profile not found`
- **Context:** `setError('Profile not found');`
- **Suggested Key:** `profile.profile_not_found`


_... and 92 more critical findings_

### High Priority (253)

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\aupair\ProfileCard.tsx:81]**

- **String:** `Premium Only`
- **Context:** `<span className="mt-3 text-[10px] font-black uppercase tracking-[0.2em] text-white drop-shadow-lg">P`
- **Suggested Key:** `common.premium_only`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\AuPairOnboarding.tsx:594]**

- **String:** `Completion`
- **Context:** `<div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Completi`
- **Suggested Key:** `common.completion`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\AuPairOnboarding.tsx:1016]**

- **String:** `Name:`
- **Context:** `<p><span className="font-medium">Name:</span> {formData.first_name} {formData.last_name}</p>`
- **Suggested Key:** `common.name`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\AuPairOnboarding.tsx:1017]**

- **String:** `Age:`
- **Context:** `<p><span className="font-medium">Age:</span> {formData.age}</p>`
- **Suggested Key:** `common.age`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\AuPairOnboarding.tsx:1018]**

- **String:** `Location:`
- **Context:** `<p><span className="font-medium">Location:</span> {formData.current_city}, {formData.current_country`
- **Suggested Key:** `common.location`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\AuPairOnboarding.tsx:1019]**

- **String:** `Nationality:`
- **Context:** `<p><span className="font-medium">Nationality:</span> {formData.nationality}</p>`
- **Suggested Key:** `common.nationality`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\AuPairOnboarding.tsx:1030]**

- **String:** `Experience:`
- **Context:** `<p><span className="font-medium">Experience:</span> {formData.childcare_experience_years} years</p>`
- **Suggested Key:** `common.experience`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\AuPairOnboarding.tsx:1031]**

- **String:** `Skills:`
- **Context:** `<p className="mt-1"><span className="font-medium">Skills:</span> {formData.childcare_skills.join(', `
- **Suggested Key:** `common.skills`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\AuPairOnboarding.tsx:1042]**

- **String:** `Accommodation:`
- **Context:** `<p><span className="font-medium">Accommodation:</span> {formData.accommodation_preference}</p>`
- **Suggested Key:** `common.accommodation`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\AuPairOnboarding.tsx:1043]**

- **String:** `Smoker:`
- **Context:** `<p><span className="font-medium">Smoker:</span> {formData.smoker ? 'Yes' : 'No'}</p>`
- **Suggested Key:** `common.smoker`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\AuPairOnboarding.tsx:1054]**

- **String:** `Start Date:`
- **Context:** `<p><span className="font-medium">Start Date:</span> {formData.availability_start_date}</p>`
- **Suggested Key:** `common.start_date`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\AuPairOnboarding.tsx:1055]**

- **String:** `Duration:`
- **Context:** `<p><span className="font-medium">Duration:</span> {formData.duration_months} months</p>`
- **Suggested Key:** `common.duration`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\events\EventCard.tsx:75]**

- **String:** `Org`
- **Context:** `<img src={event.organizer.avatar_url} alt="Org" className="w-6 h-6 rounded-full object-cover border `
- **Suggested Key:** `common.org`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\HostFamilyOnboarding.tsx:576]**

- **String:** `Completion`
- **Context:** `<div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Completi`
- **Suggested Key:** `common.completion`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\HostFamilyOnboarding.tsx:667]**

- **String:** `Name`
- **Context:** `placeholder="Name"`
- **Suggested Key:** `common.name`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\HostFamilyOnboarding.tsx:674]**

- **String:** `Age`
- **Context:** `placeholder="Age"`
- **Suggested Key:** `common.age`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\HostFamilyOnboarding.tsx:683]**

- **String:** `Select`
- **Context:** `<option value="">Select</option>`
- **Suggested Key:** `common.select`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\HostFamilyOnboarding.tsx:692]**

- **String:** `Interests`
- **Context:** `placeholder="Interests"`
- **Suggested Key:** `common.interests`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\HostFamilyOnboarding.tsx:704]**

- **String:** `No children added yet.`
- **Context:** `<p className="text-sm text-gray-500 text-center py-2">No children added yet.</p>`
- **Suggested Key:** `common.no_children_added_yet`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\HostFamilyOnboarding.tsx:906]**

- **String:** `e.g. 2000`
- **Context:** `placeholder="e.g. 2000"`
- **Suggested Key:** `common.eg_2000`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\HostFamilyOnboarding.tsx:983]**

- **String:** `Please review all information before submitting. Click "Edit" to make changes.`
- **Context:** `<p className="text-gray-500 mb-6">Please review all information before submitting. Click "Edit" to m`
- **Suggested Key:** `common.please_review_all_information_before_submitting_cl`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\HostFamilyOnboarding.tsx:993]**

- **String:** `Name:`
- **Context:** `<p><span className="font-medium">Name:</span> {formData.family_name}</p>`
- **Suggested Key:** `common.name`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\HostFamilyOnboarding.tsx:994]**

- **String:** `Location:`
- **Context:** `<p><span className="font-medium">Location:</span> {formData.city}, {formData.country}</p>`
- **Suggested Key:** `common.location`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\HostFamilyOnboarding.tsx:995]**

- **String:** `Family Size:`
- **Context:** `<p><span className="font-medium">Family Size:</span> {formData.family_size}</p>`
- **Suggested Key:** `common.family_size`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\HostFamilyOnboarding.tsx:997]**

- **String:** `Children:`
- **Context:** `<span className="font-medium">Children:</span> {formData.children_details.length > 0`
- **Suggested Key:** `common.children`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\HostFamilyOnboarding.tsx:1011]**

- **String:** `Styles:`
- **Context:** `<p><span className="font-medium">Styles:</span> {formData.parenting_styles.join(', ')}</p>`
- **Suggested Key:** `common.styles`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\HostFamilyOnboarding.tsx:1012]**

- **String:** `Discipline:`
- **Context:** `<p><span className="font-medium">Discipline:</span> {formData.discipline_approach}</p>`
- **Suggested Key:** `common.discipline`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\HostFamilyOnboarding.tsx:1023]**

- **String:** `Looking for:`
- **Context:** `<p><span className="font-medium">Looking for:</span> {formData.preferred_traits.join(', ')}</p>`
- **Suggested Key:** `common.looking_for`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\HostFamilyOnboarding.tsx:1034]**

- **String:** `Start:`
- **Context:** `<p><span className="font-medium">Start:</span> {formData.start_date}</p>`
- **Suggested Key:** `common.start`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\HostFamilyOnboarding.tsx:1035]**

- **String:** `Salary:`
- **Context:** `<p><span className="font-medium">Salary:</span> ¥{formData.monthly_salary_offer}</p>`
- **Suggested Key:** `common.salary`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\HostFamilyOnboarding.tsx:1036]**

- **String:** `Duties:`
- **Context:** `<div className="col-span-2"><span className="font-medium">Duties:</span> {formData.daily_tasks.join(`
- **Suggested Key:** `common.duties`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\HostFamilyOnboarding.tsx:1047]**

- **String:** `Photos:`
- **Context:** `<p><span className="font-medium">Photos:</span> {formData.profile_photos.length} uploaded</p>`
- **Suggested Key:** `common.photos`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\HostFamilyOnboarding.tsx:1048]**

- **String:** `Video:`
- **Context:** `<p><span className="font-medium">Video:</span> {formData.intro_video_url ? 'Yes' : 'No'}</p>`
- **Suggested Key:** `common.video`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\jobs\InterviewScheduler.tsx:96]**

- **String:** `Schedule Interview`
- **Context:** `<h2 className="text-xl font-bold text-gray-900">Schedule Interview</h2>`
- **Suggested Key:** `common.schedule_interview`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\jobs\InterviewScheduler.tsx:200]**

- **String:** `Add any additional details, topics to discuss, or preparation needed...`
- **Context:** `placeholder="Add any additional details, topics to discuss, or preparation needed..."`
- **Suggested Key:** `common.add_any_additional_details_topics_to_discuss_or_pr`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\jobs\SayHiButton.tsx:131]**

- **String:** `Write a short message introducing yourself...`
- **Context:** `placeholder="Write a short message introducing yourself..."`
- **Suggested Key:** `common.write_a_short_message_introducing_yourself`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\JobsProtectedRoute.tsx:115]**

- **String:** `Loading...`
- **Context:** `<p className="text-gray-600">Loading...</p>`
- **Suggested Key:** `common.loading`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\JobsRoleSelection.tsx:22]**

- **String:** `Choose Your Role`
- **Context:** `<h2 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Role</h2>`
- **Suggested Key:** `common.choose_your_role`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\JobsRoleSelection.tsx:23]**

- **String:** `How would you like to use the Jobs platform?`
- **Context:** `<p className="text-gray-600">How would you like to use the Jobs platform?</p>`
- **Suggested Key:** `common.how_would_you_like_to_use_the_jobs_platform`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\JobsRoleSelection.tsx:42]**

- **String:** `Job Seeker`
- **Context:** `<h3 className="text-xl font-bold text-gray-900 mb-2">Job Seeker</h3>`
- **Suggested Key:** `common.job_seeker`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\JobsRoleSelection.tsx:64]**

- **String:** `Employer`
- **Context:** `<h3 className="text-xl font-bold text-gray-900 mb-2">Employer</h3>`
- **Suggested Key:** `common.employer`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\NotificationCenter.tsx:146]**

- **String:** `Notifications`
- **Context:** `<h3 className="font-semibold text-gray-900">Notifications</h3>`
- **Suggested Key:** `common.notifications`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\NotificationCenter.tsx:172]**

- **String:** `No notifications`
- **Context:** `<p>No notifications</p>`
- **Suggested Key:** `common.no_notifications`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\Sidebar.tsx:120]**

- **String:** `ANYCULTURE`
- **Context:** `<span className="text-xl font-bold text-white">ANYCULTURE</span>`
- **Suggested Key:** `common.anyculture`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\Sidebar.tsx:125]**

- **String:** `Close menu`
- **Context:** `aria-label="Close menu"`
- **Suggested Key:** `common.close_menu`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\Sidebar.tsx:197]**

- **String:** `Admin Portal`
- **Context:** `<span className="font-medium text-sm">Admin Portal</span>`
- **Suggested Key:** `common.admin_portal`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\stripe\SubscriptionStatus.tsx:57]**

- **String:** `No active subscription`
- **Context:** `<span className="text-yellow-800">No active subscription</span>`
- **Suggested Key:** `common.no_active_subscription`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\SubscriptionCard.tsx:8]**

- **String:** `Promise`
- **Context:** `onSubscribe: (priceId: string) => Promise<void>;`
- **Suggested Key:** `common.promise`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\SubscriptionCard.tsx:64]**

- **String:** `Unlimited access to Au Pair profiles`
- **Context:** `<span>Unlimited access to Au Pair profiles</span>`
- **Suggested Key:** `common.unlimited_access_to_au_pair_profiles`

**[..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\SubscriptionCard.tsx:68]**

- **String:** `View full profiles, photos, and videos`
- **Context:** `<span>View full profiles, photos, and videos</span>`
- **Suggested Key:** `common.view_full_profiles_photos_and_videos`


_... and 203 more high priority findings_

## Chinese Translations Pending

> [!NOTE]
> 2275 keys have "TODO" values and need Chinese translations.

- `common.welcome`
  - EN: "Hello"
  - ZH: "TODO"

- `common.institution`
  - EN: "Institution"
  - ZH: "TODO"

- `proficiency.Conversational`
  - EN: "Conversational"
  - ZH: "TODO"

- `hero.feature`
  - EN: "Feature"
  - ZH: "TODO"

- `hero.slide1.title`
  - EN: "Find Your Perfect Host Family"
  - ZH: "TODO"

- `hero.slide1.description`
  - EN: "Connect with welcoming families and start your cultural exchange journey today."
  - ZH: "TODO"

- `hero.slide1.cta`
  - EN: "Start Matching"
  - ZH: "TODO"

- `hero.slide2.title`
  - EN: "Share Your Talents"
  - ZH: "TODO"

- `hero.slide2.description`
  - EN: "Whether it is music, art, or language, share your skills with your host family."
  - ZH: "TODO"

- `hero.slide2.cta`
  - EN: "Showcase Skills"
  - ZH: "TODO"

- `hero.slide3.title`
  - EN: "Join Our Community Events"
  - ZH: "TODO"

- `hero.slide3.description`
  - EN: "Participate in local gatherings, festivals, and networking nights."
  - ZH: "TODO"

- `hero.slide3.cta`
  - EN: "Explore Events"
  - ZH: "TODO"

- `hero.slide4.title`
  - EN: "Discover Unique Finds"
  - ZH: "TODO"

- `hero.slide4.description`
  - EN: "Buy and sell items within your local community safely and easily."
  - ZH: "TODO"

- `hero.slide4.cta`
  - EN: "Buy Something"
  - ZH: "TODO"

- `hero.slide5.title`
  - EN: "Connect with Friends"
  - ZH: "TODO"

- `hero.slide5.description`
  - EN: "Join discussions, share experiences, and build lasting friendships."
  - ZH: "TODO"

- `hero.slide5.cta`
  - EN: "Communicate with Friends"
  - ZH: "TODO"

- `auth.fullName`
  - EN: "Full Name"
  - ZH: "TODO"

- `auth.firstName`
  - EN: "First Name"
  - ZH: "TODO"

- `auth.lastName`
  - EN: "Last Name"
  - ZH: "TODO"

- `auth.firstNamePlaceholder`
  - EN: "John"
  - ZH: "TODO"

- `auth.lastNamePlaceholder`
  - EN: "Doe"
  - ZH: "TODO"

- `auth.phone`
  - EN: "Phone"
  - ZH: "TODO"

- `auth.confirmPassword`
  - EN: "Confirm Password"
  - ZH: "TODO"

- `auth.googleSignInError`
  - EN: "Failed to sign in with Google"
  - ZH: "TODO"

- `auth.signInWithGoogle`
  - EN: "Sign in with Google"
  - ZH: "TODO"

- `auth.orContinueWith`
  - EN: "or continue with email"
  - ZH: "TODO"

- `auth.enterFullName`
  - EN: "Enter your full name"
  - ZH: "TODO"

- `auth.enterPhone`
  - EN: "+86 xxx xxxx xxxx"
  - ZH: "TODO"

- `auth.confirmPasswordPlaceholder`
  - EN: "Re-enter your password"
  - ZH: "TODO"

- `auth.optional`
  - EN: "optional"
  - ZH: "TODO"

- `auth.passwordRequirement`
  - EN: "Minimum 6 characters"
  - ZH: "TODO"

- `auth.passwordsDoNotMatch`
  - EN: "Passwords do not match"
  - ZH: "TODO"

- `auth.passwordTooShort`
  - EN: "Password must be at least 6 characters"
  - ZH: "TODO"

- `auth.mustAgreeToTerms`
  - EN: "You must agree to the terms and conditions"
  - ZH: "TODO"

- `auth.agreeToTerms`
  - EN: "I agree to the"
  - ZH: "TODO"

- `auth.termsOfService`
  - EN: "Terms of Service"
  - ZH: "TODO"

- `auth.and`
  - EN: "and"
  - ZH: "TODO"

- `auth.privacyPolicy`
  - EN: "Privacy Policy"
  - ZH: "TODO"

- `auth.accountCreated`
  - EN: "Account created! Redirecting..."
  - ZH: "TODO"

- `auth.createAccountDescription`
  - EN: "Join our community to access all features"
  - ZH: "TODO"

- `auth.resetPasswordDescription`
  - EN: "Enter your email and we'll send you a reset link"
  - ZH: "TODO"

- `auth.sendResetLink`
  - EN: "Send Reset Link"
  - ZH: "TODO"

- `auth.resetLinkSent`
  - EN: "Reset link sent!"
  - ZH: "TODO"

- `auth.checkEmailForReset`
  - EN: "Check your email for the password reset link"
  - ZH: "TODO"

- `auth.resetPasswordError`
  - EN: "Failed to send reset link"
  - ZH: "TODO"

- `auth.signInToAccount`
  - EN: "Sign in to your account"
  - ZH: "TODO"

- `auth.or`
  - EN: "Or"
  - ZH: "TODO"

- `auth.createNewAccount`
  - EN: "create a new account"
  - ZH: "TODO"

- `auth.logInToExisting`
  - EN: "sign in to your existing account"
  - ZH: "TODO"

- `auth.createYourAccount`
  - EN: "Create your account"
  - ZH: "TODO"

- `auth.signingIn`
  - EN: "Signing in..."
  - ZH: "TODO"

- `auth.creatingAccount`
  - EN: "Creating account..."
  - ZH: "TODO"

- `auth.unexpectedError`
  - EN: "An unexpected error occurred"
  - ZH: "TODO"

- `education.title`
  - EN: "Education"
  - ZH: "TODO"

- `education.program`
  - EN: "Program"
  - ZH: "TODO"

- `education.programs`
  - EN: "Programs"
  - ZH: "TODO"

- `education.detail.programOverview`
  - EN: "Program Overview"
  - ZH: "TODO"

- `education.detail.curriculum`
  - EN: "Curriculum"
  - ZH: "TODO"

- `education.detail.admissions`
  - EN: "Admissions"
  - ZH: "TODO"

- `education.detail.tuition`
  - EN: "Tuition & Fees"
  - ZH: "TODO"

- `education.create.location`
  - EN: "Location"
  - ZH: "TODO"

- `education.create.enterDocumentName`
  - EN: "Enter document name"
  - ZH: "TODO"

- `education.status.submitted`
  - EN: "Submitted"
  - ZH: "TODO"

- `education.status.under_review`
  - EN: "Under Review"
  - ZH: "TODO"

- `education.status.approved`
  - EN: "Approved"
  - ZH: "TODO"

- `education.status.rejected`
  - EN: "Rejected"
  - ZH: "TODO"

- `education.status.waitlisted`
  - EN: "Waitlisted"
  - ZH: "TODO"

- `education.status.documents_requested`
  - EN: "Documents Requested"
  - ZH: "TODO"

- `education.trackApplicationsDesc`
  - EN: "Track the status of your education program applications"
  - ZH: "TODO"

- `education.totalApplications`
  - EN: "Total Applications"
  - ZH: "TODO"

- `education.noApplications`
  - EN: "No Applications Yet"
  - ZH: "TODO"

- `education.explorePrograms`
  - EN: "Explore our education programs and start applying today."
  - ZH: "TODO"

- `education.browsePrograms`
  - EN: "Browse Programs"
  - ZH: "TODO"

- `education.applied`
  - EN: "Applied"
  - ZH: "TODO"

- `education.updated`
  - EN: "Updated"
  - ZH: "TODO"

- `education.docsSubmitted`
  - EN: "{{count}} Documents Submitted"
  - ZH: "TODO"

- `education.adminNotes`
  - EN: "Admin Notes"
  - ZH: "TODO"

- `education.viewProgram`
  - EN: "View Program"
  - ZH: "TODO"

- `education.additionalDocsRequested`
  - EN: "Additional Documents Requested"
  - ZH: "TODO"

- `education.checkNotes`
  - EN: "Please check the admin notes and update your application."
  - ZH: "TODO"

- `education.apply.title`
  - EN: "Submit Your Application"
  - ZH: "TODO"

- `education.apply.step`
  - EN: "Step {{step}} of {{total}}"
  - ZH: "TODO"

- `education.apply.personalInfo`
  - EN: "Personal Information"
  - ZH: "TODO"

- `education.apply.fullName`
  - EN: "Full Name *"
  - ZH: "TODO"

- `education.apply.fullNamePlaceholder`
  - EN: "Enter your full legal name"
  - ZH: "TODO"

- `education.apply.email`
  - EN: "Email Address *"
  - ZH: "TODO"

- `education.apply.emailHelp`
  - EN: "We'll use this to contact you"
  - ZH: "TODO"

- `education.apply.phone`
  - EN: "Phone Number"
  - ZH: "TODO"

- `education.apply.dob`
  - EN: "Date of Birth"
  - ZH: "TODO"

- `education.apply.nationality`
  - EN: "Nationality"
  - ZH: "TODO"

- `education.apply.nationalityPlaceholder`
  - EN: "e.g., Canadian, Chinese"
  - ZH: "TODO"

- `education.apply.location`
  - EN: "Current Location"
  - ZH: "TODO"

- `education.apply.locationPlaceholder`
  - EN: "City, Country"
  - ZH: "TODO"

- `education.apply.academicBackground`
  - EN: "Academic Background"
  - ZH: "TODO"

- `education.apply.educationLevel`
  - EN: "Current Education Level *"
  - ZH: "TODO"

- `education.apply.educationLevelPlaceholder`
  - EN: "Select your current level"
  - ZH: "TODO"

- `education.apply.institution`
  - EN: "Current/Most Recent Institution"
  - ZH: "TODO"


_... and 2175 more TODO keys_

## Files Missing i18n Import

> [!TIP]
> 18 files contain user-facing content but don't import useI18n.

- [..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\jobs\ApplicationCard.tsx](file:///C:/Users/OMEN/OneDrive/OneDrive/Desktop/Anicient tech/Anyiculture_final-main/Anyiculture_final-main/src/components/jobs/ApplicationCard.tsx)
- [..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\jobs\ApplicationPipeline.tsx](file:///C:/Users/OMEN/OneDrive/OneDrive/Desktop/Anicient tech/Anyiculture_final-main/Anyiculture_final-main/src/components/jobs/ApplicationPipeline.tsx)
- [..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\jobs\CandidateCard.tsx](file:///C:/Users/OMEN/OneDrive/OneDrive/Desktop/Anicient tech/Anyiculture_final-main/Anyiculture_final-main/src/components/jobs/CandidateCard.tsx)
- [..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\jobs\InterviewScheduler.tsx](file:///C:/Users/OMEN/OneDrive/OneDrive/Desktop/Anicient tech/Anyiculture_final-main/Anyiculture_final-main/src/components/jobs/InterviewScheduler.tsx)
- [..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\JobsRoleSelection.tsx](file:///C:/Users/OMEN/OneDrive/OneDrive/Desktop/Anicient tech/Anyiculture_final-main/Anyiculture_final-main/src/components/JobsRoleSelection.tsx)
- [..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\NotificationCenter.tsx](file:///C:/Users/OMEN/OneDrive/OneDrive/Desktop/Anicient tech/Anyiculture_final-main/Anyiculture_final-main/src/components/NotificationCenter.tsx)
- [..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\stripe\SubscriptionStatus.tsx](file:///C:/Users/OMEN/OneDrive/OneDrive/Desktop/Anicient tech/Anyiculture_final-main/Anyiculture_final-main/src/components/stripe/SubscriptionStatus.tsx)
- [..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\SubscriptionCard.tsx](file:///C:/Users/OMEN/OneDrive/OneDrive/Desktop/Anicient tech/Anyiculture_final-main/Anyiculture_final-main/src/components/SubscriptionCard.tsx)
- [..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\ui\GlobalLocationSelector.tsx](file:///C:/Users/OMEN/OneDrive/OneDrive/Desktop/Anicient tech/Anyiculture_final-main/Anyiculture_final-main/src/components/ui/GlobalLocationSelector.tsx)
- [..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\ui\MultiSelectField.tsx](file:///C:/Users/OMEN/OneDrive/OneDrive/Desktop/Anicient tech/Anyiculture_final-main/Anyiculture_final-main/src/components/ui/MultiSelectField.tsx)
- [..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\components\ui\RankedSelectField.tsx](file:///C:/Users/OMEN/OneDrive/OneDrive/Desktop/Anicient tech/Anyiculture_final-main/Anyiculture_final-main/src/components/ui/RankedSelectField.tsx)
- [..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\contexts\AuthContext.tsx](file:///C:/Users/OMEN/OneDrive/OneDrive/Desktop/Anicient tech/Anyiculture_final-main/Anyiculture_final-main/src/contexts/AuthContext.tsx)
- [..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\contexts\PersonalizationContext.tsx](file:///C:/Users/OMEN/OneDrive/OneDrive/Desktop/Anicient tech/Anyiculture_final-main/Anyiculture_final-main/src/contexts/PersonalizationContext.tsx)
- [..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\pages\AdminPortalPage.tsx](file:///C:/Users/OMEN/OneDrive/OneDrive/Desktop/Anicient tech/Anyiculture_final-main/Anyiculture_final-main/src/pages/AdminPortalPage.tsx)
- [..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\pages\employer\ApplicantManagementPage.tsx](file:///C:/Users/OMEN/OneDrive/OneDrive/Desktop/Anicient tech/Anyiculture_final-main/Anyiculture_final-main/src/pages/employer/ApplicantManagementPage.tsx)
- [..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\pages\InterviewsPage.tsx](file:///C:/Users/OMEN/OneDrive/OneDrive/Desktop/Anicient tech/Anyiculture_final-main/Anyiculture_final-main/src/pages/InterviewsPage.tsx)
- [..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\pages\VisaAdminReviewPage.tsx](file:///C:/Users/OMEN/OneDrive/OneDrive/Desktop/Anicient tech/Anyiculture_final-main/Anyiculture_final-main/src/pages/VisaAdminReviewPage.tsx)
- [..\..\..\..\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\services\recommendationEngine.ts](file:///C:/Users/OMEN/OneDrive/OneDrive/Desktop/Anicient tech/Anyiculture_final-main/Anyiculture_final-main/src/services/recommendationEngine.ts)
## i18n Best Practices Checklist

- [ ] No hardcoded strings in components
- [x] All keys exist in both EN and ZH
- [ ] No "TODO" values in translations
- [ ] Consistent naming conventions used
- [ ] Shared keys reused where applicable
- [ ] Pluralization rules properly implemented
- [ ] Language switcher tested and working

