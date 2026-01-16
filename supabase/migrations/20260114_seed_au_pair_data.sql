-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Helper function to create user if not exists
CREATE OR REPLACE FUNCTION create_dummy_user(
  p_email text,
  p_password text,
  p_full_name text,
  p_role text -- 'host_family' or 'au_pair'
) RETURNS uuid AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Check if user exists
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
  
  IF v_user_id IS NULL THEN
    -- Create user in auth.users
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      p_email,
      crypt(p_password, gen_salt('bf')),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      jsonb_build_object('full_name', p_full_name),
      now(),
      now()
    ) RETURNING id INTO v_user_id;
    
    -- Also insert into public.users if your schema requires it (based on foreign key error)
    -- Some Supabase setups mirror auth.users to public.users via triggers, but if it's missing:
    INSERT INTO public.users (id, email, created_at, updated_at)
    VALUES (v_user_id, p_email, now(), now())
    ON CONFLICT (id) DO NOTHING;

    -- Create profile in public.profiles
    INSERT INTO public.profiles (
      id,
      email,
      full_name,
      display_name,
      au_pair_role,
      onboarding_completed,
      au_pair_onboarding_completed,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      p_email,
      p_full_name,
      p_full_name,
      p_role::au_pair_role,
      true,
      true,
      now(),
      now()
    );
  END IF;
  
  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  v_uid uuid;
BEGIN
  --------------------------------------------------------------------------------
  -- 1. Create Host Families
  --------------------------------------------------------------------------------
  
  -- Family 1: The Chen Family (Shanghai)
  v_uid := create_dummy_user('family.chen@example.com', 'password123', 'The Chen Family', 'host_family');
  
  INSERT INTO public.host_family_profiles (
    user_id, family_name, family_type, parent_occupations,
    country, city, neighborhood, housing_type,
    private_room, shared_bathroom, helper_present,
    children_count, children_ages, children_personalities,
    daily_tasks, weekly_schedule, extra_activities, flexibility_expectations,
    preferred_nationalities, language_level_required, experience_required_years,
    monthly_salary_offer, benefits,
    languages_spoken,
    home_photos, family_photos,
    profile_status,
    expectations,
    rules
  ) VALUES (
    v_uid, 'The Chen Family', 'nuclear', 'Tech Executive & Artist',
    'China', 'Shanghai', 'French Concession', 'Apartment',
    true, false, true,
    2, ARRAY[4, 7], ARRAY['Curious', 'Energetic', 'Creative'],
    ARRAY['School drop-off/pickup', 'English tutoring', 'Playtime'], 'Weekdays 3pm-8pm, Weekends free', 'Piano lessons, Swimming', 'Moderate',
    ARRAY['United States', 'United Kingdom', 'Canada'], 'native', 1,
    8000.00, ARRAY['Gym membership', 'Chinese lessons', 'Transportation card'],
    ARRAY['Mandarin', 'English'],
    ARRAY['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80'], -- Home
    ARRAY['https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=800&q=80'], -- Family
    'active',
    'We are looking for a big sister figure who can help our children improve their English while having fun.',
    '{"curfew": "23:00", "no_smoking": true, "guests_allowed": true}'::jsonb
  ) ON CONFLICT (user_id) DO NOTHING;

  -- Family 2: The Li Family (Beijing)
  v_uid := create_dummy_user('family.li@example.com', 'password123', 'The Li Family', 'host_family');
  
  INSERT INTO public.host_family_profiles (
    user_id, family_name, family_type, parent_occupations,
    country, city, neighborhood, housing_type,
    private_room, shared_bathroom, helper_present,
    children_count, children_ages, children_personalities,
    daily_tasks, weekly_schedule, extra_activities, flexibility_expectations,
    preferred_nationalities, language_level_required, experience_required_years,
    monthly_salary_offer, benefits,
    languages_spoken,
    home_photos, family_photos,
    profile_status,
    expectations,
    rules
  ) VALUES (
    v_uid, 'The Li Family', 'nuclear', 'University Professor & Doctor',
    'China', 'Beijing', 'Haidian District', 'Villa',
    true, true, false,
    1, ARRAY[5], ARRAY['Shy', 'Intelligent'],
    ARRAY['Homework help', 'Reading', 'Outdoor activities'], 'Flexible schedule', 'Museum visits', 'High',
    ARRAY['Germany', 'France', 'Australia'], 'fluent', 2,
    10000.00, ARRAY['Private bathroom', 'Travel with family'],
    ARRAY['Mandarin', 'English', 'German'],
    ARRAY['https://images.unsplash.com/photo-1600596542815-22b5c1221b83?auto=format&fit=crop&w=800&q=80'],
    ARRAY['https://images.unsplash.com/photo-1542037104857-ffbb0b9155fb?auto=format&fit=crop&w=800&q=80'],
    'active',
    'We value education and cultural exchange. Looking for someone patient and kind.',
    '{"no_smoking": true}'::jsonb
  ) ON CONFLICT (user_id) DO NOTHING;

  -- Family 3: The Wang Family (Shenzhen)
  v_uid := create_dummy_user('family.wang@example.com', 'password123', 'The Wang Family', 'host_family');
  
  INSERT INTO public.host_family_profiles (
    user_id, family_name, family_type, parent_occupations,
    country, city, neighborhood, housing_type,
    private_room, shared_bathroom, helper_present,
    children_count, children_ages, children_personalities,
    daily_tasks, weekly_schedule, extra_activities, flexibility_expectations,
    preferred_nationalities, language_level_required, experience_required_years,
    monthly_salary_offer, benefits,
    languages_spoken,
    home_photos, family_photos,
    profile_status,
    expectations,
    rules
  ) VALUES (
    v_uid, 'The Wang Family', 'single_parent', 'Entrepreneur',
    'China', 'Shenzhen', 'Nanshan', 'Penthouse',
    true, false, true,
    3, ARRAY[2, 5, 9], ARRAY['Active', 'Loud', 'Funny'],
    ARRAY['Sports', 'Bedtime routine', 'English practice'], 'Afternoons and weekends', 'Tennis, Soccer', 'Low',
    ARRAY['Spain', 'Brazil', 'Italy'], 'intermediate', 3,
    12000.00, ARRAY['Flight reimbursement', 'Performance bonus'],
    ARRAY['Mandarin', 'Cantonese', 'English'],
    ARRAY['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80'],
    ARRAY['https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=800&q=80'],
    'active',
    'Busy household needs energetic big brother/sister!',
    '{"no_drinking": true, "no_smoking": true}'::jsonb
  ) ON CONFLICT (user_id) DO NOTHING;

  -- Family 4: The Zhang Family (Chengdu)
  v_uid := create_dummy_user('family.zhang@example.com', 'password123', 'The Zhang Family', 'host_family');
  
  INSERT INTO public.host_family_profiles (
    user_id, family_name, family_type, parent_occupations,
    country, city, neighborhood, housing_type,
    private_room, shared_bathroom, helper_present,
    children_count, children_ages, children_personalities,
    daily_tasks, weekly_schedule, extra_activities, flexibility_expectations,
    preferred_nationalities, language_level_required, experience_required_years,
    monthly_salary_offer, benefits,
    languages_spoken,
    home_photos, family_photos,
    profile_status,
    expectations,
    rules
  ) VALUES (
    v_uid, 'The Zhang Family', 'extended', 'Restaurant Owners',
    'China', 'Chengdu', 'Jinjiang', 'House',
    true, false, false,
    2, ARRAY[3, 6], ARRAY['Foodie', 'Calm'],
    ARRAY['Teaching English', 'Light housework', 'Cooking together'], 'Standard 30 hours', 'Cooking classes', 'Moderate',
    ARRAY['Any'], 'fluent', 0,
    6000.00, ARRAY['All meals included', 'Cultural trips'],
    ARRAY['Mandarin', 'Sichuanese'],
    ARRAY['https://images.unsplash.com/photo-1580587771525-78b9dba3b91d?auto=format&fit=crop&w=800&q=80'],
    ARRAY['https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80'],
    'active',
    'Come enjoy the best food in China and teach us English!',
    '{}'::jsonb
  ) ON CONFLICT (user_id) DO NOTHING;

  -- Family 5: The Zhao Family (Hangzhou)
  v_uid := create_dummy_user('family.zhao@example.com', 'password123', 'The Zhao Family', 'host_family');
  
  INSERT INTO public.host_family_profiles (
    user_id, family_name, family_type, parent_occupations,
    country, city, neighborhood, housing_type,
    private_room, shared_bathroom, helper_present,
    children_count, children_ages, children_personalities,
    daily_tasks, weekly_schedule, extra_activities, flexibility_expectations,
    preferred_nationalities, language_level_required, experience_required_years,
    monthly_salary_offer, benefits,
    languages_spoken,
    home_photos, family_photos,
    profile_status,
    expectations,
    rules
  ) VALUES (
    v_uid, 'The Zhao Family', 'nuclear', 'Alibaba Managers',
    'China', 'Hangzhou', 'Binjiang', 'Apartment',
    true, true, true,
    1, ARRAY[4], ARRAY['Smart', 'Active'],
    ARRAY['English immersion', 'Coding games', 'Park visits'], 'Evenings', 'Robotics club', 'High',
    ARRAY['United States', 'Canada'], 'native', 2,
    9000.00, ARRAY['Lake view room', 'Weekend trips'],
    ARRAY['Mandarin', 'English'],
    ARRAY['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80'],
    ARRAY['https://images.unsplash.com/photo-1536640712-4d4c36ff0e4e?auto=format&fit=crop&w=800&q=80'],
    'active',
    'Tech-forward family looking for smart companion for our son.',
    '{"curfew": "22:00"}'::jsonb
  ) ON CONFLICT (user_id) DO NOTHING;

  --------------------------------------------------------------------------------
  -- 2. Create Au Pairs
  --------------------------------------------------------------------------------

  -- Au Pair 1: Sarah Jenkins (USA)
  v_uid := create_dummy_user('sarah.jenkins@example.com', 'password123', 'Sarah Jenkins', 'au_pair');
  
  INSERT INTO public.au_pair_profiles (
    user_id, display_name, age, gender, nationality,
    current_country, current_city,
    languages, education_level, field_of_study,
    childcare_experience_years, age_groups_worked, previous_au_pair,
    experience_description, skills,
    preferred_countries, preferred_cities,
    working_hours_preference, days_off_preference, live_in_preference,
    available_from, duration_months,
    profile_photos, intro_video_url, bio,
    profile_status
  ) VALUES (
    v_uid, 'Sarah J.', 23, 'female', 'United States',
    'United States', 'Chicago',
    '[{"language": "English", "proficiency": "native"}, {"language": "Spanish", "proficiency": "basic"}]'::jsonb,
    'Bachelor', 'Early Childhood Education',
    4, ARRAY['0-2', '3-5', '6-12'], true,
    'I have babysat for 4 years and was an Au Pair in France last summer.',
    ARRAY['First Aid', 'Swimming', 'Cooking'],
    ARRAY['China'], ARRAY['Shanghai', 'Beijing'],
    '30-35 hours/week', 'Weekends', 'live_in',
    '2026-03-01', 12,
    ARRAY['https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=800&q=80'],
    'https://www.youtube.com/watch?v=dummy',
    'Hi! I am Sarah from Chicago. I love kids and want to learn Mandarin.',
    'active'
  ) ON CONFLICT (user_id) DO NOTHING;

  -- Au Pair 2: Elena Rodriguez (Spain)
  v_uid := create_dummy_user('elena.rodriguez@example.com', 'password123', 'Elena Rodriguez', 'au_pair');
  
  INSERT INTO public.au_pair_profiles (
    user_id, display_name, age, gender, nationality,
    current_country, current_city,
    languages, education_level, field_of_study,
    childcare_experience_years, age_groups_worked, previous_au_pair,
    experience_description, skills,
    preferred_countries, preferred_cities,
    working_hours_preference, days_off_preference, live_in_preference,
    available_from, duration_months,
    profile_photos, intro_video_url, bio,
    profile_status
  ) VALUES (
    v_uid, 'Elena R.', 25, 'female', 'Spain',
    'Spain', 'Madrid',
    '[{"language": "Spanish", "proficiency": "native"}, {"language": "English", "proficiency": "fluent"}]'::jsonb,
    'Master', 'Psychology',
    2, ARRAY['6-12'], false,
    'I have worked as a camp counselor and private tutor.',
    ARRAY['Tutoring', 'Arts & Crafts'],
    ARRAY['China'], ARRAY['Shenzhen', 'Guangzhou'],
    '25-30 hours/week', 'Flexible', 'live_in',
    '2026-02-15', 6,
    ARRAY['https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80'],
    NULL,
    'Hola! I am Elena. I am patient, creative, and eager to explore Chinese culture.',
    'active'
  ) ON CONFLICT (user_id) DO NOTHING;

  -- Au Pair 3: Mike Ross (Canada)
  v_uid := create_dummy_user('mike.ross@example.com', 'password123', 'Mike Ross', 'au_pair');
  
  INSERT INTO public.au_pair_profiles (
    user_id, display_name, age, gender, nationality,
    current_country, current_city,
    languages, education_level, field_of_study,
    childcare_experience_years, age_groups_worked, previous_au_pair,
    experience_description, skills,
    preferred_countries, preferred_cities,
    working_hours_preference, days_off_preference, live_in_preference,
    available_from, duration_months,
    profile_photos, intro_video_url, bio,
    profile_status
  ) VALUES (
    v_uid, 'Mike R.', 22, 'male', 'Canada',
    'Canada', 'Vancouver',
    '[{"language": "English", "proficiency": "native"}, {"language": "French", "proficiency": "intermediate"}]'::jsonb,
    'Bachelor', 'Sports Science',
    3, ARRAY['6-12', '13+'], true,
    'Sports coach for kids soccer team for 3 years.',
    ARRAY['Sports', 'Driving', 'Swimming'],
    ARRAY['China'], ARRAY['Beijing', 'Chengdu'],
    '30 hours/week', 'Weekends', 'live_in',
    '2026-04-01', 9,
    ARRAY['https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80'],
    NULL,
    'Energetic big brother figure who loves sports and outdoors.',
    'active'
  ) ON CONFLICT (user_id) DO NOTHING;

  -- Au Pair 4: Anna Müller (Germany)
  v_uid := create_dummy_user('anna.muller@example.com', 'password123', 'Anna Müller', 'au_pair');
  
  INSERT INTO public.au_pair_profiles (
    user_id, display_name, age, gender, nationality,
    current_country, current_city,
    languages, education_level, field_of_study,
    childcare_experience_years, age_groups_worked, previous_au_pair,
    experience_description, skills,
    preferred_countries, preferred_cities,
    working_hours_preference, days_off_preference, live_in_preference,
    available_from, duration_months,
    profile_photos, intro_video_url, bio,
    profile_status
  ) VALUES (
    v_uid, 'Anna M.', 20, 'female', 'Germany',
    'Germany', 'Berlin',
    '[{"language": "German", "proficiency": "native"}, {"language": "English", "proficiency": "fluent"}]'::jsonb,
    'High School', 'Gap Year',
    1, ARRAY['3-5', '6-12'], false,
    'Babysitting for neighbors and younger cousins.',
    ARRAY['Music', 'Piano', 'Cooking'],
    ARRAY['China'], ARRAY['Any'],
    '40 hours/week', 'Sunday', 'live_in',
    '2026-05-01', 12,
    ARRAY['https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80'],
    NULL,
    'Organized and musical. I can teach piano and German.',
    'active'
  ) ON CONFLICT (user_id) DO NOTHING;

  -- Au Pair 5: Sophie Dubois (France)
  v_uid := create_dummy_user('sophie.dubois@example.com', 'password123', 'Sophie Dubois', 'au_pair');
  
  INSERT INTO public.au_pair_profiles (
    user_id, display_name, age, gender, nationality,
    current_country, current_city,
    languages, education_level, field_of_study,
    childcare_experience_years, age_groups_worked, previous_au_pair,
    experience_description, skills,
    preferred_countries, preferred_cities,
    working_hours_preference, days_off_preference, live_in_preference,
    available_from, duration_months,
    profile_photos, intro_video_url, bio,
    profile_status
  ) VALUES (
    v_uid, 'Sophie D.', 24, 'female', 'France',
    'France', 'Paris',
    '[{"language": "French", "proficiency": "native"}, {"language": "English", "proficiency": "advanced"}, {"language": "Mandarin", "proficiency": "beginner"}]'::jsonb,
    'Bachelor', 'Fashion Design',
    2, ARRAY['3-5'], false,
    'Art teacher for toddlers.',
    ARRAY['Arts & Crafts', 'Painting', 'Fashion'],
    ARRAY['China'], ARRAY['Shanghai'],
    '20-25 hours/week', 'Weekends', 'live_out',
    '2026-06-01', 3,
    ARRAY['https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'],
    NULL,
    'Creative soul looking for an artistic family in Shanghai.',
    'active'
  ) ON CONFLICT (user_id) DO NOTHING;

END $$;
