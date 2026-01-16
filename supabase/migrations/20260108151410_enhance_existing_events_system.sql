/*
  # Enhance Existing Events System

  ## Overview
  Complete upgrade of events system with all features for RSVP, attendee management, and communication.

  ## Changes to Existing Tables
  - Enhance `events` table with new columns
  - Enhance `event_registrations` table with new columns

  ## New Tables
  - `event_categories` - Event categories
  - `event_favorites` - User favorites
  - `event_comments` - Event comments/discussions
  - `event_reviews` - Post-event reviews
  - `event_updates` - Organizer announcements

  ## Security
  - Update RLS policies for enhanced functionality
*/

-- Create event_categories table
CREATE TABLE IF NOT EXISTS event_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text NOT NULL,
  name_zh text NOT NULL,
  icon text NOT NULL DEFAULT 'calendar',
  color text NOT NULL DEFAULT 'blue',
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enhance events table with new columns
DO $$
BEGIN
  -- Add columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'title_zh') THEN
    ALTER TABLE events ADD COLUMN title_zh text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'description_zh') THEN
    ALTER TABLE events ADD COLUMN description_zh text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'category') THEN
    ALTER TABLE events ADD COLUMN category text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'event_type') THEN
    ALTER TABLE events ADD COLUMN event_type text DEFAULT 'in_person';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'start_date') THEN
    ALTER TABLE events ADD COLUMN start_date timestamptz;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'end_date') THEN
    ALTER TABLE events ADD COLUMN end_date timestamptz;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'timezone') THEN
    ALTER TABLE events ADD COLUMN timezone text DEFAULT 'America/Toronto';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'location_city') THEN
    ALTER TABLE events ADD COLUMN location_city text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'location_address') THEN
    ALTER TABLE events ADD COLUMN location_address text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'location_venue') THEN
    ALTER TABLE events ADD COLUMN location_venue text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'online_link') THEN
    ALTER TABLE events ADD COLUMN online_link text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'capacity') THEN
    ALTER TABLE events ADD COLUMN capacity integer;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'registration_deadline') THEN
    ALTER TABLE events ADD COLUMN registration_deadline timestamptz;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'price') THEN
    ALTER TABLE events ADD COLUMN price decimal(10,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'currency') THEN
    ALTER TABLE events ADD COLUMN currency text DEFAULT 'CAD';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'is_featured') THEN
    ALTER TABLE events ADD COLUMN is_featured boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'tags') THEN
    ALTER TABLE events ADD COLUMN tags text[] DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'requirements') THEN
    ALTER TABLE events ADD COLUMN requirements text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'contact_email') THEN
    ALTER TABLE events ADD COLUMN contact_email text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'contact_phone') THEN
    ALTER TABLE events ADD COLUMN contact_phone text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'external_link') THEN
    ALTER TABLE events ADD COLUMN external_link text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'views_count') THEN
    ALTER TABLE events ADD COLUMN views_count integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'attendee_count') THEN
    ALTER TABLE events ADD COLUMN attendee_count integer DEFAULT 0;
  END IF;
END $$;

-- Enhance event_registrations table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_registrations' AND column_name = 'status') THEN
    ALTER TABLE event_registrations ADD COLUMN status text DEFAULT 'going';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_registrations' AND column_name = 'attendee_name') THEN
    ALTER TABLE event_registrations ADD COLUMN attendee_name text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_registrations' AND column_name = 'attendee_email') THEN
    ALTER TABLE event_registrations ADD COLUMN attendee_email text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_registrations' AND column_name = 'attendee_phone') THEN
    ALTER TABLE event_registrations ADD COLUMN attendee_phone text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_registrations' AND column_name = 'additional_guests') THEN
    ALTER TABLE event_registrations ADD COLUMN additional_guests integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_registrations' AND column_name = 'dietary_restrictions') THEN
    ALTER TABLE event_registrations ADD COLUMN dietary_restrictions text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_registrations' AND column_name = 'special_requirements') THEN
    ALTER TABLE event_registrations ADD COLUMN special_requirements text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_registrations' AND column_name = 'checked_in') THEN
    ALTER TABLE event_registrations ADD COLUMN checked_in boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_registrations' AND column_name = 'checked_in_at') THEN
    ALTER TABLE event_registrations ADD COLUMN checked_in_at timestamptz;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_registrations' AND column_name = 'cancelled_at') THEN
    ALTER TABLE event_registrations ADD COLUMN cancelled_at timestamptz;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_registrations' AND column_name = 'updated_at') THEN
    ALTER TABLE event_registrations ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Create event_favorites table
CREATE TABLE IF NOT EXISTS event_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, event_id)
);

-- Create event_comments table
CREATE TABLE IF NOT EXISTS event_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  comment text NOT NULL,
  parent_id uuid REFERENCES event_comments(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create event_reviews table
CREATE TABLE IF NOT EXISTS event_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Create event_updates table
CREATE TABLE IF NOT EXISTS event_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE event_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_updates ENABLE ROW LEVEL SECURITY;

-- RLS for event_categories
DROP POLICY IF EXISTS "Anyone can view categories" ON event_categories;
CREATE POLICY "Anyone can view categories"
  ON event_categories FOR SELECT
  TO public
  USING (true);

-- RLS for event_favorites
DROP POLICY IF EXISTS "Users can view own favorites" ON event_favorites;
CREATE POLICY "Users can view own favorites"
  ON event_favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can add favorites" ON event_favorites;
CREATE POLICY "Users can add favorites"
  ON event_favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove favorites" ON event_favorites;
CREATE POLICY "Users can remove favorites"
  ON event_favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS for event_comments
DROP POLICY IF EXISTS "Anyone can view comments" ON event_comments;
CREATE POLICY "Anyone can view comments"
  ON event_comments FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Users can create comments" ON event_comments;
CREATE POLICY "Users can create comments"
  ON event_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own comments" ON event_comments;
CREATE POLICY "Users can update own comments"
  ON event_comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON event_comments;
CREATE POLICY "Users can delete own comments"
  ON event_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS for event_reviews
DROP POLICY IF EXISTS "Anyone can view reviews" ON event_reviews;
CREATE POLICY "Anyone can view reviews"
  ON event_reviews FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Users can create reviews" ON event_reviews;
CREATE POLICY "Users can create reviews"
  ON event_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own reviews" ON event_reviews;
CREATE POLICY "Users can update own reviews"
  ON event_reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS for event_updates
DROP POLICY IF EXISTS "Anyone can view event updates" ON event_updates;
CREATE POLICY "Anyone can view event updates"
  ON event_updates FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Organizers can create updates" ON event_updates;
CREATE POLICY "Organizers can create updates"
  ON event_updates FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM events WHERE events.id = event_id AND events.organizer_id = auth.uid())
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date) WHERE start_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_location_city ON events(location_city) WHERE location_city IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_event_registrations_status ON event_registrations(status) WHERE status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_event_favorites_user ON event_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_event_comments_event ON event_comments(event_id);

-- Insert default categories
INSERT INTO event_categories (name_en, name_zh, icon, color, order_index) VALUES
  ('Social', '社交', 'users', 'blue', 1),
  ('Professional', '职业发展', 'briefcase', 'green', 2),
  ('Educational', '教育', 'book', 'purple', 3),
  ('Cultural', '文化', 'globe', 'orange', 4),
  ('Sports', '运动', 'dumbbell', 'red', 5),
  ('Food & Dining', '美食', 'utensils', 'yellow', 6),
  ('Arts & Entertainment', '艺术娱乐', 'palette', 'pink', 7),
  ('Networking', '社交网络', 'share-2', 'teal', 8),
  ('Community', '社区', 'heart', 'rose', 9),
  ('Other', '其他', 'calendar', 'gray', 10)
ON CONFLICT DO NOTHING;

-- Function to update attendee count
CREATE OR REPLACE FUNCTION update_event_attendee_count_v2()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND COALESCE(NEW.status, 'going') = 'going' THEN
    UPDATE events
    SET attendee_count = COALESCE(attendee_count, 0) + (1 + COALESCE(NEW.additional_guests, 0))
    WHERE id = NEW.event_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF COALESCE(OLD.status, 'going') != 'going' AND COALESCE(NEW.status, 'going') = 'going' THEN
      UPDATE events
      SET attendee_count = COALESCE(attendee_count, 0) + (1 + COALESCE(NEW.additional_guests, 0))
      WHERE id = NEW.event_id;
    ELSIF COALESCE(OLD.status, 'going') = 'going' AND COALESCE(NEW.status, 'going') != 'going' THEN
      UPDATE events
      SET attendee_count = GREATEST(0, COALESCE(attendee_count, 0) - (1 + COALESCE(OLD.additional_guests, 0)))
      WHERE id = NEW.event_id;
    ELSIF COALESCE(OLD.status, 'going') = 'going' AND COALESCE(NEW.status, 'going') = 'going' AND COALESCE(OLD.additional_guests, 0) != COALESCE(NEW.additional_guests, 0) THEN
      UPDATE events
      SET attendee_count = COALESCE(attendee_count, 0) + (COALESCE(NEW.additional_guests, 0) - COALESCE(OLD.additional_guests, 0))
      WHERE id = NEW.event_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND COALESCE(OLD.status, 'going') = 'going' THEN
    UPDATE events
    SET attendee_count = GREATEST(0, COALESCE(attendee_count, 0) - (1 + COALESCE(OLD.additional_guests, 0)))
    WHERE id = OLD.event_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for attendee count
DROP TRIGGER IF EXISTS event_attendee_count_trigger_v2 ON event_registrations;
CREATE TRIGGER event_attendee_count_trigger_v2
  AFTER INSERT OR UPDATE OR DELETE ON event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_event_attendee_count_v2();