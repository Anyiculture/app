-- Update is_admin to include email domain check
CREATE OR REPLACE FUNCTION is_admin(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN 
    -- 1. Check existing admin roles
    EXISTS (
      SELECT 1
      FROM admin_roles
      WHERE user_id = user_id_param
        AND is_active = true
    ) 
    OR 
    -- 2. Check email domain (Anyiculture staff)
    EXISTS (
      SELECT 1 
      FROM auth.users 
      WHERE id = user_id_param 
      AND (email LIKE '%@anyiculture.com' OR email = 'admin@anyiculture.com')
    );
END;
$$;

-- Update has_admin_role to treat email admins as super_admin or admin
CREATE OR REPLACE FUNCTION has_admin_role(user_id_param uuid, role_param text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If checking for generic 'admin' or 'super_admin', email domain counts
  IF role_param IN ('admin', 'super_admin') THEN
    IF EXISTS (
      SELECT 1 
      FROM auth.users 
      WHERE id = user_id_param 
      AND (email LIKE '%@anyiculture.com' OR email = 'admin@anyiculture.com')
    ) THEN
        RETURN true;
    END IF;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM admin_roles
    WHERE user_id = user_id_param
      AND role = role_param
      AND is_active = true
  );
END;
$$;
