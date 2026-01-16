/*
  # Boss Zhipin Phase 1 Features - Database Schema
  
  Creates tables for:
  1. Job Interests (Say Hi feature)
  2. Job Applications (ATS Pipeline)
  3. Application Pipeline History (Audit trail)
  4. Interviews (Interview Scheduling)
  5. User Job Preferences (Smart Recommendations)
  6. Job Views (Recommendation tracking)
*/

-- ============================================
-- 1. JOB INTERESTS (Say Hi Feature)
-- ============================================

CREATE TABLE IF NOT EXISTS job_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  greeting_message text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'responded', 'ignored')),
  created_at timestamptz DEFAULT now(),
  viewed_at timestamptz,
  responded_at timestamptz,
  UNIQUE(job_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_job_interests_job_id ON job_interests(job_id);
CREATE INDEX IF NOT EXISTS idx_job_interests_user_id ON job_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_job_interests_status ON job_interests(status);

-- RLS Policies for job_interests
ALTER TABLE job_interests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own job interests" ON job_interests;
CREATE POLICY "Users can view own job interests"
  ON job_interests FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Employers can view interests on their jobs" ON job_interests;
CREATE POLICY "Employers can view interests on their jobs"
  ON job_interests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = job_interests.job_id
      AND jobs.poster_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Job seekers can create interests" ON job_interests;
CREATE POLICY "Job seekers can create interests"
  ON job_interests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own interests" ON job_interests;
CREATE POLICY "Users can update own interests"
  ON job_interests FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- 2. JOB APPLICATIONS (ATS Pipeline)
-- ============================================

CREATE TABLE IF NOT EXISTS job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  applicant_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'applied' CHECK (status IN (
    'applied', 'screening', 'interview_scheduled', 
    'interviewed', 'offer_extended', 'hired', 'rejected'
  )),
  notes text,
  resume_url text,
  cover_letter text,
  applied_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(job_id, applicant_id)
);

CREATE INDEX IF NOT EXISTS idx_applications_job_id ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_applicant_id ON job_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_updated_at ON job_applications(updated_at DESC);

-- RLS Policies for job_applications
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Applicants can view own applications" ON job_applications;
CREATE POLICY "Applicants can view own applications"
  ON job_applications FOR SELECT
  USING (auth.uid() = applicant_id);

DROP POLICY IF EXISTS "Employers can view applications for their jobs" ON job_applications;
CREATE POLICY "Employers can view applications for their jobs"
  ON job_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = job_applications.job_id
      AND jobs.poster_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Job seekers can create applications" ON job_applications;
CREATE POLICY "Job seekers can create applications"
  ON job_applications FOR INSERT
  WITH CHECK (auth.uid() = applicant_id);

DROP POLICY IF EXISTS "Employers can update application status" ON job_applications;
CREATE POLICY "Employers can update application status"
  ON job_applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = job_applications.job_id
      AND jobs.poster_id = auth.uid()
    )
  );

-- ============================================
-- 3. APPLICATION PIPELINE HISTORY
-- ============================================

CREATE TABLE IF NOT EXISTS application_pipeline_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES job_applications(id) ON DELETE CASCADE NOT NULL,
  from_status text,
  to_status text NOT NULL,
  changed_by uuid REFERENCES auth.users(id),
  changed_at timestamptz DEFAULT now(),
  notes text
);

CREATE INDEX IF NOT EXISTS idx_pipeline_history_application ON application_pipeline_history(application_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_history_changed_at ON application_pipeline_history(changed_at DESC);

-- RLS Policies for application_pipeline_history
ALTER TABLE application_pipeline_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view relevant pipeline history" ON application_pipeline_history;
CREATE POLICY "Users can view relevant pipeline history"
  ON application_pipeline_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM job_applications
      WHERE job_applications.id = application_pipeline_history.application_id
      AND (
        job_applications.applicant_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM jobs
          WHERE jobs.id = job_applications.job_id
          AND jobs.poster_id = auth.uid()
        )
      )
    )
  );

DROP POLICY IF EXISTS "System can create history" ON application_pipeline_history;
CREATE POLICY "System can create history"
  ON application_pipeline_history FOR INSERT
  WITH CHECK (true);

-- Trigger to automatically create pipeline history
CREATE OR REPLACE FUNCTION track_application_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO application_pipeline_history (
      application_id,
      from_status,
      to_status,
      changed_by
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS track_application_status_trigger ON job_applications;
CREATE TRIGGER track_application_status_trigger
  AFTER UPDATE ON job_applications
  FOR EACH ROW
  EXECUTE FUNCTION track_application_status_change();

-- ============================================
-- 4. INTERVIEWS (Interview Scheduling)
-- ============================================

CREATE TABLE IF NOT EXISTS interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES job_applications(id) ON DELETE CASCADE,
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  interviewer_id uuid REFERENCES auth.users(id) NOT NULL,
  interviewee_id uuid REFERENCES auth.users(id) NOT NULL,
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer DEFAULT 60,
  location text,
  meeting_url text,
  status text DEFAULT 'scheduled' CHECK (status IN (
    'scheduled', 'confirmed', 'rescheduled', 'cancelled', 'completed'
  )),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_interviews_application_id ON interviews(application_id);
CREATE INDEX IF NOT EXISTS idx_interviews_job_id ON interviews(job_id);
CREATE INDEX IF NOT EXISTS idx_interviews_interviewer ON interviews(interviewer_id);
CREATE INDEX IF NOT EXISTS idx_interviews_interviewee ON interviews(interviewee_id);
CREATE INDEX IF NOT EXISTS idx_interviews_scheduled_at ON interviews(scheduled_at);

-- RLS Policies for interviews
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can view interviews" ON interviews;
CREATE POLICY "Participants can view interviews"
  ON interviews FOR SELECT
  USING (
    auth.uid() = interviewer_id OR
    auth.uid() = interviewee_id
  );

DROP POLICY IF EXISTS "Employers can create interviews" ON interviews;
CREATE POLICY "Employers can create interviews"
  ON interviews FOR INSERT
  WITH CHECK (auth.uid() = interviewer_id);

DROP POLICY IF EXISTS "Participants can update interviews" ON interviews;
CREATE POLICY "Participants can update interviews"
  ON interviews FOR UPDATE
  USING (
    auth.uid() = interviewer_id OR
    auth.uid() = interviewee_id
  );

-- ============================================
-- 5. USER JOB PREFERENCES (Smart Recommendations)
-- ============================================

CREATE TABLE IF NOT EXISTS user_job_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_industries text[],
  preferred_locations text[],
  preferred_job_types text[],
  preferred_categories text[],
  min_salary numeric,
  max_commute_minutes integer,
  remote_only boolean DEFAULT false,
  updated_at timestamptz DEFAULT now()
);

-- RLS Policies for user_job_preferences
ALTER TABLE user_job_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own preferences" ON user_job_preferences;
CREATE POLICY "Users can view own preferences"
  ON user_job_preferences FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own preferences" ON user_job_preferences;
CREATE POLICY "Users can manage own preferences"
  ON user_job_preferences FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- 6. JOB VIEWS (Recommendation Tracking)
-- ============================================

CREATE TABLE IF NOT EXISTS job_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at timestamptz DEFAULT now(),
  duration_seconds integer,
  source text
);

CREATE INDEX IF NOT EXISTS idx_job_views_user_id ON job_views(user_id);
CREATE INDEX IF NOT EXISTS idx_job_views_job_id ON job_views(job_id);
CREATE INDEX IF NOT EXISTS idx_job_views_viewed_at ON job_views(viewed_at DESC);

-- RLS Policies for job_views
ALTER TABLE job_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own job views" ON job_views;
CREATE POLICY "Users can view own job views"
  ON job_views FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create job views" ON job_views;
CREATE POLICY "Users can create job views"
  ON job_views FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify all tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'job_interests',
  'job_applications',
  'application_pipeline_history',
  'interviews',
  'user_job_preferences',
  'job_views'
)
ORDER BY table_name;
