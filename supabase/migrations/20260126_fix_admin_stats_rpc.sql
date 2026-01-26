-- Fix Admin Dashboard Stats RPC
-- Updates the `get_admin_dashboard_stats` function to provide accurate, filtered counts.

CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- We prioritize data access for the dashboard but ensure we only count "active/public" matching items.
  
  SELECT json_build_object(
    'totalUsers', (SELECT count(*) FROM profiles), -- Total users (could filter is_banned, but total users usually implies all registrations)
    
    'totalJobs', (SELECT count(*) FROM jobs WHERE status NOT IN ('draft', 'archived')),
    
    'totalMarketplaceItems', (SELECT count(*) FROM marketplace_items WHERE status IN ('active', 'pending', 'sold')),
    
    'totalEvents', (SELECT count(*) FROM events WHERE status = 'published'),
    
    'totalEducationPrograms', (SELECT count(*) FROM education_resources WHERE status = 'active'),
    
    'pendingJobApplications', (SELECT count(*) FROM job_applications WHERE status = 'pending'),
    
    'pendingEducationInterests', (SELECT count(*) FROM education_interests WHERE status = 'submitted'),
    
    'pendingVisaApplications', (SELECT count(*) FROM visa_applications WHERE status = 'submitted'),
    
    'activeConversations', (SELECT count(*) FROM conversations WHERE is_blocked IS NOT TRUE),
    
    'totalAuPairs', (SELECT count(*) FROM au_pair_profiles WHERE profile_status = 'active'), -- Only active Au Pair profiles
    
    'totalHostFamilies', (SELECT count(*) FROM host_family_profiles WHERE profile_status = 'active') -- Only active Host Family profiles
  ) INTO result;

  RETURN result;
END;
$$;
