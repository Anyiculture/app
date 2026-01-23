-- Add is_banned column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;

-- Grant access to authenticated users to see this status (essential for login checks)
-- Existing policies on 'profiles' might already cover SELECT *
-- But let's ensure it's safe.
