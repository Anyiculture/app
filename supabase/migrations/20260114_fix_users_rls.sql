/*
  # Fix Users Table RLS
  
  The frontend attempts to sync the user to `public.users` on login, causing 403 Errors if RLS forbids it.
  This script adds policies to allow users to maintain their own record in `public.users`.
*/

-- Enable RLS (just in case)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own record
DROP POLICY IF EXISTS "Users can view own user record" ON public.users;
CREATE POLICY "Users can view own user record"
ON public.users FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow users to insert their own record (for sync)
DROP POLICY IF EXISTS "Users can insert own user record" ON public.users;
CREATE POLICY "Users can insert own user record"
ON public.users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Allow users to update their own record (for sync)
DROP POLICY IF EXISTS "Users can update own user record" ON public.users;
CREATE POLICY "Users can update own user record"
ON public.users FOR UPDATE
TO authenticated
USING (auth.uid() = id);
