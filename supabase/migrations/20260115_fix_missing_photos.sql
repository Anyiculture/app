-- Update missing profile photos for specific users
-- Using generated images to ensure they load correctly

DO $$ 
BEGIN 
    -- 1. Update Au Pair: Sandra B (Belgium)
    -- Using a professional headshot for an au pair
    UPDATE au_pair_profiles 
    SET profile_photos = ARRAY['https://coreva-normal.trae.ai/api/ide/v1/text_to_image?prompt=Professional%20portrait%20of%20young%20female%20au%20pair%20from%20Belgium%20smiling%20warm%20friendly%20blonde%20hair%20natural%20lighting&image_size=portrait_4_3']
    WHERE display_name ILIKE '%Sandra%' OR display_name ILIKE '%Sandra B%';

    -- 2. Update Host Family: The Shu Family
    -- Using a family portrait
    UPDATE host_family_profiles 
    SET 
        family_photos = ARRAY['https://coreva-normal.trae.ai/api/ide/v1/text_to_image?prompt=Happy%20Asian%20family%20portrait%20mother%20father%20and%20child%20smiling%20in%20living%20room%20warm%20lighting&image_size=landscape_4_3'],
        home_photos = ARRAY['https://coreva-normal.trae.ai/api/ide/v1/text_to_image?prompt=Modern%20spacious%20living%20room%20interior%20design%20clean%20bright%20welcoming%20home&image_size=landscape_16_9']
    WHERE family_name ILIKE '%Shu%';

    -- 3. Fix any other Host Families with empty photos or specific known broken ones
    -- Updating "The Wang Family" if they have the old broken link (though we fixed seed, live data might need update)
    UPDATE host_family_profiles 
    SET family_photos = ARRAY['https://coreva-normal.trae.ai/api/ide/v1/text_to_image?prompt=Happy%20family%20of%20four%20walking%20in%20park%20sunny%20day%20casual%20clothing&image_size=landscape_4_3']
    WHERE family_name ILIKE '%Wang%' AND (family_photos IS NULL OR array_length(family_photos, 1) = 0);

    -- 4. Fix any Au Pairs with empty photos
    UPDATE au_pair_profiles 
    SET profile_photos = ARRAY['https://coreva-normal.trae.ai/api/ide/v1/text_to_image?prompt=Friendly%20young%20woman%20student%20smiling%20portrait%20outdoors%20soft%20lighting&image_size=portrait_4_3']
    WHERE (profile_photos IS NULL OR array_length(profile_photos, 1) = 0);

END $$;
