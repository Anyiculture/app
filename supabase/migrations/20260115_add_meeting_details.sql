ALTER TABLE meetings
ADD COLUMN IF NOT EXISTS platform text,
ADD COLUMN IF NOT EXISTS location text;
