-- =====================================================
-- Fix conversation deletion (chat archiving) reliability
-- Date: 2026-03-13
-- =====================================================
-- Root issue:
-- - Frontend deletes by archiving conversation_participants.is_archived
-- - Some environments do not have a stable UPDATE path for that table
--   (missing policy/function drift), so delete fails with RLS/permission errors.
--
-- This migration:
-- 1) Guarantees archive column exists and is normalized
-- 2) Ensures users can update their own participant row when needed
-- 3) Introduces a single secure RPC: archive_conversation(uuid)
-- =====================================================

ALTER TABLE public.conversation_participants
  ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false;

ALTER TABLE public.conversation_participants
  ALTER COLUMN is_archived SET DEFAULT false;

UPDATE public.conversation_participants
SET is_archived = false
WHERE is_archived IS NULL;

CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_archived
  ON public.conversation_participants(user_id, is_archived, conversation_id);

DROP POLICY IF EXISTS "Users can update own participant rows" ON public.conversation_participants;
CREATE POLICY "Users can update own participant rows"
  ON public.conversation_participants
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE OR REPLACE FUNCTION public.archive_conversation(conversation_id_param uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_updated_count integer := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = conversation_id_param
      AND cp.user_id = v_user_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Conversation not found for current user'
    );
  END IF;

  UPDATE public.conversation_participants cp
  SET is_archived = true
  WHERE cp.conversation_id = conversation_id_param
    AND cp.user_id = v_user_id
    AND COALESCE(cp.is_archived, false) = false;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'archived', true,
    'already_archived', (v_updated_count = 0),
    'conversation_id', conversation_id_param
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.archive_conversation(uuid) TO authenticated;
