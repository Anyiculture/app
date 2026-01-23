-- Fix all blocking foreign keys to allow profile deletion
-- This migration adds CASCADE or SET NULL to tables that prevent profile deletion

-- Visa-related tables: SET NULL for audit trail
ALTER TABLE visa_applications
DROP CONSTRAINT IF EXISTS visa_applications_reviewed_by_fkey,
ADD CONSTRAINT visa_applications_reviewed_by_fkey
  FOREIGN KEY (reviewed_by)
  REFERENCES profiles(id)
  ON DELETE SET NULL;

ALTER TABLE visa_application_history
DROP CONSTRAINT IF EXISTS visa_application_history_changed_by_fkey,
ADD CONSTRAINT visa_application_history_changed_by_fkey
  FOREIGN KEY (changed_by)
  REFERENCES profiles(id)
  ON DELETE SET NULL;

ALTER TABLE visa_document_requests
DROP CONSTRAINT IF EXISTS visa_document_requests_requested_by_fkey,
ADD CONSTRAINT visa_document_requests_requested_by_fkey
  FOREIGN KEY (requested_by)
  REFERENCES profiles(id)
  ON DELETE SET NULL;

-- Payments: SET NULL for audit trail
ALTER TABLE payments
DROP CONSTRAINT IF EXISTS payments_confirmed_by_fkey,
ADD CONSTRAINT payments_confirmed_by_fkey
  FOREIGN KEY (confirmed_by)
  REFERENCES profiles(id)
  ON DELETE SET NULL;

-- Payment submissions: CASCADE (user-owned data)
ALTER TABLE payment_submissions
DROP CONSTRAINT IF EXISTS payment_submissions_user_id_fkey,
ADD CONSTRAINT payment_submissions_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES profiles(id)
  ON DELETE CASCADE;

-- Jobseeker profiles: CASCADE (user-owned data)
ALTER TABLE profiles_jobseeker
DROP CONSTRAINT IF EXISTS profiles_jobseeker_profile_id_fkey,
ADD CONSTRAINT profiles_jobseeker_profile_id_fkey
  FOREIGN KEY (profile_id)
  REFERENCES profiles(id)
  ON DELETE CASCADE;
