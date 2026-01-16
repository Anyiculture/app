-- Migration to update visa_applications and community_posts

DO $$ 
BEGIN 
    -- 1. Update visa_applications table
    -- Add first_name and last_name if they don't exist (replacing/augmenting full_name)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visa_applications' AND column_name = 'first_name') THEN 
        ALTER TABLE visa_applications ADD COLUMN first_name text; 
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visa_applications' AND column_name = 'last_name') THEN 
        ALTER TABLE visa_applications ADD COLUMN last_name text; 
    END IF;

    -- Update check constraint for visa_type to include new types if not already compatible
    -- Note: modifying check constraints usually requires dropping and re-adding. 
    -- We'll just add a comment here that the application logic will handle the new types string values 
    -- and if the constraint is strict, we need to drop it.
    -- Assuming we can drop the old constraint if it exists.
    ALTER TABLE visa_applications DROP CONSTRAINT IF EXISTS visa_applications_visa_type_check;
    -- Re-add with expanded types
    ALTER TABLE visa_applications ADD CONSTRAINT visa_applications_visa_type_check 
    CHECK (visa_type IN ('work_z', 'student_x', 'family_q', 'family_s', 'business_m', 'tourist_l', 'talent_r', 'crew_c', 'other'));

    -- 2. Update community_posts table for images
    -- Check if 'images' column exists (it seemed to exist in schema as text[], but let's ensure)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'community_posts' AND column_name = 'images') THEN 
        ALTER TABLE community_posts ADD COLUMN images text[] DEFAULT '{}'; 
    END IF;
    
    -- Ensure image_urls also exists if used by frontend logic (schema showed both, standardizing on one is better but let's keep both safe)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'community_posts' AND column_name = 'image_urls') THEN 
        ALTER TABLE community_posts ADD COLUMN image_urls text[] DEFAULT '{}'; 
    END IF;

END $$;
