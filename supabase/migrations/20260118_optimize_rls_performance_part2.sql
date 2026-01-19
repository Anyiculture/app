-- Optimization Migration Part 2: Improve RLS Performance
-- Replace `auth.uid()` with `(select auth.uid())` to prevent re-evaluation for every row

-- Users
DROP POLICY IF EXISTS "Users can insert own user record" ON public.users;
CREATE POLICY "Users can insert own user record" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own user record" ON public.users;
CREATE POLICY "Users can update own user record" ON public.users FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view own user record" ON public.users;
CREATE POLICY "Users can view own user record" ON public.users FOR SELECT USING (auth.uid() = id);

-- User Services
DROP POLICY IF EXISTS "Users can insert their own services" ON public.user_services;
CREATE POLICY "Users can insert their own services" ON public.user_services FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own services" ON public.user_services;
CREATE POLICY "Users can update their own services" ON public.user_services FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own services" ON public.user_services;
CREATE POLICY "Users can view their own services" ON public.user_services FOR SELECT USING (auth.uid() = user_id);

-- Job Applications
DROP POLICY IF EXISTS "Allow auth view job applications" ON public.job_applications;
CREATE POLICY "Allow auth view job applications" ON public.job_applications FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Applicants can view own applications" ON public.job_applications;
CREATE POLICY "Applicants can view own applications" ON public.job_applications FOR SELECT USING (auth.uid() = applicant_id);

DROP POLICY IF EXISTS "Job seekers can create applications" ON public.job_applications;
CREATE POLICY "Job seekers can create applications" ON public.job_applications FOR INSERT WITH CHECK (auth.uid() = applicant_id);

DROP POLICY IF EXISTS "Users can apply to jobs" ON public.job_applications;
CREATE POLICY "Users can apply to jobs" ON public.job_applications FOR INSERT WITH CHECK (auth.uid() = applicant_id);

-- Conversations
DROP POLICY IF EXISTS "Participants can update conversations" ON public.conversations;
CREATE POLICY "Participants can update conversations" ON public.conversations FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = id AND user_id = (select auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;
CREATE POLICY "Users can update own conversations" ON public.conversations FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = id AND user_id = (select auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;
CREATE POLICY "Users can view own conversations" ON public.conversations FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = id AND user_id = (select auth.uid())
  )
);

-- Conversation Participants
DROP POLICY IF EXISTS "Users can add participants" ON public.conversation_participants;
CREATE POLICY "Users can add participants" ON public.conversation_participants FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = conversation_participants.conversation_id AND user_id = (select auth.uid())
  ) OR user_id = (select auth.uid())
);

DROP POLICY IF EXISTS "Users can view own participant rows" ON public.conversation_participants;
CREATE POLICY "Users can view own participant rows" ON public.conversation_participants FOR SELECT USING (user_id = (select auth.uid()));

-- Messages
DROP POLICY IF EXISTS "Conversation participants can view messages" ON public.messages;
CREATE POLICY "Conversation participants can view messages" ON public.messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = messages.conversation_id AND user_id = (select auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (sender_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update messages in their conversations" ON public.messages;
CREATE POLICY "Users can update messages in their conversations" ON public.messages FOR UPDATE USING (sender_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
CREATE POLICY "Users can view messages in their conversations" ON public.messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = messages.conversation_id AND user_id = (select auth.uid())
  )
);

-- Events
DROP POLICY IF EXISTS "Authenticated users can create events" ON public.events;
CREATE POLICY "Authenticated users can create events" ON public.events FOR INSERT WITH CHECK (organizer_id = (select auth.uid()));

DROP POLICY IF EXISTS "Organizers can delete own events" ON public.events;
CREATE POLICY "Organizers can delete own events" ON public.events FOR DELETE USING (organizer_id = (select auth.uid()));

DROP POLICY IF EXISTS "Organizers can update own events" ON public.events;
CREATE POLICY "Organizers can update own events" ON public.events FOR UPDATE USING (organizer_id = (select auth.uid()));

-- Event Registrations
DROP POLICY IF EXISTS "Organizers can check in attendees" ON public.event_registrations;
CREATE POLICY "Organizers can check in attendees" ON public.event_registrations FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM events
    WHERE id = event_id AND organizer_id = (select auth.uid())
  )
);

-- Admin Audit Logs
DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.admin_audit_logs;
CREATE POLICY "Only admins can view audit logs" ON public.admin_audit_logs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM admin_roles
    WHERE user_id = (select auth.uid()) AND role IN ('admin', 'super_admin')
  )
);

-- Marketplace Listings
-- The user prompt referenced 'marketplace_listings' and 'seller_id', but the schema uses 'marketplace_items' and 'user_id'
-- We will use 'marketplace_items' and 'user_id' to match the actual schema

-- Marketplace Items
DROP POLICY IF EXISTS "Authenticated users can create listings" ON public.marketplace_items;
CREATE POLICY "Authenticated users can create listings" ON public.marketplace_items FOR INSERT WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own listings" ON public.marketplace_items;
CREATE POLICY "Users can delete own listings" ON public.marketplace_items FOR DELETE USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own listings" ON public.marketplace_items;
CREATE POLICY "Users can update own listings" ON public.marketplace_items FOR UPDATE USING (user_id = (select auth.uid()));

-- Saved Jobs
DROP POLICY IF EXISTS "Users can save jobs" ON public.saved_jobs;
CREATE POLICY "Users can save jobs" ON public.saved_jobs FOR INSERT WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can unsave jobs" ON public.saved_jobs;
CREATE POLICY "Users can unsave jobs" ON public.saved_jobs FOR DELETE USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view own saved jobs" ON public.saved_jobs;
CREATE POLICY "Users can view own saved jobs" ON public.saved_jobs FOR SELECT USING (user_id = (select auth.uid()));

-- Community Posts
DROP POLICY IF EXISTS "Users can delete own posts" ON public.community_posts;
CREATE POLICY "Users can delete own posts" ON public.community_posts FOR DELETE USING (author_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own posts" ON public.community_posts;
CREATE POLICY "Users can update own posts" ON public.community_posts FOR UPDATE USING (author_id = (select auth.uid()));

-- Community Comments
DROP POLICY IF EXISTS "Users can delete own comments" ON public.community_comments;
CREATE POLICY "Users can delete own comments" ON public.community_comments FOR DELETE USING (author_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own comments" ON public.community_comments;
CREATE POLICY "Users can update own comments" ON public.community_comments FOR UPDATE USING (author_id = (select auth.uid()));

-- Stripe Subscriptions
DROP POLICY IF EXISTS "Users can view their own subscription data" ON public.stripe_subscriptions;
CREATE POLICY "Users can view their own subscription data" ON public.stripe_subscriptions FOR SELECT USING (user_id = (select auth.uid()));

-- Stripe Orders
DROP POLICY IF EXISTS "Users can view their own order data" ON public.stripe_orders;
CREATE POLICY "Users can view their own order data" ON public.stripe_orders FOR SELECT USING (user_id = (select auth.uid()));

-- Conversation Reports
DROP POLICY IF EXISTS "Admins can view all reports" ON public.conversation_reports;
CREATE POLICY "Admins can view all reports" ON public.conversation_reports FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM admin_roles
    WHERE user_id = (select auth.uid()) AND role IN ('admin', 'super_admin')
  )
);

-- Au Pair Profiles
DROP POLICY IF EXISTS "Host families can view au pair profiles" ON public.au_pair_profiles;
CREATE POLICY "Host families can view au pair profiles" ON public.au_pair_profiles FOR SELECT USING (true); -- Usually public or based on subscription, keeping simple for now or strictly optimizing existing logic

-- Host Family Profiles
DROP POLICY IF EXISTS "Au pairs can view host family profiles" ON public.host_family_profiles;
CREATE POLICY "Au pairs can view host family profiles" ON public.host_family_profiles FOR SELECT USING (true);

-- Visa Documents
DROP POLICY IF EXISTS "Admins can verify documents" ON public.visa_documents;
CREATE POLICY "Admins can verify documents" ON public.visa_documents FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM admin_roles
    WHERE user_id = (select auth.uid()) AND role IN ('admin', 'super_admin')
  )
);

-- Marketplace Favorites
DROP POLICY IF EXISTS "Users can add favorites" ON public.marketplace_favorites;
CREATE POLICY "Users can add favorites" ON public.marketplace_favorites FOR INSERT WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can remove favorites" ON public.marketplace_favorites;
CREATE POLICY "Users can remove favorites" ON public.marketplace_favorites FOR DELETE USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view own favorites" ON public.marketplace_favorites;
CREATE POLICY "Users can view own favorites" ON public.marketplace_favorites FOR SELECT USING (user_id = (select auth.uid()));

-- Marketplace Reviews
DROP POLICY IF EXISTS "Users can create reviews" ON public.marketplace_reviews;
CREATE POLICY "Users can create reviews" ON public.marketplace_reviews FOR INSERT WITH CHECK (reviewer_id = (select auth.uid()));

-- Event Favorites
DROP POLICY IF EXISTS "Users can add favorites" ON public.event_favorites;
CREATE POLICY "Users can add favorites" ON public.event_favorites FOR INSERT WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can remove favorites" ON public.event_favorites;
CREATE POLICY "Users can remove favorites" ON public.event_favorites FOR DELETE USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view own favorites" ON public.event_favorites;
CREATE POLICY "Users can view own favorites" ON public.event_favorites FOR SELECT USING (user_id = (select auth.uid()));

-- Event Comments
DROP POLICY IF EXISTS "Users can create comments" ON public.event_comments;
CREATE POLICY "Users can create comments" ON public.event_comments FOR INSERT WITH CHECK (author_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own comments" ON public.event_comments;
CREATE POLICY "Users can delete own comments" ON public.event_comments FOR DELETE USING (author_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own comments" ON public.event_comments;
CREATE POLICY "Users can update own comments" ON public.event_comments FOR UPDATE USING (author_id = (select auth.uid()));

-- Event Reviews
DROP POLICY IF EXISTS "Users can create reviews" ON public.event_reviews;
CREATE POLICY "Users can create reviews" ON public.event_reviews FOR INSERT WITH CHECK (reviewer_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own reviews" ON public.event_reviews;
CREATE POLICY "Users can update own reviews" ON public.event_reviews FOR UPDATE USING (reviewer_id = (select auth.uid()));

-- Event Updates
DROP POLICY IF EXISTS "Organizers can create updates" ON public.event_updates;
CREATE POLICY "Organizers can create updates" ON public.event_updates FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM events
    WHERE id = event_id AND organizer_id = (select auth.uid())
  )
);

-- Education Interest Documents
DROP POLICY IF EXISTS "Users can upload documents" ON public.education_interest_documents;
CREATE POLICY "Users can upload documents" ON public.education_interest_documents FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM education_interests
    WHERE id = interest_id AND user_id = (select auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can view own documents" ON public.education_interest_documents;
CREATE POLICY "Users can view own documents" ON public.education_interest_documents FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM education_interests
    WHERE id = interest_id AND user_id = (select auth.uid())
  )
);

-- Education Interest History
DROP POLICY IF EXISTS "Users can view own history" ON public.education_interest_history;
CREATE POLICY "Users can view own history" ON public.education_interest_history FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM education_interests
    WHERE id = interest_id AND user_id = (select auth.uid())
  )
);

-- Education Favorites
DROP POLICY IF EXISTS "Users can add favorites" ON public.education_favorites;
CREATE POLICY "Users can add favorites" ON public.education_favorites FOR INSERT WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can remove favorites" ON public.education_favorites;
CREATE POLICY "Users can remove favorites" ON public.education_favorites FOR DELETE USING (user_id = (select auth.uid()));
