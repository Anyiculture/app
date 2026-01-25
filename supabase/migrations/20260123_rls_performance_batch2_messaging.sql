-- RLS Performance Optimization - Batch 2
-- Optimize auth.uid() evaluation for tables not covered by 20260118_optimize_rls_performance.sql
-- Wrapping auth.uid() with (select auth.uid()) prevents per-row re-evaluation

DO $$
BEGIN
  
  -- 1. conversation_participants (3 policies not yet optimized)
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conversation_participants' AND policyname = 'Users can view own participant rows') THEN
    DROP POLICY "Users can view own participant rows" ON conversation_participants;
    CREATE POLICY "Users can view own participant rows" ON conversation_participants FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conversation_participants' AND policyname = 'Users can update own participant rows') THEN
    DROP POLICY "Users can update own participant rows" ON conversation_participants;
    CREATE POLICY "Users can update own participant rows" ON conversation_participants FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conversation_participants' AND policyname = 'Users can add participants') THEN
    DROP POLICY "Users can add participants" ON conversation_participants;
    CREATE POLICY "Users can add participants" ON conversation_participants FOR INSERT TO authenticated WITH CHECK (
      EXISTS (
        SELECT 1 FROM conversations c
        WHERE c.id = conversation_id
        AND EXISTS (
          SELECT 1 FROM conversation_participants cp
          WHERE cp.conversation_id = c.id
          AND cp.user_id = (select auth.uid())
        )
      )
    );
  END IF;

  -- 2. conversations (2 policies - messaging related)
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conversations' AND policyname = 'Users can view own conversations') THEN
    DROP POLICY "Users can view own conversations" ON conversations;
    CREATE POLICY "Users can view own conversations" ON conversations FOR SELECT TO authenticated USING (
      EXISTS (
        SELECT 1 FROM conversation_participants
        WHERE conversation_id = conversations.id
        AND user_id = (select auth.uid())
      )
    );
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conversations' AND policyname = 'Participants can update conversations') THEN
    DROP POLICY "Participants can update conversations" ON conversations;
    CREATE POLICY "Participants can update conversations" ON conversations FOR UPDATE TO authenticated USING (
      EXISTS (
        SELECT 1 FROM conversation_participants
        WHERE conversation_id = conversations.id
        AND user_id = (select auth.uid())
      )
    );
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conversations' AND policyname = 'Users can update own conversations') THEN
    DROP POLICY "Users can update own conversations" ON conversations;
    CREATE POLICY "Users can update own conversations" ON conversations FOR UPDATE TO authenticated USING (
      EXISTS (
        SELECT 1 FROM conversation_participants
        WHERE conversation_id = conversations.id
        AND user_id = (select auth.uid())
      )
    );
  END IF;

  -- 3. messages (3 policies)
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Users can send messages') THEN
    DROP POLICY "Users can send messages" ON messages;
    CREATE POLICY "Users can send messages" ON messages FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = sender_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Conversation participants can view messages') THEN
    DROP POLICY "Conversation participants can view messages" ON messages;
    CREATE POLICY "Conversation participants can view messages" ON messages FOR SELECT TO authenticated USING (
      EXISTS (
        SELECT 1 FROM conversation_participants
        WHERE conversation_id = messages.conversation_id
        AND user_id = (select auth.uid())
      )
    );
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Users can view messages in their conversations') THEN
    DROP POLICY "Users can view messages in their conversations" ON messages;
    CREATE POLICY "Users can view messages in their conversations" ON messages FOR SELECT TO authenticated USING (
      EXISTS (
        SELECT 1 FROM conversation_participants
        WHERE conversation_id = messages.conversation_id
        AND user_id = (select auth.uid())
      )
    );
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Users can update messages in their conversations') THEN
    DROP POLICY "Users can update messages in their conversations" ON messages;
    CREATE POLICY "Users can update messages in their conversations" ON messages FOR UPDATE TO authenticated USING (
      EXISTS (
        SELECT 1 FROM conversation_participants
        WHERE conversation_id = messages.conversation_id
        AND user_id = (select auth.uid())
      )
    );
  END IF;

END $$;

COMMENT ON TABLE public.conversation_participants IS 'RLS policies optimized for performance - auth.uid() wrapped with SELECT (Batch 2)';
COMMENT ON TABLE public.conversations IS 'RLS policies optimized for performance - auth.uid() wrapped with SELECT (Batch 2)';
COMMENT ON TABLE public.messages IS 'RLS policies optimized for performance - auth.uid() wrapped with SELECT (Batch 2)';
