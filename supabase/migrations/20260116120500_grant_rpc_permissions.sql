-- Grant execute permissions to authenticated users for admin RPC functions
GRANT EXECUTE ON FUNCTION get_admin_visa_applications() TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_visa_applications() TO service_role;
GRANT EXECUTE ON FUNCTION get_admin_dashboard_stats() TO service_role;
