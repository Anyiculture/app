-- Add attachment columns to messages table
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS attachment_url text,
ADD COLUMN IF NOT EXISTS attachment_type text, -- 'image', 'video', 'file'
ADD COLUMN IF NOT EXISTS attachment_name text,
ADD COLUMN IF NOT EXISTS meeting_id uuid; -- Reference to meeting if this message is an invite

-- Create meetings table
CREATE TABLE IF NOT EXISTS meetings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  organizer_id uuid REFERENCES auth.users(id),
  recipient_id uuid REFERENCES auth.users(id),
  title text NOT NULL,
  description text,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone NOT NULL,
  status text DEFAULT 'pending', -- pending, accepted, declined, cancelled
  meeting_link text, -- optional, for video calls
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- RLS for meetings
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view meetings they are part of" ON meetings
  FOR SELECT USING (auth.uid() = organizer_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can create meetings" ON meetings
  FOR INSERT WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Users can update meetings they are part of" ON meetings
  FOR UPDATE USING (auth.uid() = organizer_id OR auth.uid() = recipient_id);

-- Storage bucket for attachments (if not exists - this might fail if run as SQL but useful for reference)
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload chat attachments" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'chat-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Public can view chat attachments" ON storage.objects
  FOR SELECT USING (bucket_id = 'chat-attachments');
