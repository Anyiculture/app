-- =====================================================
-- Unify conversation creation, admin support routing,
-- and premium host-family messaging rules.
-- Date: 2026-03-13
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'normalize_host_family_subscription_status'
  ) THEN
    RAISE EXCEPTION 'Missing public.normalize_host_family_subscription_status(). Apply the host-family subscription source-of-truth migration first.';
  END IF;
END $$;

-- Keep the local users table aligned for conversation foreign keys.
INSERT INTO public.users (id, email, created_at, updated_at)
SELECT
  au.id,
  au.email,
  COALESCE(au.created_at, now()),
  COALESCE(au.updated_at, au.created_at, now())
FROM auth.users au
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  updated_at = COALESCE(EXCLUDED.updated_at, public.users.updated_at, now());

ALTER TABLE public.conversation_participants
  ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false;

ALTER TABLE public.conversation_participants
  ALTER COLUMN is_archived SET DEFAULT false;

UPDATE public.conversation_participants
SET is_archived = false
WHERE is_archived IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'conversations'
      AND column_name = 'participant1_id'
  ) THEN
    EXECUTE '
      INSERT INTO public.conversation_participants (conversation_id, user_id, is_archived)
      SELECT id, participant1_id, false
      FROM public.conversations
      WHERE participant1_id IS NOT NULL
      ON CONFLICT DO NOTHING
    ';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'conversations'
      AND column_name = 'participant2_id'
  ) THEN
    EXECUTE '
      INSERT INTO public.conversation_participants (conversation_id, user_id, is_archived)
      SELECT id, participant2_id, false
      FROM public.conversations
      WHERE participant2_id IS NOT NULL
      ON CONFLICT DO NOTHING
    ';
  END IF;
END $$;

DELETE FROM public.conversation_participants a
USING public.conversation_participants b
WHERE a.ctid < b.ctid
  AND a.conversation_id = b.conversation_id
  AND a.user_id = b.user_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_conversation_participants_conversation_user
  ON public.conversation_participants(conversation_id, user_id);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_archived_lookup
  ON public.conversation_participants(user_id, is_archived, conversation_id);

CREATE INDEX IF NOT EXISTS idx_conversations_context_lookup_v2
  ON public.conversations(context_type, context_id, created_at);

CREATE OR REPLACE FUNCTION public.is_admin(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.admin_roles ar
    WHERE ar.user_id = user_id_param
      AND ar.is_active = true
      AND ar.role IN ('super_admin', 'admin')
  )
  OR EXISTS (
    SELECT 1
    FROM auth.users au
    WHERE au.id = user_id_param
      AND (au.email = 'admin@anyiculture.com' OR au.email LIKE '%@anyiculture.com')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT public.is_admin((select auth.uid()));
$$;

CREATE OR REPLACE FUNCTION public.sync_public_user_from_auth(p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user auth.users%ROWTYPE;
BEGIN
  SELECT *
  INTO v_user
  FROM auth.users
  WHERE id = p_user_id;

  IF v_user.id IS NULL THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (
    v_user.id,
    v_user.email,
    COALESCE(v_user.created_at, now()),
    COALESCE(v_user.updated_at, v_user.created_at, now())
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    updated_at = COALESCE(EXCLUDED.updated_at, public.users.updated_at, now());

  RETURN v_user.id;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_conversation_participant(
  p_conversation_id uuid,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = p_conversation_id
      AND cp.user_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.get_support_admin_user_id(
  p_requester_user_id uuid DEFAULT (select auth.uid())
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
DECLARE
  v_admin_user_id uuid;
BEGIN
  SELECT ar.user_id
  INTO v_admin_user_id
  FROM public.admin_roles ar
  WHERE ar.is_active = true
    AND ar.role IN ('super_admin', 'admin')
  ORDER BY
    CASE WHEN ar.user_id = p_requester_user_id THEN 1 ELSE 0 END,
    CASE ar.role WHEN 'super_admin' THEN 0 ELSE 1 END,
    COALESCE(ar.granted_at, ar.created_at) ASC,
    ar.user_id ASC
  LIMIT 1;

  IF v_admin_user_id IS NULL THEN
    SELECT au.id
    INTO v_admin_user_id
    FROM auth.users au
    WHERE au.email = 'admin@anyiculture.com'
       OR au.email LIKE '%@anyiculture.com'
    ORDER BY
      CASE WHEN au.id = p_requester_user_id THEN 1 ELSE 0 END,
      CASE WHEN au.email = 'admin@anyiculture.com' THEN 0 ELSE 1 END,
      au.created_at ASC,
      au.id ASC
    LIMIT 1;
  END IF;

  IF v_admin_user_id IS NOT NULL THEN
    PERFORM public.sync_public_user_from_auth(v_admin_user_id);
  END IF;

  RETURN v_admin_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.can_initiate_direct_conversation(
  p_actor_user_id uuid,
  p_target_user_id uuid,
  p_context_type text DEFAULT 'support'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
DECLARE
  v_context_type text := lower(trim(COALESCE(p_context_type, 'support')));
  v_actor_is_admin boolean := COALESCE(public.is_admin(p_actor_user_id), false);
  v_target_is_admin boolean := COALESCE(public.is_admin(p_target_user_id), false);
  v_subscription_state jsonb;
  v_subscription_status text := 'free';
BEGIN
  IF p_actor_user_id IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'Not authenticated');
  END IF;

  IF p_target_user_id IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'Target user not found');
  END IF;

  IF p_actor_user_id = p_target_user_id THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'Self chat is not allowed');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users au WHERE au.id = p_target_user_id) THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'Target user not found');
  END IF;

  IF v_actor_is_admin THEN
    RETURN jsonb_build_object('allowed', true, 'reason', 'admin_bypass');
  END IF;

  IF v_target_is_admin THEN
    RETURN jsonb_build_object('allowed', true, 'reason', 'user_to_admin');
  END IF;

  IF v_context_type = 'aupair' THEN
    v_subscription_state := public.normalize_host_family_subscription_status(p_actor_user_id, false);
    IF COALESCE(v_subscription_state->>'role', 'general') = 'host_family' THEN
      v_subscription_status := COALESCE(v_subscription_state->>'subscription_status', 'free');
      IF v_subscription_status <> 'premium_active' THEN
        RETURN jsonb_build_object(
          'allowed', false,
          'reason', format('Host family subscription status is %s, premium_active required', v_subscription_status)
        );
      END IF;
    END IF;
  END IF;

  RETURN jsonb_build_object('allowed', true, 'reason', 'allowed');
END;
$$;

CREATE OR REPLACE FUNCTION public.can_send_message_to_conversation(
  p_conversation_id uuid,
  p_actor_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
DECLARE
  v_context_type text;
  v_subscription_state jsonb;
BEGIN
  IF NOT public.is_conversation_participant(p_conversation_id, p_actor_user_id) THEN
    RETURN false;
  END IF;

  IF COALESCE(public.is_admin(p_actor_user_id), false) THEN
    RETURN true;
  END IF;

  SELECT c.context_type
  INTO v_context_type
  FROM public.conversations c
  WHERE c.id = p_conversation_id;

  IF COALESCE(v_context_type, '') <> 'aupair' THEN
    RETURN true;
  END IF;

  v_subscription_state := public.normalize_host_family_subscription_status(p_actor_user_id, false);
  IF COALESCE(v_subscription_state->>'role', 'general') <> 'host_family' THEN
    RETURN true;
  END IF;

  RETURN COALESCE(v_subscription_state->>'subscription_status', 'free') = 'premium_active';
END;
$$;

DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
CREATE POLICY "Users can create conversations"
  ON public.conversations
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Participants can view conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;
CREATE POLICY "Participants can view conversations"
  ON public.conversations
  FOR SELECT
  TO authenticated
  USING (
    public.is_conversation_participant(id, (select auth.uid()))
    OR COALESCE(public.is_admin((select auth.uid())), false)
  );

DROP POLICY IF EXISTS "Participants can update conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;
CREATE POLICY "Participants can update conversations"
  ON public.conversations
  FOR UPDATE
  TO authenticated
  USING (
    public.is_conversation_participant(id, (select auth.uid()))
    OR COALESCE(public.is_admin((select auth.uid())), false)
  )
  WITH CHECK (
    public.is_conversation_participant(id, (select auth.uid()))
    OR COALESCE(public.is_admin((select auth.uid())), false)
  );

DROP POLICY IF EXISTS "Users can add participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can add conversation participants" ON public.conversation_participants;
CREATE POLICY "Users can add conversation participants"
  ON public.conversation_participants
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Users can view own participant rows" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view own participant records" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view own participations" ON public.conversation_participants;
CREATE POLICY "Users can view participant rows for their conversations"
  ON public.conversation_participants
  FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR public.is_conversation_participant(conversation_id, (select auth.uid()))
    OR COALESCE(public.is_admin((select auth.uid())), false)
  );

DROP POLICY IF EXISTS "Users can update own participant rows" ON public.conversation_participants;
CREATE POLICY "Users can update own participant rows"
  ON public.conversation_participants
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Conversation participants can view messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
CREATE POLICY "Users can view messages in their conversations"
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (
    public.is_conversation_participant(conversation_id, (select auth.uid()))
    OR COALESCE(public.is_admin((select auth.uid())), false)
  );

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages"
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = (select auth.uid())
    AND public.can_send_message_to_conversation(conversation_id, (select auth.uid()))
  );

DROP POLICY IF EXISTS "Users can update messages in their conversations" ON public.messages;
CREATE POLICY "Users can update messages in their conversations"
  ON public.messages
  FOR UPDATE
  TO authenticated
  USING (
    public.is_conversation_participant(conversation_id, (select auth.uid()))
    OR COALESCE(public.is_admin((select auth.uid())), false)
  )
  WITH CHECK (
    public.is_conversation_participant(conversation_id, (select auth.uid()))
    OR COALESCE(public.is_admin((select auth.uid())), false)
  );

CREATE OR REPLACE FUNCTION public.get_or_create_direct_conversation(
  p_target_user_id uuid DEFAULT NULL,
  p_context_type text DEFAULT 'support',
  p_context_id uuid DEFAULT NULL,
  p_related_title text DEFAULT NULL,
  p_initial_message text DEFAULT NULL,
  p_initial_message_type text DEFAULT 'user',
  p_resolve_admin_target boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_current_user_id uuid := auth.uid();
  v_target_user_id uuid := p_target_user_id;
  v_context_type text := lower(trim(COALESCE(p_context_type, 'support')));
  v_initial_message_type text := lower(trim(COALESCE(p_initial_message_type, 'user')));
  v_permission jsonb;
  v_existing_conversation_id uuid;
  v_conversation_id uuid;
  v_message_id uuid;
  v_lock_key text;
  v_pair_key text;
  v_created boolean := false;
BEGIN
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_initial_message_type NOT IN ('user', 'system', 'admin') THEN
    RAISE EXCEPTION 'Invalid initial message type: %', v_initial_message_type;
  END IF;

  IF p_resolve_admin_target THEN
    v_target_user_id := public.get_support_admin_user_id(v_current_user_id);
  END IF;

  IF v_target_user_id IS NULL THEN
    RAISE EXCEPTION 'No admin account is configured for support conversations';
  END IF;

  IF v_target_user_id = v_current_user_id THEN
    RAISE EXCEPTION 'Self chat is not allowed';
  END IF;

  PERFORM public.sync_public_user_from_auth(v_current_user_id);
  PERFORM public.sync_public_user_from_auth(v_target_user_id);

  v_permission := public.can_initiate_direct_conversation(
    v_current_user_id,
    v_target_user_id,
    v_context_type
  );

  IF NOT COALESCE((v_permission->>'allowed')::boolean, false) THEN
    RAISE EXCEPTION '%', COALESCE(v_permission->>'reason', 'Conversation is not allowed');
  END IF;

  v_pair_key := CASE
    WHEN v_current_user_id::text < v_target_user_id::text
      THEN v_current_user_id::text || ':' || v_target_user_id::text
    ELSE v_target_user_id::text || ':' || v_current_user_id::text
  END;

  v_lock_key := format(
    '%s|%s|%s',
    v_pair_key,
    v_context_type,
    COALESCE(p_context_id::text, 'no-context')
  );

  PERFORM pg_advisory_xact_lock(hashtext(v_lock_key)::bigint);

  SELECT c.id
  INTO v_existing_conversation_id
  FROM public.conversations c
  INNER JOIN public.conversation_participants cp_current
    ON cp_current.conversation_id = c.id
   AND cp_current.user_id = v_current_user_id
  INNER JOIN public.conversation_participants cp_target
    ON cp_target.conversation_id = c.id
   AND cp_target.user_id = v_target_user_id
  WHERE COALESCE(c.context_type, 'support') = v_context_type
    AND (
      (p_context_id IS NULL AND c.context_id IS NULL)
      OR c.context_id = p_context_id
    )
  ORDER BY c.created_at ASC, c.id ASC
  LIMIT 1;

  IF v_existing_conversation_id IS NOT NULL THEN
    v_conversation_id := v_existing_conversation_id;
    UPDATE public.conversation_participants
    SET is_archived = false
    WHERE conversation_id = v_conversation_id
      AND user_id IN (v_current_user_id, v_target_user_id);

    UPDATE public.conversations
    SET
      related_item_title = COALESCE(related_item_title, p_related_title),
      updated_at = now()
    WHERE id = v_conversation_id;
  ELSE
    INSERT INTO public.conversations (
      context_type,
      context_id,
      related_item_title,
      created_at,
      updated_at
    )
    VALUES (
      v_context_type,
      p_context_id,
      p_related_title,
      now(),
      now()
    )
    RETURNING id INTO v_conversation_id;

    INSERT INTO public.conversation_participants (
      conversation_id,
      user_id,
      is_archived
    )
    VALUES
      (v_conversation_id, v_current_user_id, false),
      (v_conversation_id, v_target_user_id, false)
    ON CONFLICT (conversation_id, user_id) DO UPDATE
    SET is_archived = false;

    v_created := true;
  END IF;

  IF NULLIF(trim(COALESCE(p_initial_message, '')), '') IS NOT NULL THEN
    INSERT INTO public.messages (
      conversation_id,
      sender_id,
      content,
      message_type
    )
    VALUES (
      v_conversation_id,
      v_current_user_id,
      p_initial_message,
      v_initial_message_type::public.message_type
    )
    RETURNING id INTO v_message_id;

    UPDATE public.conversations
    SET
      last_message_at = now(),
      updated_at = now()
    WHERE id = v_conversation_id;
  END IF;

  RETURN jsonb_build_object(
    'conversation_id', v_conversation_id,
    'message_id', v_message_id,
    'created', v_created,
    'reused_existing', NOT v_created,
    'target_user_id', v_target_user_id,
    'context_type', v_context_type
  );
END;
$$;

DROP FUNCTION IF EXISTS public.create_new_conversation(uuid, text, uuid, text, text);
CREATE OR REPLACE FUNCTION public.create_new_conversation(
  p_other_user_id uuid,
  p_context_type text DEFAULT 'support',
  p_context_id uuid DEFAULT NULL,
  p_related_title text DEFAULT NULL,
  p_initial_message text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT public.get_or_create_direct_conversation(
    p_other_user_id,
    p_context_type,
    p_context_id,
    p_related_title,
    p_initial_message,
    'user',
    false
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_support_admin_user_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_direct_conversation(uuid, text, uuid, text, text, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_new_conversation(uuid, text, uuid, text, text) TO authenticated;
