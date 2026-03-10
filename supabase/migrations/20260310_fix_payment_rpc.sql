-- Fix and consolidate review_payment_submission RPC
-- 1. Adds support for 'host_family_premium' plan type
-- 2. Updates profiles.au_pair_subscription_status to 'premium'
-- 3. Updates host_family_profiles.profile_status to 'active' for host family payments
-- 4. Corrects column name from 'review_notes' to 'admin_notes'
-- 5. Updates or inserts into 'au_pair_subscriptions'

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
    v_admin_id uuid;
    result json;
BEGIN
    -- Check if user is admin
    v_admin_id := auth.uid();
    IF NOT EXISTS (
        SELECT 1 FROM admin_roles 
        WHERE user_id = v_admin_id 
        AND is_active = true
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    -- Validate status
    IF new_status_param NOT IN ('pending', 'approved', 'rejected') THEN
        RAISE EXCEPTION 'Invalid status: must be pending, approved, or rejected';
    END IF;

    -- Get and update the submission
    -- We use COALESCE for notes to preserve existing notes if none provided
    UPDATE payment_submissions
    SET 
        status = new_status_param,
        admin_notes = COALESCE(review_notes_param, admin_notes),
        reviewed_at = NOW(),
        reviewed_by = v_admin_id,
        updated_at = NOW()
    WHERE id = submission_id_param
    RETURNING * INTO submission_record;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment submission not found';
    END IF;

    -- If approved, activate benefits
    IF new_status_param = 'approved' THEN
        -- 1. Update the profiles table for general subscription status
        UPDATE profiles
        SET 
            au_pair_subscription_status = 'premium',
            updated_at = NOW()
        WHERE id = submission_record.user_id;

        -- 2. Update specific profile table status if host family
        IF submission_record.plan_type = 'host_family_premium' THEN
            UPDATE host_family_profiles
            SET 
                profile_status = 'active',
                updated_at = NOW()
            WHERE id = submission_record.user_id;
        END IF;

        -- 3. Ensure au_pair_subscriptions record exists and is active
        INSERT INTO au_pair_subscriptions (user_id, plan_type, status, start_date, end_date)
        VALUES (
            submission_record.user_id,
            submission_record.plan_type,
            'active',
            NOW(),
            CASE 
                WHEN submission_record.plan_type LIKE '%year%' OR submission_record.plan_type = 'annual' THEN NOW() + INTERVAL '1 year'
                ELSE NOW() + INTERVAL '1 month'
            END
        )
        ON CONFLICT (user_id) DO UPDATE
        SET 
            status = 'active',
            plan_type = submission_record.plan_type,
            start_date = NOW(),
            end_date = CASE 
                WHEN submission_record.plan_type LIKE '%year%' OR submission_record.plan_type = 'annual' THEN NOW() + INTERVAL '1 year'
                ELSE NOW() + INTERVAL '1 month'
            END;
    END IF;

    -- Return the result
    SELECT json_build_object(
        'success', true,
        'id', submission_record.id,
        'status', submission_record.status,
        'reviewed_at', submission_record.reviewed_at
    ) INTO result;

    RETURN result;
END;
$$;
