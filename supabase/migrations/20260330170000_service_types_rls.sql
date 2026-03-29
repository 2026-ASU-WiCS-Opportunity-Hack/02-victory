-- Service types: ensure is_active, optional table bootstrap, RLS (staff read active; admin manage).

CREATE TABLE IF NOT EXISTS service_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (name)
);

ALTER TABLE service_types ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
UPDATE service_types SET is_active = COALESCE(is_active, true);
ALTER TABLE service_types ALTER COLUMN is_active SET DEFAULT true;
ALTER TABLE service_types ALTER COLUMN is_active SET NOT NULL;

ALTER TABLE service_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_types_select_staff" ON service_types;
CREATE POLICY "service_types_select_staff" ON service_types
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
    OR (
      is_active = true
      AND auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'staff'))
    )
  );

DROP POLICY IF EXISTS "service_types_insert_admin" ON service_types;
CREATE POLICY "service_types_insert_admin" ON service_types
  FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

DROP POLICY IF EXISTS "service_types_update_admin" ON service_types;
CREATE POLICY "service_types_update_admin" ON service_types
  FOR UPDATE USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
