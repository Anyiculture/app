CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result json;
BEGIN
  -- Check admin permission
  IF NOT is_admin_internal() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT json_build_object(
    'totalUsers', (SELECT count(*) FROM profiles),
    -- Jobs: Filter by status != archived (and potentially draft if desired, but user said "deleted")
    'totalJobs', (SELECT count(*) FROM jobs WHERE status != 'archived' AND status != 'draft'),
    -- Marketplace: Filter by active status (assuming deleted ones are gone or marked 'archived'/'sold' but user wants "active")
    'totalMarketplaceItems', (
        CASE 
            WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'marketplace_items') 
            THEN (SELECT count(*) FROM marketplace_items WHERE status = 'active')
            ELSE 0 
        END
    ),
    -- Events: Filter by published status
    'totalEvents', (SELECT count(*) FROM events WHERE status = 'published'),
    -- Education: Filter by active status
    'totalEducationPrograms', (SELECT count(*) FROM education_resources WHERE status = 'active'),
    
    'pendingJobApplications', (SELECT count(*) FROM job_applications WHERE status = 'pending'),
    'pendingEducationInterests', (SELECT count(*) FROM education_interests WHERE status = 'submitted'),
    'pendingVisaApplications', (SELECT count(*) FROM visa_applications WHERE status = 'submitted' OR status = 'documents_requested'),
    'activeConversations', (SELECT count(*) FROM conversations),
    
    -- Au Pairs: Filter by active profile status
    'totalAuPairs', (SELECT count(*) FROM au_pair_profiles WHERE profile_status = 'active'),
    -- Host Families: Filter by active profile status
    'totalHostFamilies', (SELECT count(*) FROM host_family_profiles WHERE profile_status = 'active')
  ) INTO v_result;

  RETURN v_result;
END;
$$;
