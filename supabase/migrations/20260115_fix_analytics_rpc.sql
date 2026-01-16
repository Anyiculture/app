-- Fix upsert_user_activity RPC function to bypass RLS
DROP FUNCTION IF EXISTS upsert_user_activity(uuid, date, integer);

CREATE OR REPLACE FUNCTION upsert_user_activity(
  p_user_id uuid,
  p_date date,
  p_session_duration integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to bypass RLS
AS $$
BEGIN
  INSERT INTO analytics_user_activity (
    user_id,
    date,
    page_views,
    events_count,
    session_duration_minutes
  )
  VALUES (
    p_user_id,
    p_date,
    1,
    1,
    p_session_duration
  )
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    page_views = analytics_user_activity.page_views + 1,
    events_count = analytics_user_activity.events_count + 1,
    session_duration_minutes = analytics_user_activity.session_duration_minutes + p_session_duration,
    updated_at = now();
END;
$$;
