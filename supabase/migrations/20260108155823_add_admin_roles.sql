/*
  # Admin Roles and Permissions System

  1. New Tables
    - `admin_roles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `role` (text) - admin, super_admin, moderator
      - `permissions` (jsonb) - array of permission strings
      - `granted_by` (uuid, foreign key to auth.users)
      - `granted_at` (timestamp)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `admin_activity_log`
      - `id` (uuid, primary key)
      - `admin_id` (uuid, foreign key to auth.users)
      - `action` (text)
      - `resource_type` (text)
      - `resource_id` (uuid)
      - `details` (jsonb)
      - `ip_address` (text)
      - `user_agent` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for admin access
    - Add policies for viewing admin logs
*/

-- Admin Roles Table
CREATE TABLE IF NOT EXISTS admin_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'super_admin', 'moderator', 'education_admin', 'jobs_admin', 'marketplace_admin', 'events_admin')),
  permissions jsonb DEFAULT '[]'::jsonb,
  granted_by uuid REFERENCES auth.users(id),
  granted_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Admin Activity Log
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text,
  resource_id uuid,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_roles_user_id ON admin_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_roles_role ON admin_roles(role);
CREATE INDEX IF NOT EXISTS idx_admin_roles_active ON admin_roles(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_id ON admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created_at ON admin_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_resource ON admin_activity_log(resource_type, resource_id);

-- Enable RLS
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_roles
-- Super admins and the user themselves can view their roles
CREATE POLICY "Users can view own admin roles"
  ON admin_roles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM admin_roles ar
      WHERE ar.user_id = auth.uid()
        AND ar.role = 'super_admin'
        AND ar.is_active = true
    )
  );

-- Only super admins can grant roles
CREATE POLICY "Super admins can grant roles"
  ON admin_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_roles ar
      WHERE ar.user_id = auth.uid()
        AND ar.role = 'super_admin'
        AND ar.is_active = true
    )
  );

-- Only super admins can modify roles
CREATE POLICY "Super admins can modify roles"
  ON admin_roles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles ar
      WHERE ar.user_id = auth.uid()
        AND ar.role = 'super_admin'
        AND ar.is_active = true
    )
  );

-- Only super admins can delete roles
CREATE POLICY "Super admins can delete roles"
  ON admin_roles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles ar
      WHERE ar.user_id = auth.uid()
        AND ar.role = 'super_admin'
        AND ar.is_active = true
    )
  );

-- RLS Policies for admin_activity_log
-- Admins can view activity logs
CREATE POLICY "Admins can view activity logs"
  ON admin_activity_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles ar
      WHERE ar.user_id = auth.uid()
        AND ar.is_active = true
    )
  );

-- System can insert activity logs
CREATE POLICY "Admins can insert activity logs"
  ON admin_activity_log FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_roles ar
      WHERE ar.user_id = auth.uid()
        AND ar.is_active = true
    )
  );

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM admin_roles
    WHERE user_id = user_id_param
      AND is_active = true
  );
END;
$$;

-- Helper function to check if user has specific role
CREATE OR REPLACE FUNCTION has_admin_role(user_id_param uuid, role_param text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM admin_roles
    WHERE user_id = user_id_param
      AND role = role_param
      AND is_active = true
  );
END;
$$;

-- Helper function to check if user has permission
CREATE OR REPLACE FUNCTION has_permission(user_id_param uuid, permission_param text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM admin_roles
    WHERE user_id = user_id_param
      AND is_active = true
      AND (
        role = 'super_admin' OR
        permissions @> to_jsonb(permission_param)
      )
  );
END;
$$;

-- Function to log admin activity
CREATE OR REPLACE FUNCTION log_admin_activity(
  action_param text,
  resource_type_param text DEFAULT NULL,
  resource_id_param uuid DEFAULT NULL,
  details_param jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO admin_activity_log (
    admin_id,
    action,
    resource_type,
    resource_id,
    details
  ) VALUES (
    auth.uid(),
    action_param,
    resource_type_param,
    resource_id_param,
    details_param
  );
END;
$$;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_admin_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_admin_roles_updated_at ON admin_roles;
CREATE TRIGGER update_admin_roles_updated_at
  BEFORE UPDATE ON admin_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_roles_updated_at();
