import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

async function fixRpc() {
  if (!DATABASE_URL) {
    console.error('DATABASE_URL not found in .env');
    process.exit(1);
  }

  const client = new pg.Pool({ connectionString: DATABASE_URL });

  try {
    const sql = `
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

    -- If approved, activate the subscription AND the profile
    IF new_status_param = 'approved' THEN
        -- 1. Update Subscription
        INSERT INTO au_pair_subscriptions (user_id, plan_type, status, start_date, end_date)
        VALUES (
            submission_record.user_id,
            submission_record.plan_type,
            'active',
            NOW(),
            CASE 
                WHEN submission_record.plan_type LIKE '%annual%' THEN NOW() + INTERVAL '1 year'
                ELSE NOW() + INTERVAL '1 month'
            END
        )
        ON CONFLICT (user_id) DO UPDATE
        SET 
            status = 'active',
            plan_type = EXCLUDED.plan_type,
            start_date = NOW(),
            end_date = EXCLUDED.end_date;

        -- 2. Update Au Pair Profile if exists
        UPDATE au_pair_profiles
        SET profile_status = 'active'
        WHERE id = submission_record.user_id;

        -- 3. Update Host Family Profile if exists
        UPDATE host_family_profiles
        SET profile_status = 'active'
        WHERE id = submission_record.user_id;
    END IF;

    -- Return the result
    SELECT json_build_object(
        'id', submission_record.id,
        'status', submission_record.status,
        'reviewed_at', submission_record.reviewed_at
    ) INTO result;

    return result;
END;
$$;
    `;

    await client.query(sql);
    console.log('Successfully updated review_payment_submission RPC');
  } catch (error) {
    console.error('Failed to update RPC:', error);
  } finally {
    await client.end();
  }
}

fixRpc();
