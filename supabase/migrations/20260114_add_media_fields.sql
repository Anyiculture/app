-- Add profile_photos and intro_video_url to host_family_profiles if they don't exist

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'host_family_profiles' AND column_name = 'profile_photos') THEN 
        ALTER TABLE host_family_profiles ADD COLUMN profile_photos text[] DEFAULT '{}'; 
    END IF; 

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'host_family_profiles' AND column_name = 'intro_video_url') THEN 
        ALTER TABLE host_family_profiles ADD COLUMN intro_video_url text; 
    END IF; 

    -- Also check au_pair_profiles just in case, though it should be there
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'au_pair_profiles' AND column_name = 'profile_photos') THEN 
        ALTER TABLE au_pair_profiles ADD COLUMN profile_photos text[] DEFAULT '{}'; 
    END IF; 

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'au_pair_profiles' AND column_name = 'intro_video_url') THEN 
        ALTER TABLE au_pair_profiles ADD COLUMN intro_video_url text; 
    END IF; 
END $$;
