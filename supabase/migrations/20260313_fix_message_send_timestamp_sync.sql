-- =====================================================
-- Fix message send post-insert timestamp sync
-- Date: 2026-03-13
-- =====================================================
-- Problem:
-- The frontend sends a message successfully, then calls
-- update_conversation_timestamp(conversation_id => uuid).
-- Older schemas only had the trigger function
-- update_conversation_timestamp() RETURNS trigger, so the RPC call fails
-- and the UI treats the send as failed.
--
-- This repair:
-- 1) Makes the trigger keep both updated_at and last_message_at aligned.
-- 2) Adds a callable RPC overload update_conversation_timestamp(uuid).
-- 3) Backfills last_message_at for existing conversations.
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.conversations
  SET
    updated_at = COALESCE(NEW.created_at, now()),
    last_message_at = COALESCE(NEW.created_at, now())
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_conversation_timestamp_trigger ON public.messages;
CREATE TRIGGER update_conversation_timestamp_trigger
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_timestamp();

DROP FUNCTION IF EXISTS public.update_conversation_timestamp(uuid);
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp(p_conversation_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_last_message_at timestamptz;
  v_updated_count integer := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = p_conversation_id
      AND cp.user_id = v_user_id
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.admin_roles ar
    WHERE ar.user_id = v_user_id
      AND ar.is_active = true
      AND ar.role IN ('super_admin', 'admin')
  ) THEN
    RAISE EXCEPTION 'Conversation not found for current user';
  END IF;

  SELECT MAX(m.created_at)
  INTO v_last_message_at
  FROM public.messages m
  WHERE m.conversation_id = p_conversation_id
    AND COALESCE(m.is_deleted, false) = false;

  UPDATE public.conversations c
  SET
    last_message_at = COALESCE(v_last_message_at, c.last_message_at, now()),
    updated_at = COALESCE(v_last_message_at, c.updated_at, now())
  WHERE c.id = p_conversation_id;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'conversation_id', p_conversation_id,
    'updated', v_updated_count > 0,
    'last_message_at', v_last_message_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_conversation_timestamp(uuid) TO authenticated;

UPDATE public.conversations c
SET
  last_message_at = latest.last_message_at,
  updated_at = CASE
    WHEN c.updated_at IS NULL OR c.updated_at < latest.last_message_at THEN latest.last_message_at
    ELSE c.updated_at
  END
FROM (
  SELECT
    m.conversation_id,
    MAX(m.created_at) AS last_message_at
  FROM public.messages m
  WHERE COALESCE(m.is_deleted, false) = false
  GROUP BY m.conversation_id
) latest
WHERE c.id = latest.conversation_id
  AND (
    c.last_message_at IS DISTINCT FROM latest.last_message_at
    OR c.updated_at IS NULL
    OR c.updated_at < latest.last_message_at
  );

NOTIFY pgrst, 'reload schema';
