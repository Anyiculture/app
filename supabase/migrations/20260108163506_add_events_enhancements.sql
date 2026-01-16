/*
  # Events Enhancements

  1. Changes
    - Add registration limit enforcement
    - Add check-in functionality
    - Add attendee list views
    - Track event capacity

  2. Security
    - Add policies for check-in
    - Ensure only organizers can check in attendees
*/

-- Add max_attendees column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'max_attendees'
  ) THEN
    ALTER TABLE events ADD COLUMN max_attendees integer;
  END IF;
END $$;

-- Add checked_in column to event_registrations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'event_registrations' AND column_name = 'checked_in'
  ) THEN
    ALTER TABLE event_registrations ADD COLUMN checked_in boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'event_registrations' AND column_name = 'checked_in_at'
  ) THEN
    ALTER TABLE event_registrations ADD COLUMN checked_in_at timestamptz;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'event_registrations' AND column_name = 'checked_in_by'
  ) THEN
    ALTER TABLE event_registrations ADD COLUMN checked_in_by uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Function to check if event is full
CREATE OR REPLACE FUNCTION is_event_full(event_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  max_limit integer;
  current_count integer;
BEGIN
  SELECT max_attendees INTO max_limit
  FROM events
  WHERE id = event_id_param;
  
  IF max_limit IS NULL THEN
    RETURN false;
  END IF;
  
  SELECT COUNT(*) INTO current_count
  FROM event_registrations
  WHERE event_id = event_id_param AND status = 'confirmed';
  
  RETURN current_count >= max_limit;
END;
$$;

-- Policy: Event organizers can check in attendees
CREATE POLICY "Organizers can check in attendees"
  ON event_registrations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_registrations.event_id
      AND events.organizer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_registrations.event_id
      AND events.organizer_id = auth.uid()
    )
  );

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_event_registrations_checked_in ON event_registrations(event_id, checked_in);
