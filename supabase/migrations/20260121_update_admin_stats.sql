-- Update admin dashboard stats to include Au Pair and Host Family counts
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'totalUsers', (SELECT count(*) FROM profiles),
    'totalJobs', (SELECT count(*) FROM jobs),
    'totalMarketplaceItems', (SELECT count(*) FROM marketplace_items),
    'totalEvents', (SELECT count(*) FROM events),
    'totalEducationPrograms', (SELECT count(*) FROM education_resources WHERE status = 'active'),
    'pendingJobApplications', (SELECT count(*) FROM job_applications WHERE status = 'pending'),
    'pendingEducationInterests', (SELECT count(*) FROM education_interests WHERE status = 'submitted'),
    'pendingVisaApplications', (SELECT count(*) FROM visa_applications WHERE status = 'submitted'),
    'activeConversations', (SELECT count(*) FROM conversations),
    'totalAuPairs', (SELECT count(*) FROM au_pair_profiles),
    'totalHostFamilies', (SELECT count(*) FROM host_family_profiles)
  ) INTO result;

  RETURN result;
END;
$$;
