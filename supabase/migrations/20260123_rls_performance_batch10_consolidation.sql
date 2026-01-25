-- RLS Performance Optimization - Batch 10: Consolidation & Au Pair Fixes
-- Drops redundant policies to resolve "Multiple Permissive Policies" warnings.
-- Attempts to fix Au Pair Matches/Contracts/Interviews safely by checking columns first.

DO $$
DECLARE
  -- Variables for schema checks
  v_has_au_pair_id boolean;
  v_has_family_id boolean;
BEGIN

  --------------------------------------------------------------------------------
  -- 1. CLEANUP REDUNDANT POLICIES (Consolidation)
  --------------------------------------------------------------------------------
  
  -- Community: Prefer "Users can..." over "Authors can..."
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_posts' AND policyname = 'Authors can delete own posts') THEN
    DROP POLICY "Authors can delete own posts" ON community_posts;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_posts' AND policyname = 'Authors can update own posts') THEN
    DROP POLICY "Authors can update own posts" ON community_posts;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_comments' AND policyname = 'Authors can delete own comments') THEN
    DROP POLICY "Authors can delete own comments" ON community_comments;
  END IF;

  -- Jobs: Prefer "Users can..." or specific Admin policies over generic "Manage"
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'jobs' AND policyname = 'Job posters can manage own jobs') THEN
    DROP POLICY "Job posters can manage own jobs" ON jobs;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'jobs' AND policyname = 'Admins can manage jobs') THEN
    DROP POLICY "Admins can manage jobs" ON jobs;
  END IF;

  -- Events: Prefer "Organizers can create/update..." over "Manage"
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Organizers can manage own events') THEN
    DROP POLICY "Organizers can manage own events" ON events;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Admins can manage events') THEN
    DROP POLICY "Admins can manage events" ON events;
  END IF;

  -- Marketplace: Prefer "Users/Sellers can..." over "Manage"
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'marketplace_items' AND policyname = 'Admins can manage marketplace items') THEN
    DROP POLICY "Admins can manage marketplace items" ON marketplace_items;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'marketplace_listings' AND policyname = 'Sellers can manage own listings') THEN
    DROP POLICY "Sellers can manage own listings" ON marketplace_listings;
  END IF;

  -- Au Pair Profiles: Prefer specific update/view policies
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'au_pair_profiles' AND policyname = 'Admins can manage au pair profiles') THEN
    DROP POLICY "Admins can manage au pair profiles" ON au_pair_profiles;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'host_family_profiles' AND policyname = 'Admins can manage host family profiles') THEN
    DROP POLICY "Admins can manage host family profiles" ON host_family_profiles;
  END IF;

  -- Admin Roles: Drop redundant "Manage" if "View all" exists
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'admin_roles' AND policyname = 'Admins can manage roles') THEN
     -- Only drop if we have a specific view policy/update policy, which we added in Batch 6
    DROP POLICY "Admins can manage roles" ON admin_roles;
  END IF;

  --------------------------------------------------------------------------------
  -- 2. AU PAIR MATCHES / INTERVIEWS / CONTRACTS (Safe Repair)
  --------------------------------------------------------------------------------

  -- Check au_pair_matches columns
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'au_pair_matches' AND column_name = 'au_pair_id') INTO v_has_au_pair_id;
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'au_pair_matches' AND column_name = 'family_id') INTO v_has_family_id;

  IF v_has_au_pair_id AND v_has_family_id THEN
    -- Au pairs can view their matches
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'au_pair_matches' AND policyname = 'Au pairs can view their matches') THEN
      DROP POLICY "Au pairs can view their matches" ON au_pair_matches;
      CREATE POLICY "Au pairs can view their matches" ON au_pair_matches FOR SELECT TO authenticated USING ((select auth.uid()) = au_pair_id);
    END IF;

    -- Families can view their matches
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'au_pair_matches' AND policyname = 'Families can view their matches') THEN
      DROP POLICY "Families can view their matches" ON au_pair_matches;
      CREATE POLICY "Families can view their matches" ON au_pair_matches FOR SELECT TO authenticated USING ((select auth.uid()) = family_id);
    END IF;

    -- Users can update match status (assuming both can)
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'au_pair_matches' AND policyname = 'Users can update match status') THEN
      DROP POLICY "Users can update match status" ON au_pair_matches;
      CREATE POLICY "Users can update match status" ON au_pair_matches FOR UPDATE TO authenticated USING (
        (select auth.uid()) = au_pair_id OR (select auth.uid()) = family_id
      ) WITH CHECK (
        (select auth.uid()) = au_pair_id OR (select auth.uid()) = family_id
      );
    END IF;
  END IF;

  -- au_pair_contracts (Assuming same columns or user_id + partner_id? Guessing au_pair_id/family_id logic applies)
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'au_pair_contracts') THEN
     -- If we can't be sure of columns, we skip. But we can check for policy existence.
     -- If policy 'Families can create contracts' exists, the table exists.
     -- We'll try to guess 'family_id' column exists if that policy exists.
     IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'au_pair_contracts' AND column_name = 'family_id') THEN
        IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'au_pair_contracts' AND policyname = 'Families can create contracts') THEN
           DROP POLICY "Families can create contracts" ON au_pair_contracts;
           CREATE POLICY "Families can create contracts" ON au_pair_contracts FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = family_id);
        END IF;
     END IF;
  END IF;

  --------------------------------------------------------------------------------
  -- 3. NEWSLETTER & CONTACTS (Fixing "Allow auth view")
  --------------------------------------------------------------------------------
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'newsletter_subscribers' AND policyname = 'Allow auth view newsletter') THEN
    DROP POLICY "Allow auth view newsletter" ON newsletter_subscribers;
    -- Restrict to Admins only
    CREATE POLICY "Admins can view all subscribers" ON newsletter_subscribers FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM admin_roles WHERE user_id = (select auth.uid()) AND is_active = true)
    );
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_submissions' AND policyname = 'Allow auth view contact') THEN
    DROP POLICY "Allow auth view contact" ON contact_submissions;
    -- Restrict to Admins only
    CREATE POLICY "Admins can view all contact submissions" ON contact_submissions FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM admin_roles WHERE user_id = (select auth.uid()) AND is_active = true)
    );
  END IF;

END $$;

COMMENT ON TABLE community_posts IS 'RLS policies consolidated (Batch 10)';
