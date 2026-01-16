/*
  # Create Saved Jobs Table
  
  ## New Table
  
  ### `saved_jobs`
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users) - User who saved the job
  - `job_id` (uuid, foreign key to jobs) - The saved job
  - `created_at` (timestamptz) - When the job was saved
  - Unique constraint on (user_id, job_id) to prevent duplicate saves
  
  ## Security
  - Enable RLS on saved_jobs table
  - Users can only view, create, and delete their own saved jobs
  - Users cannot modify saved_jobs after creation
  
  ## Indexes
  - Index on user_id for fast lookups of user's saved jobs
  - Index on job_id for analytics
  - Index on created_at for sorting
*/

-- Create saved_jobs table
CREATE TABLE IF NOT EXISTS saved_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, job_id)
);

-- Enable RLS
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own saved jobs
CREATE POLICY "Users can view own saved jobs"
  ON saved_jobs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can save jobs
CREATE POLICY "Users can save jobs"
  ON saved_jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can unsave jobs
CREATE POLICY "Users can unsave jobs"
  ON saved_jobs
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_saved_jobs_user ON saved_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_job ON saved_jobs(job_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_created ON saved_jobs(created_at DESC);

-- Create a unique index to enforce one save per user per job
CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_jobs_user_job_unique ON saved_jobs(user_id, job_id);
