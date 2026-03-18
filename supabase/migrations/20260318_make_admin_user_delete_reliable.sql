-- Make admin ban/delete reliable on the current schema.
-- Hard-deleting auth.users fails when related rows use NO ACTION FKs,
-- so these functions perform an application-level delete/ban:
-- 1. disable the account in public.profiles
-- 2. mark related au pair / host family profiles deleted or banned
-- 3. block the email from reuse
-- 4. keep auth.users intact to avoid FK failures

CREATE OR REPLACE FUNCTION public.is_admin_internal()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_roles
    WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
      AND is_active = true
  );
$$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_banned boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE TABLE IF NOT EXISTS public.blocked_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  email_hash text GENERATED ALWAYS AS (lower(trim(email))) STORED,
  reason text DEFAULT 'admin_deleted',
  blocked_at timestamptz DEFAULT now(),
  blocked_by uuid REFERENCES auth.users(id),
  original_user_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blocked_emails_hash ON public.blocked_emails(email_hash);
CREATE INDEX IF NOT EXISTS idx_blocked_emails_email ON public.blocked_emails(email);

ALTER TABLE public.blocked_emails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can check blocked status" ON public.blocked_emails;
CREATE POLICY "Users can check blocked status"
  ON public.blocked_emails
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can manage blocked emails" ON public.blocked_emails;
CREATE POLICY "Admins can manage blocked emails"
  ON public.blocked_emails
  FOR ALL
  TO authenticated
  USING (is_admin_internal())
  WITH CHECK (is_admin_internal());

DROP FUNCTION IF EXISTS public.admin_delete_user(uuid);
DROP FUNCTION IF EXISTS public.admin_ban_user(uuid, boolean);

CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_email text;
BEGIN
  IF NOT is_admin_internal() THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot delete your own account via admin function';
  END IF;

  SELECT email
  INTO v_email
  FROM auth.users
  WHERE id = target_user_id;

  UPDATE public.profiles
  SET
    deleted_at = now(),
    is_banned = true,
    updated_at = now()
  WHERE id = target_user_id;

  UPDATE public.au_pair_profiles
  SET
    profile_status = 'deleted',
    updated_at = now()
  WHERE user_id = target_user_id;

  UPDATE public.host_family_profiles
  SET
    profile_status = 'deleted',
    updated_at = now()
  WHERE user_id = target_user_id;

  IF v_email IS NOT NULL THEN
    INSERT INTO public.blocked_emails (email, original_user_id, reason, blocked_by)
    VALUES (v_email, target_user_id, 'admin_deleted', auth.uid())
    ON CONFLICT (email) DO UPDATE
    SET
      blocked_at = now(),
      reason = 'admin_deleted',
      blocked_by = auth.uid(),
      original_user_id = target_user_id,
      metadata = COALESCE(public.blocked_emails.metadata, '{}'::jsonb) || jsonb_build_object('redeleted_at', now()),
      updated_at = now();
  END IF;

  INSERT INTO public.admin_activity_log (admin_id, action, resource_type, resource_id, details)
  VALUES (
    auth.uid(),
    'delete_user',
    'profiles',
    target_user_id,
    jsonb_build_object(
      'email', v_email,
      'mode', 'soft_permanent',
      'auth_user_retained', true
    )
  );

  RETURN json_build_object(
    'success', true,
    'user_id', target_user_id,
    'email_blocked', v_email IS NOT NULL,
    'auth_user_deleted', false
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_ban_user(target_user_id uuid, should_ban boolean)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_email text;
BEGIN
  IF NOT is_admin_internal() THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot ban yourself';
  END IF;

  SELECT email
  INTO v_email
  FROM auth.users
  WHERE id = target_user_id;

  UPDATE public.profiles
  SET
    is_banned = should_ban,
    updated_at = now()
  WHERE id = target_user_id;

  IF should_ban THEN
    UPDATE public.au_pair_profiles
    SET profile_status = 'banned', updated_at = now()
    WHERE user_id = target_user_id;

    UPDATE public.host_family_profiles
    SET profile_status = 'banned', updated_at = now()
    WHERE user_id = target_user_id;

    IF v_email IS NOT NULL THEN
      INSERT INTO public.blocked_emails (email, original_user_id, reason, blocked_by)
      VALUES (v_email, target_user_id, 'admin_banned', auth.uid())
      ON CONFLICT (email) DO UPDATE
      SET
        blocked_at = now(),
        reason = 'admin_banned',
        blocked_by = auth.uid(),
        original_user_id = target_user_id,
        metadata = COALESCE(public.blocked_emails.metadata, '{}'::jsonb) || jsonb_build_object('rebanned_at', now()),
        updated_at = now();
    END IF;
  ELSE
    DELETE FROM public.blocked_emails
    WHERE original_user_id = target_user_id
      AND reason = 'admin_banned';

    UPDATE public.au_pair_profiles
    SET profile_status = 'active', updated_at = now()
    WHERE user_id = target_user_id
      AND profile_status = 'banned';

    UPDATE public.host_family_profiles
    SET profile_status = 'active', updated_at = now()
    WHERE user_id = target_user_id
      AND profile_status = 'banned';
  END IF;

  RETURN json_build_object(
    'success', true,
    'user_id', target_user_id,
    'banned', should_ban
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_ban_user(uuid, boolean) TO authenticated;
