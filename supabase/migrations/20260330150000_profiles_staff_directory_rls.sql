-- Allow staff/admin to read peer profiles (for service "staff member" dropdown and display).
-- Users can always read their own row.

DROP POLICY IF EXISTS "profiles_select_self_or_staff_peers" ON profiles;
CREATE POLICY "profiles_select_self_or_staff_peers" ON profiles
  FOR SELECT USING (
    auth.uid() = id
    OR (
      role IN ('admin', 'staff')
      AND auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'staff'))
    )
  );
