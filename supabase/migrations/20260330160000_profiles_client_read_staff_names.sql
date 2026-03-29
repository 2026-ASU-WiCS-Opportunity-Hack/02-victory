-- Portal clients can read names of staff who logged visits on their client record (for service history).

DROP POLICY IF EXISTS "profiles_select_staff_linked_to_my_visits" ON profiles;
CREATE POLICY "profiles_select_staff_linked_to_my_visits" ON profiles
  FOR SELECT USING (
    role IN ('admin', 'staff')
    AND id IN (
      SELECT staff_id FROM service_entries
      WHERE client_id IN (
        SELECT client_id FROM profiles
        WHERE id = auth.uid() AND role = 'client' AND client_id IS NOT NULL
      )
    )
  );
