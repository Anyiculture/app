-- Fix user_presence RLS policies
-- Enables RLS and adds policies for insert, update, and select

DO $$
BEGIN
    -- Enable RLS
    ALTER TABLE IF EXISTS user_presence ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies to ensure clean state (handling all previous variations)
    DROP POLICY IF EXISTS "Users can insert their own presence" ON user_presence;
    DROP POLICY IF EXISTS "Users can update their own presence" ON user_presence;
    DROP POLICY IF EXISTS "Authenticated users can view presence" ON user_presence;
    
    -- Drop policies reported as conflicts
    DROP POLICY IF EXISTS "Anyone can read user presence" ON user_presence;
    DROP POLICY IF EXISTS "Users can update own presence" ON user_presence;

    -- Policy: Users can insert their own presence
    CREATE POLICY "Users can insert their own presence" 
    ON user_presence 
    FOR INSERT 
    TO authenticated 
    WITH CHECK ((select auth.uid()) = user_id);

    -- Policy: Users can update their own presence
    CREATE POLICY "Users can update their own presence" 
    ON user_presence 
    FOR UPDATE
    TO authenticated 
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

    -- Policy: Authenticated users can view presence of others (needed for "Online/Offline" status)
    CREATE POLICY "Authenticated users can view presence" 
    ON user_presence 
    FOR SELECT 
    TO authenticated 
    USING (true);

END $$;
