-- Client portal: link auth users to a client record; tighten RLS so only staff/admin see all rows.

-- 1) profiles: optional link to clients for role = client
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'staff', 'client'));

-- 2) clients: staff see all; portal users see only their row
DROP POLICY IF EXISTS "Staff can view all clients" ON clients;
CREATE POLICY "Staff can view all clients" ON clients
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'staff'))
  );

DROP POLICY IF EXISTS "Client can view own client row" ON clients;
CREATE POLICY "Client can view own client row" ON clients
  FOR SELECT USING (
    id IN (
      SELECT client_id FROM profiles
      WHERE id = auth.uid() AND role = 'client' AND client_id IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "Staff can create clients" ON clients;
CREATE POLICY "Staff can create clients" ON clients
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'staff'))
  );

-- 3) service_entries: staff see all; clients see own visits only
DROP POLICY IF EXISTS "Staff can view service entries" ON service_entries;
CREATE POLICY "Staff can view service entries" ON service_entries
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'staff'))
  );

DROP POLICY IF EXISTS "Client can view own service entries" ON service_entries;
CREATE POLICY "Client can view own service entries" ON service_entries
  FOR SELECT USING (
    client_id IN (
      SELECT client_id FROM profiles
      WHERE id = auth.uid() AND role = 'client' AND client_id IS NOT NULL
    )
  );

-- 4) appointments: staff manage all; clients read own appointments only
DROP POLICY IF EXISTS "appointments_select_staff" ON appointments;
CREATE POLICY "appointments_select_staff" ON appointments
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'staff'))
    OR client_id IN (
      SELECT client_id FROM profiles
      WHERE id = auth.uid() AND role = 'client' AND client_id IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "appointments_insert_staff" ON appointments;
CREATE POLICY "appointments_insert_staff" ON appointments
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'staff'))
  );

DROP POLICY IF EXISTS "appointments_update_staff" ON appointments;
CREATE POLICY "appointments_update_staff" ON appointments
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'staff'))
  );

DROP POLICY IF EXISTS "appointments_delete_staff" ON appointments;
CREATE POLICY "appointments_delete_staff" ON appointments
  FOR DELETE USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'staff'))
  );

-- 5) custom_field_definitions + audit_log: restrict to staff/admin (not generic "any profile")
DROP POLICY IF EXISTS "custom_fields_select_staff" ON custom_field_definitions;
CREATE POLICY "custom_fields_select_staff" ON custom_field_definitions
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'staff'))
  );

DROP POLICY IF EXISTS "custom_fields_admin_all" ON custom_field_definitions;
CREATE POLICY "custom_fields_admin_all" ON custom_field_definitions
  FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

DROP POLICY IF EXISTS "audit_insert_staff" ON audit_log;
CREATE POLICY "audit_insert_staff" ON audit_log
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'staff'))
  );
