-- =====================================================
-- ADMIN SUBSCRIPTION BYPASS + CONTACT GUARD ALIGNMENT
-- Date: 2026-03-12
-- =====================================================
-- Goals:
-- 1) Admin must bypass host-family subscription/payment gating.
-- 2) Admin must not submit host-family payment proofs.
-- 3) Server-side aupair conversation creation must allow admin.
-- =====================================================

CREATE OR REPLACE FUNCTION public.submit_host_family_payment_proof(
  p_image_url text,
  p_amount numeric DEFAULT 100,
  p_plan_type text DEFAULT 'host_family_premium'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_now timestamptz := now();
  v_state jsonb;
  v_status text;
  v_role text;
  v_submission payment_submissions%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF public.is_admin(v_user_id) THEN
    RAISE EXCEPTION 'Admin accounts bypass host family premium payment flow';
  END IF;

  IF COALESCE(trim(p_image_url), '') = '' THEN
    RAISE EXCEPTION 'Payment proof image is required';
  END IF;

  IF p_plan_type <> 'host_family_premium' THEN
    RAISE EXCEPTION 'Unsupported plan type for host family payment submission';
  END IF;

  v_state := public.normalize_host_family_subscription_status(v_user_id, false);
  v_status := COALESCE(v_state->>'subscription_status', 'free');
  v_role := COALESCE(v_state->>'role', 'general');

  IF v_role <> 'host_family' THEN
    RAISE EXCEPTION 'Only host families can submit this payment';
  END IF;

  IF v_status = 'pending_approval' THEN
    RAISE EXCEPTION 'Payment already submitted and awaiting admin approval';
  END IF;

  IF v_status = 'premium_active' THEN
    RAISE EXCEPTION 'You already have an active premium subscription';
  END IF;

  p_amount := 100;

  INSERT INTO payment_submissions (
    user_id,
    image_url,
    plan_type,
    amount,
    status,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    p_image_url,
    'host_family_premium',
    p_amount,
    'pending',
    v_now,
    v_now
  )
  RETURNING * INTO v_submission;

  UPDATE profiles
  SET
    host_family_subscription_status = 'pending_approval',
    host_family_subscription_plan = 'free',
    host_family_last_payment_request_id = v_submission.id,
    updated_at = v_now
  WHERE id = v_user_id;

  UPDATE host_family_profiles
  SET profile_status = 'pending_approval', updated_at = v_now
  WHERE user_id = v_user_id;

  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    link_url,
    metadata,
    is_read
  ) VALUES (
    v_user_id,
    'payment_update',
    'Payment submitted',
    'Payment submitted, awaiting admin approval. You remain on the Free Plan until approval.',
    '/au-pair/payment',
    jsonb_build_object('submission_id', v_submission.id, 'status', 'pending'),
    false
  );

  RETURN jsonb_build_object(
    'success', true,
    'submission_id', v_submission.id,
    'status', 'pending',
    'subscription_status', 'pending_approval'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_host_family_payment_submission_rules()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_state jsonb;
  v_status text;
  v_role text;
BEGIN
  IF NEW.plan_type <> 'host_family_premium' THEN
    RETURN NEW;
  END IF;

  IF public.is_admin(NEW.user_id) THEN
    RAISE EXCEPTION 'Admin accounts cannot submit host family premium payments';
  END IF;

  v_state := public.normalize_host_family_subscription_status(NEW.user_id, false);
  v_status := COALESCE(v_state->>'subscription_status', 'free');
  v_role := COALESCE(v_state->>'role', 'general');

  IF v_role <> 'host_family' THEN
    RAISE EXCEPTION 'Only host families can submit host family premium payments';
  END IF;

  IF v_status = 'pending_approval' THEN
    RAISE EXCEPTION 'Payment already submitted and awaiting admin approval';
  END IF;

  IF v_status = 'premium_active' THEN
    RAISE EXCEPTION 'Active premium subscription exists; early duplicate payment is blocked';
  END IF;

  NEW.amount := 100;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_new_conversation(
  p_other_user_id uuid,
  p_context_type text DEFAULT 'support',
  p_context_id uuid DEFAULT NULL,
  p_related_title text DEFAULT NULL,
  p_initial_message text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_current_user_id uuid;
  v_conversation_id uuid;
  v_message_id uuid;
  v_existing_conv_id uuid;
  v_subscription_state jsonb;
  v_subscription_status text;
  v_is_admin boolean := false;
BEGIN
  v_current_user_id := auth.uid();
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_is_admin := COALESCE(public.is_admin(v_current_user_id), false);

  IF p_context_type = 'aupair' AND NOT v_is_admin THEN
    v_subscription_state := public.normalize_host_family_subscription_status(v_current_user_id, false);
    IF COALESCE(v_subscription_state->>'role', 'general') = 'host_family' THEN
      v_subscription_status := COALESCE(v_subscription_state->>'subscription_status', 'free');
      IF v_subscription_status <> 'premium_active' THEN
        RAISE EXCEPTION 'Host family subscription status is %, premium_active required', v_subscription_status;
      END IF;
    END IF;
  END IF;

  SELECT cp1.conversation_id
  INTO v_existing_conv_id
  FROM conversation_participants cp1
  JOIN conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
  WHERE cp1.user_id = v_current_user_id
    AND cp2.user_id = p_other_user_id
  LIMIT 1;

  IF v_existing_conv_id IS NOT NULL THEN
    v_conversation_id := v_existing_conv_id;
  ELSE
    INSERT INTO conversations (context_type, context_id, related_item_title)
    VALUES (p_context_type, p_context_id, p_related_title)
    RETURNING id INTO v_conversation_id;

    INSERT INTO conversation_participants (conversation_id, user_id)
    VALUES
      (v_conversation_id, v_current_user_id),
      (v_conversation_id, p_other_user_id)
    ON CONFLICT DO NOTHING;
  END IF;

  IF p_initial_message IS NOT NULL AND p_initial_message <> '' THEN
    INSERT INTO messages (conversation_id, sender_id, content, message_type)
    VALUES (v_conversation_id, v_current_user_id, p_initial_message, 'user')
    RETURNING id INTO v_message_id;

    UPDATE conversations
    SET last_message_at = now(), updated_at = now()
    WHERE id = v_conversation_id;
  END IF;

  RETURN json_build_object(
    'conversation_id', v_conversation_id,
    'message_id', v_message_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_host_family_payment_proof(text, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_new_conversation(uuid, text, uuid, text, text) TO authenticated;
