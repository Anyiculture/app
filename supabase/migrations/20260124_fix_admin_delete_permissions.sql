-- Fix Au Pair Profiles Policy (Allow admins to delete ANY profile)
DROP POLICY IF EXISTS "Admins can manage au pair profiles" ON au_pair_profiles;

CREATE POLICY "Admins can manage au pair profiles"
ON au_pair_profiles FOR ALL TO authenticated
USING (is_admin_internal());

-- Fix Host Family Profiles Policy (Consistency)
DROP POLICY IF EXISTS "Admins can manage host family profiles" ON host_family_profiles;

CREATE POLICY "Admins can manage host family profiles"
ON host_family_profiles FOR ALL TO authenticated
USING (is_admin_internal());
