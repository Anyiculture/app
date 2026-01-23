-- Security Fix: Add explicit search_path to prevent search_path injection attacks
-- This migration fixes the "role mutable search_path" vulnerability identified by Supabase security advisor
-- by adding "SET search_path = public, pg_temp" to all affected functions.

-- 1. Fix update_user_presence_timestamp
-- Use CASCADE to handle the trigger dependency, then recreate the trigger
DROP FUNCTION IF EXISTS public.update_user_presence_timestamp() CASCADE;
CREATE OR REPLACE FUNCTION public.update_user_presence_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Recreate the trigger after dropping it via CASCADE
CREATE TRIGGER trigger_update_user_presence_timestamp
    BEFORE UPDATE ON public.user_presence
    FOR EACH ROW
    EXECUTE FUNCTION update_user_presence_timestamp();

-- 2. Fix mark_inactive_users_offline
DROP FUNCTION IF EXISTS public.mark_inactive_users_offline();
CREATE OR REPLACE FUNCTION public.mark_inactive_users_offline()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    UPDATE public.user_presence
    SET is_online = FALSE
    WHERE is_online = TRUE
      AND updated_at < NOW() - INTERVAL '2 minutes';
END;
$$;

-- 3. Fix get_admin_visa_applications (already exists, adding search_path)
DROP FUNCTION IF EXISTS public.get_admin_visa_applications();
CREATE OR REPLACE FUNCTION public.get_admin_visa_applications()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN (
    SELECT coalesce(json_agg(
      row_to_json(t)
    ), '[]'::json)
    FROM (
      SELECT
        va.*,
        json_build_object(
          'display_name', p.display_name,
          'email', u.email
        ) as profile
      FROM visa_applications va
      LEFT JOIN auth.users u ON va.user_id = u.id
      LEFT JOIN profiles p ON va.user_id = p.id
      ORDER BY va.updated_at DESC
    ) t
  );
END;
$$;

-- 4. is_admin already has SET search_path = public (confirmed in 20260115_fix_admin_roles_recursion.sql)
-- No change needed

-- 5. Fix get_user_conversations
DROP FUNCTION IF EXISTS public.get_user_conversations(uuid);
CREATE OR REPLACE FUNCTION public.get_user_conversations(user_id_param uuid)
RETURNS TABLE (
    conversation_id uuid,
    context_type text,
    context_id uuid,
    context_title text,
    last_message_content text,
    last_message_at timestamptz,
    unread_count bigint,
    other_user_id uuid,
    other_user_name text,
    other_user_avatar text,
    is_archived boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT DISTINCT ON (c.id)
        c.id as conversation_id,
        c.context_type,
        c.context_id,
        c.context_title,
        m.content as last_message_content,
        m.created_at as last_message_at,
        (
            SELECT COUNT(*)
            FROM messages m2
            WHERE m2.conversation_id = c.id
            AND m2.sender_id != user_id_param
            AND m2.read = false
        ) as unread_count,
        other_p.user_id as other_user_id,
        other_p.display_name as other_user_name,
        other_p.avatar_url as other_user_avatar,
        COALESCE(
            (SELECT cp.is_archived
             FROM conversation_participants cp
             WHERE cp.conversation_id = c.id
             AND cp.user_id = user_id_param),
            false
        ) as is_archived
    FROM conversations c
    INNER JOIN conversation_participants cp ON c.id = cp.conversation_id
    LEFT JOIN messages m ON c.id = m.conversation_id
    LEFT JOIN conversation_participants other_cp ON c.id = other_cp.conversation_id 
        AND other_cp.user_id != user_id_param
    LEFT JOIN profiles other_p ON other_cp.user_id = other_p.id
    WHERE cp.user_id = user_id_param
    AND COALESCE(cp.is_archived, false) = false
    ORDER BY c.id, m.created_at DESC NULLS LAST;
$$;

-- 6. Fix review_payment_submission
DROP FUNCTION IF EXISTS public.review_payment_submission(uuid, text, text);
CREATE OR REPLACE FUNCTION public.review_payment_submission(
    submission_id_param uuid,
    new_status_param text,
    review_notes_param text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    submission_record record;
    result json;
BEGIN
    -- Check if user is admin
    IF NOT EXISTS (
        SELECT 1 FROM admin_roles 
        WHERE user_id = auth.uid() 
        AND is_active = true
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    -- Validate status
    IF new_status_param NOT IN ('pending', 'approved', 'rejected') THEN
        RAISE EXCEPTION 'Invalid status: must be pending, approved, or rejected';
    END IF;

    -- Get and update the submission
    UPDATE payment_submissions
    SET 
        status = new_status_param,
        review_notes = COALESCE(review_notes_param, review_notes),
        reviewed_at = NOW(),
        reviewed_by = auth.uid()
    WHERE id = submission_id_param
    RETURNING * INTO submission_record;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment submission not found';
    END IF;

    -- If approved, activate the subscription
    IF new_status_param = 'approved' THEN
        UPDATE au_pair_subscriptions
        SET 
            status = 'active',
            start_date = NOW(),
            end_date = CASE 
                WHEN submission_record.plan_type = 'annual' THEN NOW() + INTERVAL '1 year'
                ELSE NOW() + INTERVAL '1 month'
            END
        WHERE user_id = submission_record.user_id;
    END IF;

    -- Return the result
    SELECT json_build_object(
        'id', submission_record.id,
        'status', submission_record.status,
        'reviewed_at', submission_record.reviewed_at
    ) INTO result;

    RETURN result;
END;
$$;

-- 7. Fix redeem_code
DROP FUNCTION IF EXISTS public.redeem_code(text);
CREATE OR REPLACE FUNCTION public.redeem_code(code_input text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    code_record record;
    result json;
BEGIN
    -- Find and lock the code
    SELECT * INTO code_record
    FROM redemption_codes
    WHERE code = code_input
    AND is_active = true
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid or inactive code';
    END IF;

    -- Check if already used
    IF code_record.used_by IS NOT NULL THEN
        RAISE EXCEPTION 'Code has already been used';
    END IF;

    -- Check expiration
    IF code_record.expires_at IS NOT NULL AND code_record.expires_at < NOW() THEN
        RAISE EXCEPTION 'Code has expired';
    END IF;

    -- Check usage limit
    IF code_record.max_uses IS NOT NULL AND code_record.times_used >= code_record.max_uses THEN
        RAISE EXCEPTION 'Code has reached maximum usage';
    END IF;

    -- Mark as used
    UPDATE redemption_codes
    SET 
        used_by = auth.uid(),
        used_at = NOW(),
        times_used = times_used + 1
    WHERE code = code_input;

    -- Apply the benefit based on code type
    IF code_record.benefit_type = 'premium_subscription' THEN
        INSERT INTO au_pair_subscriptions (user_id, plan_type, status, start_date, end_date)
        VALUES (
            auth.uid(),
            COALESCE(code_record.benefit_value::text, 'monthly'),
            'active',
            NOW(),
            NOW() + INTERVAL '1 month'
        )
        ON CONFLICT (user_id) DO UPDATE
        SET 
            status = 'active',
            start_date = NOW(),
            end_date = NOW() + INTERVAL '1 month';
    END IF;

    SELECT json_build_object(
        'success', true,
        'benefit_type', code_record.benefit_type,
        'benefit_value', code_record.benefit_value
    ) INTO result;

    RETURN result;
END;
$$;

-- 8. Fix is_admin_internal
DROP FUNCTION IF EXISTS public.is_admin_internal();
CREATE OR REPLACE FUNCTION public.is_admin_internal()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM admin_roles
    WHERE user_id = auth.uid()
    AND is_active = true
    AND role IN ('super_admin', 'admin')
  );
$$;

-- 9. Fix admin_delete_user
DROP FUNCTION IF EXISTS public.admin_delete_user(uuid);
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT is_admin_internal() THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Prevent self-deletion
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot delete your own account via admin function';
  END IF;

  -- Delete user (cascade will handle related records)
  DELETE FROM auth.users WHERE id = target_user_id;

  RETURN json_build_object('success', true, 'user_id', target_user_id);
END;
$$;

-- 10. Fix update_visa_status_admin
DROP FUNCTION IF EXISTS public.update_visa_status_admin(uuid, text);
CREATE OR REPLACE FUNCTION public.update_visa_status_admin(
    application_id uuid,
    new_status text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    result_data json;
BEGIN
    -- Check admin permission
    IF NOT is_admin_internal() THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    -- Update the visa application status
    UPDATE visa_applications
    SET 
        status = new_status,
        updated_at = NOW()
    WHERE id = application_id
    RETURNING json_build_object(
        'id', id,
        'status', status,
        'updated_at', updated_at
    ) INTO result_data;

    IF result_data IS NULL THEN
        RAISE EXCEPTION 'Visa application not found';
    END IF;

    RETURN result_data;
END;
$$;

-- 11. Fix delete_visa_application_admin
DROP FUNCTION IF EXISTS public.delete_visa_application_admin(uuid);
CREATE OR REPLACE FUNCTION public.delete_visa_application_admin(application_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Check admin permission
    IF NOT is_admin_internal() THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    -- Delete the visa application
    DELETE FROM visa_applications WHERE id = application_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Visa application not found';
    END IF;

    RETURN json_build_object('success', true, 'id', application_id);
END;
$$;

-- 12. Fix get_admin_au_pair_profiles
DROP FUNCTION IF EXISTS public.get_admin_au_pair_profiles();
CREATE OR REPLACE FUNCTION public.get_admin_au_pair_profiles()
RETURNS SETOF au_pair_profiles
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT * FROM au_pair_profiles ORDER BY created_at DESC;
$$;

-- 13. Fix get_admin_host_family_profiles
DROP FUNCTION IF EXISTS public.get_admin_host_family_profiles();
CREATE OR REPLACE FUNCTION public.get_admin_host_family_profiles()
RETURNS SETOF host_family_profiles
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT * FROM host_family_profiles ORDER BY created_at DESC;
$$;

-- 14. Fix get_admin_education_interests
DROP FUNCTION IF EXISTS public.get_admin_education_interests();
CREATE OR REPLACE FUNCTION public.get_admin_education_interests()
RETURNS TABLE (
    id uuid,
    user_id uuid,
    program_id uuid,
    status text,
    created_at timestamptz,
    user_email text,
    user_name text,
    program_name text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT 
        ei.id,
        ei.user_id,
        ei.program_id,
        ei.status,
        ei.created_at,
        u.email as user_email,
        p.display_name as user_name,
        ep.name as program_name
    FROM education_interests ei
    LEFT JOIN auth.users u ON ei.user_id = u.id
    LEFT JOIN profiles p ON ei.user_id = p.id
    LEFT JOIN education_programs ep ON ei.program_id = ep.id
    ORDER BY ei.created_at DESC;
$$;

-- RLS Policy Documentation
-- Note: The following RLS policies intentionally allow unrestricted public INSERT for contact forms
-- and newsletter subscriptions. This is by design for public-facing forms.
-- Rate limiting and spam prevention should be handled at the application level.

COMMENT ON POLICY "Allow public insert to contact" ON public.contact_submissions IS 
'Intentionally allows public INSERT for contact form submissions. Rate limiting handled at application level.';

COMMENT ON POLICY "Allow public insert to newsletter" ON public.newsletter_subscribers IS 
'Intentionally allows public INSERT for newsletter sign-ups. Rate limiting handled at application level.';
