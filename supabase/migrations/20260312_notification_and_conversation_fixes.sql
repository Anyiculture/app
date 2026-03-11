-- =====================================================
-- NOTIFICATION + CONVERSATION DELIVERY FIXES
-- Date: 2026-03-12
-- =====================================================
-- Fixes:
-- 1) Ensure notification schema/functions are aligned with frontend.
-- 2) Guarantee payment approval/rejection notifications via trigger fallback.
-- 3) Broadcast notification when a new community post is created.
-- =====================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notifications'
      AND column_name = 'link'
  ) THEN
    ALTER TABLE public.notifications RENAME COLUMN link TO link_url;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notifications'
      AND column_name = 'read'
  ) THEN
    ALTER TABLE public.notifications RENAME COLUMN read TO is_read;
  END IF;
END $$;

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS read_at timestamptz;

ALTER TABLE public.notifications
  ALTER COLUMN is_read SET DEFAULT false;

UPDATE public.notifications
SET is_read = false
WHERE is_read IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread_v2
  ON public.notifications(user_id, is_read)
  WHERE is_read = false;

-- Existing deployments may have these RPCs with different return types.
-- Drop first so CREATE does not fail with "cannot change return type".
DROP FUNCTION IF EXISTS public.get_unread_count();
DROP FUNCTION IF EXISTS public.mark_notification_read(uuid);
DROP FUNCTION IF EXISTS public.mark_all_notifications_read();

CREATE OR REPLACE FUNCTION public.get_unread_count()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT COUNT(*)::integer
  FROM public.notifications n
  WHERE n.user_id = auth.uid()
    AND COALESCE(n.is_read, false) = false;
$$;

CREATE OR REPLACE FUNCTION public.mark_notification_read(notification_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_updated integer := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.notifications
  SET
    is_read = true,
    read_at = COALESCE(read_at, now())
  WHERE id = notification_id
    AND user_id = v_user_id;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_updated integer := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.notifications
  SET
    is_read = true,
    read_at = COALESCE(read_at, now())
  WHERE user_id = v_user_id
    AND COALESCE(is_read, false) = false;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_unread_count() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_notification_read(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read() TO authenticated;

CREATE OR REPLACE FUNCTION public.notify_user_payment_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_exists boolean := false;
  v_message text;
  v_link text;
BEGIN
  IF NEW.plan_type <> 'host_family_premium' THEN
    RETURN NEW;
  END IF;

  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  IF NEW.status NOT IN ('approved', 'rejected') THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.notifications n
    WHERE n.user_id = NEW.user_id
      AND n.type = 'payment_update'
      AND COALESCE(n.metadata->>'submission_id', '') = NEW.id::text
      AND COALESCE(n.metadata->>'status', '') = NEW.status
  )
  INTO v_exists;

  IF v_exists THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'approved' THEN
    v_message := 'Payment approved. Premium access is now active.';
    v_link := '/account?section=billing';
  ELSE
    v_message := 'Payment rejected. Please resubmit your payment proof.';
    v_link := '/au-pair/payment';
  END IF;

  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    link_url,
    metadata,
    is_read
  ) VALUES (
    NEW.user_id,
    'payment_update',
    'Payment status updated',
    v_message,
    v_link,
    jsonb_build_object(
      'submission_id', NEW.id,
      'status', NEW.status,
      'plan_type', NEW.plan_type
    ),
    false
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_user_payment_status_change ON public.payment_submissions;
CREATE TRIGGER trg_notify_user_payment_status_change
AFTER UPDATE OF status ON public.payment_submissions
FOR EACH ROW
EXECUTE FUNCTION public.notify_user_payment_status_change();

CREATE OR REPLACE FUNCTION public.notify_users_new_community_post()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_author_name text := 'A community member';
  v_preview text := '';
BEGIN
  IF COALESCE(NEW.is_deleted, false) = true THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(NULLIF(p.display_name, ''), NULLIF(p.full_name, ''), p.email, 'A community member')
  INTO v_author_name
  FROM public.profiles p
  WHERE p.id = NEW.author_id;

  v_preview := LEFT(COALESCE(NEW.content, ''), 120);

  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    link_url,
    metadata,
    is_read
  )
  SELECT
    p.id,
    'community_post',
    'New community post',
    v_author_name || ' posted: ' || v_preview,
    '/community',
    jsonb_build_object(
      'post_id', NEW.id,
      'author_id', NEW.author_id,
      'category', NEW.category
    ),
    false
  FROM public.profiles p
  WHERE p.id <> NEW.author_id
    AND COALESCE(p.is_banned, false) = false;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_users_new_community_post ON public.community_posts;
CREATE TRIGGER trg_notify_users_new_community_post
AFTER INSERT ON public.community_posts
FOR EACH ROW
EXECUTE FUNCTION public.notify_users_new_community_post();
