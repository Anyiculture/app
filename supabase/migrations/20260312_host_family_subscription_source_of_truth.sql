-- =====================================================
-- HOST FAMILY SUBSCRIPTION SOURCE OF TRUTH
-- Date: 2026-03-11
-- =====================================================
-- Business rules:
-- 1) Only host families pay for premium contact access
-- 2) Premium fee is 100 CNY per month
-- 3) States: free, pending_approval, premium_active, premium_expired, rejected
-- 4) Expired subscriptions automatically revert to free access (no contact)
-- =====================================================

-- Ensure payment submissions support host family premium plan.
ALTER TABLE payment_submissions DROP CONSTRAINT IF EXISTS payment_submissions_plan_type_check;
ALTER TABLE payment_submissions
  ADD CONSTRAINT payment_submissions_plan_type_check
  CHECK (
    plan_type IN (
      'au_pair_premium_monthly',
      'au_pair_premium_yearly',
      'host_family_premium',
      'job_posting',
      'featured_listing'
    )
  );

-- Canonical host-family subscription metadata on profiles.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS host_family_subscription_plan text DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS host_family_last_payment_request_id uuid,
  ADD COLUMN IF NOT EXISTS host_family_expired_notified_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_host_family_last_payment_request_id_fkey'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT profiles_host_family_last_payment_request_id_fkey
      FOREIGN KEY (host_family_last_payment_request_id)
      REFERENCES payment_submissions(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- Normalize legacy values into canonical statuses.
UPDATE profiles
SET host_family_subscription_status = CASE
  WHEN host_family_subscription_status IS NULL THEN 'free'
  WHEN host_family_subscription_status = 'premium'
    AND host_family_subscription_end IS NOT NULL
    AND host_family_subscription_end > now() THEN 'premium_active'
  WHEN host_family_subscription_status = 'premium'
    AND host_family_subscription_end IS NOT NULL
    AND host_family_subscription_end <= now() THEN 'premium_expired'
  WHEN host_family_subscription_status = 'pending' THEN 'pending_approval'
  ELSE host_family_subscription_status
END
WHERE host_family_subscription_status IS NULL
   OR host_family_subscription_status IN ('premium', 'pending');

UPDATE profiles
SET host_family_subscription_plan = CASE
  WHEN host_family_subscription_status = 'premium_active' THEN 'premium'
  ELSE 'free'
END
WHERE host_family_subscription_plan IS NULL
   OR host_family_subscription_plan NOT IN ('free', 'premium');

CREATE INDEX IF NOT EXISTS idx_profiles_host_family_subscription_status
  ON profiles(host_family_subscription_status);

CREATE INDEX IF NOT EXISTS idx_payment_submissions_host_family_latest
  ON payment_submissions(user_id, created_at DESC)
  WHERE plan_type = 'host_family_premium' AND deleted_at IS NULL;

-- -----------------------------------------------------
-- Canonical state resolver + expiration sync
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.normalize_host_family_subscription_status(
  p_user_id uuid,
  p_emit_notifications boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_now timestamptz := now();
  v_profile record;
  v_latest_submission payment_submissions%ROWTYPE;
  v_latest_approved payment_submissions%ROWTYPE;
  v_is_host_family boolean := false;
  v_subscription_status text := 'free';
  v_subscription_plan text := 'free';
  v_payment_status text := 'not_submitted';
  v_approved_at timestamptz;
  v_expires_at timestamptz;
  v_last_payment_request_id uuid;
  v_renewal_required boolean := true;
  v_contact_access_enabled boolean := false;
  v_rejection_reason text;
BEGIN
  SELECT
    p.id,
    p.au_pair_role,
    COALESCE(p.host_family_subscription_status, 'free') AS host_family_subscription_status,
    COALESCE(
      p.host_family_subscription_plan,
      CASE WHEN COALESCE(p.host_family_subscription_status, 'free') = 'premium_active' THEN 'premium' ELSE 'free' END
    ) AS host_family_subscription_plan,
    p.host_family_subscription_start,
    p.host_family_subscription_end,
    p.host_family_last_payment_request_id,
    p.host_family_expired_notified_at
  INTO v_profile
  FROM profiles p
  WHERE p.id = p_user_id;

  IF v_profile.id IS NULL THEN
    RETURN jsonb_build_object(
      'user_id', p_user_id,
      'role', 'general',
      'subscription_plan', 'free',
      'subscription_status', 'free',
      'payment_status', 'not_submitted',
      'approved_at', NULL,
      'expires_at', NULL,
      'last_payment_request_id', NULL,
      'renewal_required', false,
      'contact_access_enabled', false,
      'rejection_reason', NULL
    );
  END IF;

  SELECT
    EXISTS (
      SELECT 1
      FROM user_services us
      WHERE us.user_id = p_user_id
        AND us.role = 'host_family'
    )
    OR EXISTS (
      SELECT 1
      FROM host_family_profiles hf
      WHERE hf.user_id = p_user_id
    )
    OR v_profile.au_pair_role = 'host_family'
  INTO v_is_host_family;

  SELECT *
  INTO v_latest_submission
  FROM payment_submissions
  WHERE user_id = p_user_id
    AND plan_type = 'host_family_premium'
    AND deleted_at IS NULL
  ORDER BY created_at DESC
  LIMIT 1;

  SELECT *
  INTO v_latest_approved
  FROM payment_submissions
  WHERE user_id = p_user_id
    AND plan_type = 'host_family_premium'
    AND status = 'approved'
    AND deleted_at IS NULL
  ORDER BY reviewed_at DESC NULLS LAST, created_at DESC
  LIMIT 1;

  IF v_latest_submission.id IS NOT NULL THEN
    v_payment_status := v_latest_submission.status;
    v_last_payment_request_id := v_latest_submission.id;
    v_rejection_reason := v_latest_submission.admin_notes;
  ELSE
    v_last_payment_request_id := v_profile.host_family_last_payment_request_id;
  END IF;

  IF NOT v_is_host_family THEN
    RETURN jsonb_build_object(
      'user_id', p_user_id,
      'role', 'general',
      'subscription_plan', 'free',
      'subscription_status', 'free',
      'payment_status', v_payment_status,
      'approved_at', NULL,
      'expires_at', NULL,
      'last_payment_request_id', v_last_payment_request_id,
      'renewal_required', false,
      'contact_access_enabled', false,
      'rejection_reason', v_rejection_reason
    );
  END IF;

  v_approved_at := COALESCE(
    v_profile.host_family_subscription_start,
    v_latest_approved.reviewed_at,
    v_latest_approved.updated_at
  );

  v_expires_at := COALESCE(
    v_profile.host_family_subscription_end,
    CASE WHEN v_approved_at IS NOT NULL THEN v_approved_at + interval '1 month' END
  );

  -- Automatic expiration downgrade.
  IF v_expires_at IS NOT NULL
     AND v_expires_at <= v_now
     AND COALESCE(v_profile.host_family_subscription_status, 'free') IN ('premium', 'premium_active') THEN
    UPDATE profiles
    SET
      host_family_subscription_status = 'premium_expired',
      host_family_subscription_plan = 'free',
      host_family_expired_notified_at = CASE
        WHEN p_emit_notifications THEN COALESCE(host_family_expired_notified_at, v_now)
        ELSE host_family_expired_notified_at
      END,
      updated_at = v_now
    WHERE id = p_user_id;

    v_profile.host_family_subscription_status := 'premium_expired';
    v_profile.host_family_subscription_plan := 'free';

    IF p_emit_notifications
       AND v_profile.host_family_expired_notified_at IS NULL THEN
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        link_url,
        metadata,
        is_read
      ) VALUES (
        p_user_id,
        'subscription_update',
        'Your subscription has expired',
        'Your subscription has expired. You have been reverted to the Free Plan. Renew to continue communicating with au pairs.',
        '/au-pair/payment',
        jsonb_build_object('status', 'premium_expired', 'expires_at', v_expires_at),
        false
      );
    END IF;
  END IF;

  IF v_expires_at IS NOT NULL
     AND v_expires_at > v_now
     AND COALESCE(v_profile.host_family_subscription_status, 'free') IN ('premium', 'premium_active') THEN
    v_subscription_status := 'premium_active';
    v_subscription_plan := 'premium';
    v_contact_access_enabled := true;
    v_renewal_required := false;
  ELSIF v_latest_submission.id IS NOT NULL AND v_latest_submission.status = 'pending' THEN
    v_subscription_status := 'pending_approval';
    v_subscription_plan := 'free';
  ELSIF v_latest_submission.id IS NOT NULL AND v_latest_submission.status = 'rejected' THEN
    v_subscription_status := 'rejected';
    v_subscription_plan := 'free';
  ELSIF v_expires_at IS NOT NULL
     AND v_expires_at <= v_now
     AND v_approved_at IS NOT NULL THEN
    v_subscription_status := 'premium_expired';
    v_subscription_plan := 'free';
  ELSE
    v_subscription_status := 'free';
    v_subscription_plan := 'free';
  END IF;

  -- Keep profile row aligned with canonical derived state.
  UPDATE profiles
  SET
    host_family_subscription_status = v_subscription_status,
    host_family_subscription_plan = v_subscription_plan,
    host_family_last_payment_request_id = COALESCE(v_last_payment_request_id, host_family_last_payment_request_id),
    updated_at = CASE
      WHEN host_family_subscription_status IS DISTINCT FROM v_subscription_status
        OR host_family_subscription_plan IS DISTINCT FROM v_subscription_plan
      THEN v_now
      ELSE updated_at
    END
  WHERE id = p_user_id;

  IF v_subscription_status = 'pending_approval' THEN
    UPDATE host_family_profiles
    SET profile_status = 'pending_approval', updated_at = v_now
    WHERE user_id = p_user_id
      AND profile_status IS DISTINCT FROM 'pending_approval';
  ELSIF v_subscription_status = 'premium_active' THEN
    UPDATE host_family_profiles
    SET profile_status = 'active', updated_at = v_now
    WHERE user_id = p_user_id
      AND profile_status IS DISTINCT FROM 'active';
  END IF;

  RETURN jsonb_build_object(
    'user_id', p_user_id,
    'role', 'host_family',
    'subscription_plan', v_subscription_plan,
    'subscription_status', v_subscription_status,
    'payment_status', v_payment_status,
    'approved_at', v_approved_at,
    'expires_at', v_expires_at,
    'last_payment_request_id', v_last_payment_request_id,
    'renewal_required', v_renewal_required,
    'contact_access_enabled', v_contact_access_enabled,
    'rejection_reason', v_rejection_reason
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_host_family_subscription_state(
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_requester uuid := auth.uid();
BEGIN
  IF p_user_id IS NULL THEN
    p_user_id := v_requester;
  END IF;

  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_requester IS DISTINCT FROM p_user_id
     AND NOT EXISTS (
       SELECT 1
       FROM admin_roles ar
       WHERE ar.user_id = v_requester
         AND ar.is_active = true
     ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN public.normalize_host_family_subscription_status(p_user_id, true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_host_family_subscription_state(uuid) TO authenticated;

-- -----------------------------------------------------
-- Host-family-only payment submission (100 CNY monthly)
-- -----------------------------------------------------
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

  -- Host family premium fee is fixed at 100 CNY/month.
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

GRANT EXECUTE ON FUNCTION public.submit_host_family_payment_proof(text, numeric, text) TO authenticated;

-- Guard direct inserts to keep business rules safe.
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

  -- Host family premium fee is fixed at 100 CNY/month.
  NEW.amount := 100;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_host_family_payment_submission_rules ON payment_submissions;
CREATE TRIGGER trg_enforce_host_family_payment_submission_rules
  BEFORE INSERT ON payment_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_host_family_payment_submission_rules();

-- -----------------------------------------------------
-- Admin approval/rejection sync (single source of truth)
-- -----------------------------------------------------
DROP FUNCTION IF EXISTS public.review_payment_submission(uuid, text, text);
CREATE OR REPLACE FUNCTION public.review_payment_submission(
  submission_id uuid,
  new_status text,
  notes text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id uuid := auth.uid();
  v_now timestamptz := now();
  v_submission payment_submissions%ROWTYPE;
  v_expires_at timestamptz;
  v_reason text;
BEGIN
  IF v_admin_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Not authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM admin_roles ar
    WHERE ar.user_id = v_admin_id
      AND ar.is_active = true
  ) THEN
    RETURN json_build_object('success', false, 'message', 'Not authorized');
  END IF;

  IF new_status NOT IN ('approved', 'rejected') THEN
    RETURN json_build_object('success', false, 'message', 'Invalid status');
  END IF;

  SELECT *
  INTO v_submission
  FROM payment_submissions
  WHERE id = submission_id
  FOR UPDATE;

  IF v_submission.id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Submission not found');
  END IF;

  IF v_submission.deleted_at IS NOT NULL THEN
    RETURN json_build_object('success', false, 'message', 'Submission is archived');
  END IF;

  IF v_submission.status <> 'pending' THEN
    RETURN json_build_object('success', false, 'message', 'Submission already reviewed');
  END IF;

  IF new_status = 'approved' AND v_submission.plan_type = 'host_family_premium' THEN
    v_expires_at := v_now + interval '1 month';

    UPDATE profiles
    SET
      host_family_subscription_plan = 'premium',
      host_family_subscription_status = 'premium_active',
      host_family_subscription_start = v_now,
      host_family_subscription_end = v_expires_at,
      host_family_last_payment_request_id = v_submission.id,
      host_family_expired_notified_at = NULL,
      updated_at = v_now
    WHERE id = v_submission.user_id;

    UPDATE host_family_profiles
    SET profile_status = 'active', updated_at = v_now
    WHERE user_id = v_submission.user_id;

    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      link_url,
      metadata,
      is_read
    ) VALUES (
      v_submission.user_id,
      'payment_update',
      'Payment approved',
      'Payment approved. Premium active until ' || to_char(v_expires_at::date, 'YYYY-MM-DD') || '. You can now contact au pairs.',
      '/account?section=billing',
      jsonb_build_object('submission_id', v_submission.id, 'status', 'approved', 'expires_at', v_expires_at),
      false
    );

  ELSIF new_status = 'rejected' AND v_submission.plan_type = 'host_family_premium' THEN
    v_reason := COALESCE(NULLIF(trim(notes), ''), 'Payment proof was rejected. Please submit a clearer proof.');

    UPDATE profiles
    SET
      host_family_subscription_plan = 'free',
      host_family_subscription_status = 'rejected',
      host_family_last_payment_request_id = v_submission.id,
      updated_at = v_now
    WHERE id = v_submission.user_id;

    UPDATE host_family_profiles
    SET profile_status = 'pending_payment', updated_at = v_now
    WHERE user_id = v_submission.user_id;

    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      link_url,
      metadata,
      is_read
    ) VALUES (
      v_submission.user_id,
      'payment_update',
      'Payment rejected',
      'Payment rejected. ' || v_reason,
      '/au-pair/payment',
      jsonb_build_object('submission_id', v_submission.id, 'status', 'rejected', 'reason', v_reason),
      false
    );
  END IF;

  UPDATE payment_submissions
  SET
    status = new_status,
    admin_notes = COALESCE(notes, admin_notes),
    reviewed_by = v_admin_id,
    reviewed_at = v_now,
    updated_at = v_now
  WHERE id = submission_id;

  -- Force canonical re-evaluation after each review.
  PERFORM public.normalize_host_family_subscription_status(v_submission.user_id, false);

  RETURN json_build_object(
    'success', true,
    'message', CASE
      WHEN new_status = 'approved' THEN 'Payment approved'
      ELSE 'Payment rejected'
    END,
    'status', new_status,
    'expires_at', v_expires_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.review_payment_submission(uuid, text, text) TO authenticated;

-- Disable legacy approval trigger to prevent duplicate/outdated notifications.
DROP TRIGGER IF EXISTS on_payment_approved ON payment_submissions;
DROP FUNCTION IF EXISTS public.notify_user_payment_approved();

-- -----------------------------------------------------
-- Server-side contact gating in conversation creation
-- -----------------------------------------------------
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
BEGIN
  v_current_user_id := auth.uid();
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_context_type = 'aupair' THEN
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

GRANT EXECUTE ON FUNCTION public.create_new_conversation(uuid, text, uuid, text, text) TO authenticated;
