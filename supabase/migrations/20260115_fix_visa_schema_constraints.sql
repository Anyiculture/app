-- Fix Visa Schema: Update Check Constraint and Add Missing Types
-- This migration updates the visa_type check constraint to include new visa types (Tourist, Talent, Crew)

DO $$
BEGIN
  -- 1. Drop the existing check constraint
  ALTER TABLE visa_applications DROP CONSTRAINT IF EXISTS visa_applications_visa_type_check;

  -- 2. Add the new check constraint with all supported types
  ALTER TABLE visa_applications 
  ADD CONSTRAINT visa_applications_visa_type_check 
  CHECK (visa_type IN (
    'work_z', 
    'student_x', 
    'family_q', 
    'family_s', 
    'business_m', 
    'tourist_l', 
    'talent_r', 
    'crew_c', 
    'other'
  ));

END $$;
