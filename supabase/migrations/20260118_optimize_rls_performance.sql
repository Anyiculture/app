-- Optimization Migration: Improve RLS Performance
-- Replaces direct auth.uid() calls with (select auth.uid()) to prevent re-evaluation for every row.
-- This significantly improves query performance at scale.

DO $$
BEGIN

  -- 1. profiles
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile') THEN
    DROP POLICY "Users can update own profile" ON profiles;
    CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING ((select auth.uid()) = id) WITH CHECK ((select auth.uid()) = id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert own profile') THEN
    DROP POLICY "Users can insert own profile" ON profiles;
    CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = id);
  END IF;

  -- 2. education_resources
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'education_resources' AND policyname = 'Users can create education resources') THEN
    DROP POLICY "Users can create education resources" ON education_resources;
    CREATE POLICY "Users can create education resources" ON education_resources FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = creator_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'education_resources' AND policyname = 'Creators can update own resources') THEN
    DROP POLICY "Creators can update own resources" ON education_resources;
    CREATE POLICY "Creators can update own resources" ON education_resources FOR UPDATE TO authenticated USING ((select auth.uid()) = creator_id) WITH CHECK ((select auth.uid()) = creator_id);
  END IF;

  -- 3. education_interests
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'education_interests' AND policyname = 'Users can view own interests') THEN
    DROP POLICY "Users can view own interests" ON education_interests;
    CREATE POLICY "Users can view own interests" ON education_interests FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'education_interests' AND policyname = 'Users can submit interests') THEN
    DROP POLICY "Users can submit interests" ON education_interests;
    CREATE POLICY "Users can submit interests" ON education_interests FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  -- 4. community_posts
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_posts' AND policyname = 'Users can create posts') THEN
    DROP POLICY "Users can create posts" ON community_posts;
    CREATE POLICY "Users can create posts" ON community_posts FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = author_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_posts' AND policyname = 'Authors can update own posts') THEN
    DROP POLICY "Authors can update own posts" ON community_posts;
    CREATE POLICY "Authors can update own posts" ON community_posts FOR UPDATE TO authenticated USING ((select auth.uid()) = author_id) WITH CHECK ((select auth.uid()) = author_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_posts' AND policyname = 'Authors can delete own posts') THEN
    DROP POLICY "Authors can delete own posts" ON community_posts;
    CREATE POLICY "Authors can delete own posts" ON community_posts FOR DELETE TO authenticated USING ((select auth.uid()) = author_id);
  END IF;

  -- 5. community_comments
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_comments' AND policyname = 'Users can create comments') THEN
    DROP POLICY "Users can create comments" ON community_comments;
    CREATE POLICY "Users can create comments" ON community_comments FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = author_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_comments' AND policyname = 'Authors can delete own comments') THEN
    DROP POLICY "Authors can delete own comments" ON community_comments;
    CREATE POLICY "Authors can delete own comments" ON community_comments FOR DELETE TO authenticated USING ((select auth.uid()) = author_id);
  END IF;

  -- 6. community_likes
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_likes' AND policyname = 'Users can like posts') THEN
    DROP POLICY "Users can like posts" ON community_likes;
    CREATE POLICY "Users can like posts" ON community_likes FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_likes' AND policyname = 'Users can unlike posts') THEN
    DROP POLICY "Users can unlike posts" ON community_likes;
    CREATE POLICY "Users can unlike posts" ON community_likes FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
  END IF;

  -- 7. notifications
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can view own notifications') THEN
    DROP POLICY "Users can view own notifications" ON notifications;
    CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can update own notifications') THEN
    DROP POLICY "Users can update own notifications" ON notifications;
    CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  -- 8. users (public.users)
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can read own data') THEN
    DROP POLICY "Users can read own data" ON users;
    CREATE POLICY "Users can read own data" ON users FOR SELECT TO authenticated USING ((select auth.uid()) = id);
  END IF;
  
  -- 9. user_settings
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_settings') THEN
      IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_settings' AND policyname = 'Users can manage own settings') THEN
        DROP POLICY "Users can manage own settings" ON user_settings;
        CREATE POLICY "Users can manage own settings" ON user_settings FOR ALL TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
      END IF;
  END IF;

  -- 10. user_services
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_services') THEN
      IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_services' AND policyname = 'Users can view own services') THEN
        DROP POLICY "Users can view own services" ON user_services;
        CREATE POLICY "Users can view own services" ON user_services FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
      END IF;
      IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_services' AND policyname = 'Users can manage own services') THEN
        DROP POLICY "Users can manage own services" ON user_services;
        CREATE POLICY "Users can manage own services" ON user_services FOR ALL TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
      END IF;
  END IF;

  -- 11. conversation_reports
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'conversation_reports') THEN
      IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conversation_reports' AND policyname = 'Users can create reports') THEN
        DROP POLICY "Users can create reports" ON conversation_reports;
        CREATE POLICY "Users can create reports" ON conversation_reports FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = reporter_id);
      END IF;
  END IF;

  -- 12. onboarding_sessions
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'onboarding_sessions') THEN
      IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'onboarding_sessions' AND policyname = 'Users can view own onboarding') THEN
        DROP POLICY "Users can view own onboarding" ON onboarding_sessions;
        CREATE POLICY "Users can view own onboarding" ON onboarding_sessions FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
      END IF;
      IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'onboarding_sessions' AND policyname = 'Users can manage own onboarding') THEN
        DROP POLICY "Users can manage own onboarding" ON onboarding_sessions;
        CREATE POLICY "Users can manage own onboarding" ON onboarding_sessions FOR ALL TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
      END IF;
  END IF;

  -- 13. onboarding_answers
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'onboarding_answers') THEN
      IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'onboarding_answers' AND policyname = 'Users can manage own answers') THEN
        DROP POLICY "Users can manage own answers" ON onboarding_answers;
        CREATE POLICY "Users can manage own answers" ON onboarding_answers FOR ALL TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
      END IF;
  END IF;

  -- 14. profiles_family
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'profiles_family') THEN
      IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles_family' AND policyname = 'Families can manage own profile') THEN
        DROP POLICY "Families can manage own profile" ON profiles_family;
        CREATE POLICY "Families can manage own profile" ON profiles_family FOR ALL TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
      END IF;
  END IF;

  -- 15. profiles_jobseeker
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'profiles_jobseeker') THEN
      IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles_jobseeker' AND policyname = 'Job seekers can manage own profile') THEN
        DROP POLICY "Job seekers can manage own profile" ON profiles_jobseeker;
        -- Assuming profile_id was added in previous migrations. If not, this might fail, but we saw the migration for it.
        CREATE POLICY "Job seekers can manage own profile" ON profiles_jobseeker FOR ALL TO authenticated USING ((select auth.uid()) = profile_id) WITH CHECK ((select auth.uid()) = profile_id);
      END IF;
  END IF;

  -- 16. profiles_employer
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'profiles_employer') THEN
      IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles_employer' AND policyname = 'Employers can manage own profile') THEN
        DROP POLICY "Employers can manage own profile" ON profiles_employer;
        CREATE POLICY "Employers can manage own profile" ON profiles_employer FOR ALL TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
      END IF;
  END IF;

  -- 17. subscriptions
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'subscriptions') THEN
      IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscriptions' AND policyname = 'Users can view own subscriptions') THEN
        DROP POLICY "Users can view own subscriptions" ON subscriptions;
        CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
      END IF;
  END IF;

  -- 18. invoices
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'invoices') THEN
      IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invoices' AND policyname = 'Users can view own invoices') THEN
        DROP POLICY "Users can view own invoices" ON invoices;
        CREATE POLICY "Users can view own invoices" ON invoices FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
      END IF;
  END IF;

  -- 19. jobs
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'jobs' AND policyname = 'Job posters can manage own jobs') THEN
    DROP POLICY "Job posters can manage own jobs" ON jobs;
    CREATE POLICY "Job posters can manage own jobs" ON jobs FOR ALL TO authenticated USING ((select auth.uid()) = poster_id) WITH CHECK ((select auth.uid()) = poster_id);
  END IF;

  -- 20. job_applications
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'job_applications' AND policyname = 'Users can view own applications') THEN
    DROP POLICY "Users can view own applications" ON job_applications;
    CREATE POLICY "Users can view own applications" ON job_applications FOR SELECT TO authenticated USING ((select auth.uid()) = applicant_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'job_applications' AND policyname = 'Applicants can create applications') THEN
    DROP POLICY "Applicants can create applications" ON job_applications;
    CREATE POLICY "Applicants can create applications" ON job_applications FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = applicant_id);
  END IF;

  -- 21. conversation_participants
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conversation_participants' AND policyname = 'Users can view own participations') THEN
    DROP POLICY "Users can view own participations" ON conversation_participants;
    CREATE POLICY "Users can view own participations" ON conversation_participants FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
  END IF;

  -- 22. messages
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Users can insert own messages') THEN
    DROP POLICY "Users can insert own messages" ON messages;
    CREATE POLICY "Users can insert own messages" ON messages FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = sender_id);
  END IF;

  -- 23. saved_items
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'saved_items') THEN
      IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saved_items' AND policyname = 'Users can manage own saved items') THEN
        DROP POLICY "Users can manage own saved items" ON saved_items;
        CREATE POLICY "Users can manage own saved items" ON saved_items FOR ALL TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
      END IF;
  END IF;

  -- 24. events
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Organizers can manage own events') THEN
    DROP POLICY "Organizers can manage own events" ON events;
    CREATE POLICY "Organizers can manage own events" ON events FOR ALL TO authenticated USING ((select auth.uid()) = organizer_id) WITH CHECK ((select auth.uid()) = organizer_id);
  END IF;

  -- 25. event_registrations
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'event_registrations' AND policyname = 'Users can manage own registrations') THEN
    DROP POLICY "Users can manage own registrations" ON event_registrations;
    CREATE POLICY "Users can manage own registrations" ON event_registrations FOR ALL TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  -- 26. marketplace_listings / marketplace_items
  -- Note: user said 'marketplace_listings', but previous schema showed 'marketplace_items'. I will check for both or assume items.
  -- Based on prev logs, it is 'marketplace_items'. But user prompt says 'marketplace_listings'.
  -- I will try for 'marketplace_listings' if it exists, otherwise check 'marketplace_items'
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'marketplace_listings') THEN
      IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'marketplace_listings' AND policyname = 'Sellers can manage own listings') THEN
        DROP POLICY "Sellers can manage own listings" ON marketplace_listings;
        CREATE POLICY "Sellers can manage own listings" ON marketplace_listings FOR ALL TO authenticated USING ((select auth.uid()) = seller_id) WITH CHECK ((select auth.uid()) = seller_id);
      END IF;
  END IF;
  
  -- 27. airport_pickups
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'airport_pickups') THEN
      IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'airport_pickups' AND policyname = 'Users can manage own pickups') THEN
        DROP POLICY "Users can manage own pickups" ON airport_pickups;
        CREATE POLICY "Users can manage own pickups" ON airport_pickups FOR ALL TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
      END IF;
  END IF;

  -- 28. stripe_customers
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'stripe_customers') THEN
      IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stripe_customers' AND policyname = 'Users can view their own customer data') THEN
        DROP POLICY "Users can view their own customer data" ON stripe_customers;
        CREATE POLICY "Users can view their own customer data" ON stripe_customers FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
      END IF;
  END IF;

  -- 29. au_pair_profiles
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'au_pair_profiles' AND policyname = 'Au pairs can insert own profile') THEN
    DROP POLICY "Au pairs can insert own profile" ON au_pair_profiles;
    CREATE POLICY "Au pairs can insert own profile" ON au_pair_profiles FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'au_pair_profiles' AND policyname = 'Au pairs can view own profile') THEN
    DROP POLICY "Au pairs can view own profile" ON au_pair_profiles;
    CREATE POLICY "Au pairs can view own profile" ON au_pair_profiles FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'au_pair_profiles' AND policyname = 'Au pairs can update own profile') THEN
    DROP POLICY "Au pairs can update own profile" ON au_pair_profiles;
    CREATE POLICY "Au pairs can update own profile" ON au_pair_profiles FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  -- 30. saved_jobs
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saved_jobs' AND policyname = 'Users can view their own saved jobs') THEN
    DROP POLICY "Users can view their own saved jobs" ON saved_jobs;
    CREATE POLICY "Users can view their own saved jobs" ON saved_jobs FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saved_jobs' AND policyname = 'Users can insert saved jobs') THEN
    DROP POLICY "Users can insert saved jobs" ON saved_jobs;
    CREATE POLICY "Users can insert saved jobs" ON saved_jobs FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saved_jobs' AND policyname = 'Users can delete their saved jobs') THEN
    DROP POLICY "Users can delete their saved jobs" ON saved_jobs;
    CREATE POLICY "Users can delete their saved jobs" ON saved_jobs FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
  END IF;

  -- 31. job_preferences (or user_job_preferences)
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'job_preferences') THEN
      IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'job_preferences' AND policyname = 'Users can view their own preferences') THEN
        DROP POLICY "Users can view their own preferences" ON job_preferences;
        CREATE POLICY "Users can view their own preferences" ON job_preferences FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
      END IF;
      
      IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'job_preferences' AND policyname = 'Users can insert their preferences') THEN
        DROP POLICY "Users can insert their preferences" ON job_preferences;
        CREATE POLICY "Users can insert their preferences" ON job_preferences FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
      END IF;

      IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'job_preferences' AND policyname = 'Users can update their preferences') THEN
        DROP POLICY "Users can update their preferences" ON job_preferences;
        CREATE POLICY "Users can update their preferences" ON job_preferences FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
      END IF;
  END IF;

  -- 32. conversation_blocks
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'conversation_blocks') THEN
      IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conversation_blocks' AND policyname = 'Users can view their own blocks') THEN
        DROP POLICY "Users can view their own blocks" ON conversation_blocks;
        CREATE POLICY "Users can view their own blocks" ON conversation_blocks FOR SELECT TO authenticated USING ((select auth.uid()) = blocker_id);
      END IF;
      
      IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conversation_blocks' AND policyname = 'Users can create blocks') THEN
        DROP POLICY "Users can create blocks" ON conversation_blocks;
        CREATE POLICY "Users can create blocks" ON conversation_blocks FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = blocker_id);
      END IF;

      IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conversation_blocks' AND policyname = 'Users can delete their blocks') THEN
        DROP POLICY "Users can delete their blocks" ON conversation_blocks;
        CREATE POLICY "Users can delete their blocks" ON conversation_blocks FOR DELETE TO authenticated USING ((select auth.uid()) = blocker_id);
      END IF;
  END IF;

END $$;
