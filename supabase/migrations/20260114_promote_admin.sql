/*
  # Promote User to Admin
  
  This script promotes a user to 'super_admin' by their email address.
  
  INSTRUCTIONS:
  1. Ensure the user exists in Authentication (Sign up if needed).
  2. Change the 'target_email' variable below if you want to promote a different user.
  3. Run this script in Supabase SQL Editor.
*/

DO $$
DECLARE
  target_email text := 'admin@anyiculture.com'; -- CHANGE THIS to your email if different
  target_user_id uuid;
BEGIN
  -- 1. Find the user ID by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = target_email;

  -- 2. Check if user exists
  IF target_user_id IS NULL THEN
    RAISE NOTICE 'User with email % not found. Please sign up first.', target_email;
    RETURN;
  END IF;

  -- 3. Insert into admin_roles (if not already there)
  INSERT INTO public.admin_roles (user_id, role, is_active)
  VALUES (target_user_id, 'super_admin', true)
  ON CONFLICT (user_id, role) DO UPDATE
  SET is_active = true;

  RAISE NOTICE 'SUCCESS: User % (%) is now a SUPER_ADMIN.', target_email, target_user_id;
END $$;
