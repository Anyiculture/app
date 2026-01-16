-- Create job_interests table for "I'm Interested" feature
CREATE TABLE IF NOT EXISTS public.job_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  greeting_message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'responded', 'ignored')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  viewed_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  UNIQUE(job_id, user_id) -- One interest per user per job
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_interests_job_id ON public.job_interests(job_id);
CREATE INDEX IF NOT EXISTS idx_job_interests_user_id ON public.job_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_job_interests_status ON public.job_interests(status);

-- Enable RLS
ALTER TABLE public.job_interests ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own interests
CREATE POLICY "Users can view own interests"
  ON public.job_interests
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own interests
CREATE POLICY "Users can express interest"
  ON public.job_interests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own interests (withdraw)
CREATE POLICY "Users can withdraw interest"
  ON public.job_interests
  FOR DELETE
  USING (auth.uid() = user_id);

-- Employers can view interests for their jobs
CREATE POLICY "Employers can view job interests"
  ON public.job_interests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = job_interests.job_id
      AND jobs.poster_id = auth.uid()
    )
  );

-- Employers can update status of interests for their jobs
CREATE POLICY "Employers can update interest status"
  ON public.job_interests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = job_interests.job_id
      AND jobs.poster_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = job_interests.job_id
      AND jobs.poster_id = auth.uid()
    )
  );

-- Grant permissions
GRANT ALL ON public.job_interests TO authenticated;
GRANT SELECT ON public.job_interests TO anon;
