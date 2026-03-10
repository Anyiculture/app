-- 1. Fix the check constraint on payment_submissions
-- First, drop the old constraint
ALTER TABLE payment_submissions DROP CONSTRAINT IF EXISTS payment_submissions_plan_type_check;

-- Add the new constraint with host_family_premium included
ALTER TABLE payment_submissions ADD CONSTRAINT payment_submissions_plan_type_check 
CHECK (plan_type IN ('au_pair_premium_monthly', 'au_pair_premium_yearly', 'host_family_premium', 'job_posting', 'featured_listing'));


-- 2. Create a function to notify admins of new payment submissions
CREATE OR REPLACE FUNCTION notify_admins_of_payment()
RETURNS TRIGGER AS $$
DECLARE
    admin_record RECORD;
BEGIN
    -- Loop through all active admins
    FOR admin_record IN 
        SELECT user_id 
        FROM admin_roles 
        WHERE is_active = true AND role = 'admin'
    LOOP
        -- Insert a notification for each admin
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            link_url,
            metadata
        ) VALUES (
            admin_record.user_id,
            'system',
            'notifications.newPayment.title',
            'notifications.newPayment.message',
            '/admin?tab=payments',
            jsonb_build_object(
                'submission_id', NEW.id,
                'user_id', NEW.user_id,
                'plan_type', NEW.plan_type
            )
        );
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Create a trigger on payment_submissions
DROP TRIGGER IF EXISTS on_payment_submission_insert ON payment_submissions;
CREATE TRIGGER on_payment_submission_insert
    AFTER INSERT ON payment_submissions
    FOR EACH ROW
    EXECUTE FUNCTION notify_admins_of_payment();


-- 4. Update the review_payment_submission function to also notify the user
-- (Note: This is already partially handled in adminService.ts frontend logic, 
-- but putting it in DB is more robust. However, keeping it in adminService 
-- for now to avoid redundant notifications unless requested).
