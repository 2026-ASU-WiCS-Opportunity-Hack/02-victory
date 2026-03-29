-- =============================================================================
-- Victory — test accounts (run in Supabase Dashboard → SQL Editor)
-- =============================================================================
-- Creates / replaces:
--   • admin@casemanager.com     / Admin123!
--   • test@victory.app          / Test1234!
--   • maria.santos@email.example / Client123!  (portal → linked to Maria client row)
--
-- Requires: pgcrypto (below). Token columns on auth.users are set to '' to avoid
-- GoTrue scan errors (see https://github.com/supabase/auth/issues/1940).
--
-- If anything fails, check Logs → Postgres for missing columns; auth schema
-- can differ slightly by Supabase version—add defaults or ask Supabase support.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

BEGIN;

-- Deleting auth.users CASCADE-deletes profiles(id). Public FKs to profiles(id) must be cleared first.
CREATE TEMP TABLE _seed_doomed_profile_ids ON COMMIT DROP AS
SELECT id
FROM auth.users
WHERE lower(email) IN (
  'admin@casemanager.com',
  'test@victory.app',
  'maria.santos@email.example'
);

UPDATE public.clients SET created_by = NULL WHERE created_by IN (SELECT id FROM _seed_doomed_profile_ids);
UPDATE public.service_entries SET staff_id = NULL WHERE staff_id IN (SELECT id FROM _seed_doomed_profile_ids);
UPDATE public.appointments SET staff_id = NULL WHERE staff_id IN (SELECT id FROM _seed_doomed_profile_ids);
UPDATE public.report_templates SET created_by = NULL WHERE created_by IN (SELECT id FROM _seed_doomed_profile_ids);
UPDATE public.generated_reports SET generated_by = NULL WHERE generated_by IN (SELECT id FROM _seed_doomed_profile_ids);
UPDATE public.audit_log SET user_id = NULL WHERE user_id IN (SELECT id FROM _seed_doomed_profile_ids);

-- Remove previous test users (identities first)
DELETE FROM auth.identities
WHERE user_id IN (
  SELECT id
  FROM auth.users
  WHERE lower(email) IN (
    'admin@casemanager.com',
    'test@victory.app',
    'maria.santos@email.example'
  )
);

DELETE FROM auth.users
WHERE lower(email) IN (
  'admin@casemanager.com',
  'test@victory.app',
  'maria.santos@email.example'
);

-- Client record for portal (FK for profiles.client_id)
INSERT INTO public.clients (
  id,
  first_name,
  last_name,
  date_of_birth,
  phone,
  email,
  address,
  demographics,
  created_by
)
VALUES (
  'a0000000-0000-4000-8000-000000000001',
  'Maria',
  'Santos',
  '1988-04-12',
  '(555) 201-4490',
  'maria.santos@email.example',
  '142 Oak St, Springfield',
  '{"language":"ES/EN","household":3}'::jsonb,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  address = EXCLUDED.address,
  demographics = EXCLUDED.demographics;

-- Fixed auth user UUIDs (must match profiles + identities below)
-- Admin
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  recovery_token,
  email_change,
  email_change_token_new,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
VALUES (
  'b0000001-0000-4000-8000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'admin@casemanager.com',
  crypt('Admin123!', gen_salt('bf')),
  timezone('utc', now()),
  '',
  '',
  '',
  '',
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Demo Admin"}',
  timezone('utc', now()),
  timezone('utc', now())
);

INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
VALUES (
  'b0000001-0000-4000-8000-000000000001',
  'b0000001-0000-4000-8000-000000000001',
  jsonb_build_object(
    'sub', 'b0000001-0000-4000-8000-000000000001',
    'email', 'admin@casemanager.com'
  ),
  'email',
  'b0000001-0000-4000-8000-000000000001',
  timezone('utc', now()),
  timezone('utc', now()),
  timezone('utc', now())
);

-- Staff
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  recovery_token,
  email_change,
  email_change_token_new,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
VALUES (
  'b0000001-0000-4000-8000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'test@victory.app',
  crypt('Test1234!', gen_salt('bf')),
  timezone('utc', now()),
  '',
  '',
  '',
  '',
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Test Staff"}',
  timezone('utc', now()),
  timezone('utc', now())
);

INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
VALUES (
  'b0000001-0000-4000-8000-000000000002',
  'b0000001-0000-4000-8000-000000000002',
  jsonb_build_object(
    'sub', 'b0000001-0000-4000-8000-000000000002',
    'email', 'test@victory.app'
  ),
  'email',
  'b0000001-0000-4000-8000-000000000002',
  timezone('utc', now()),
  timezone('utc', now()),
  timezone('utc', now())
);

-- Portal client
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  recovery_token,
  email_change,
  email_change_token_new,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
VALUES (
  'b0000001-0000-4000-8000-000000000003',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'maria.santos@email.example',
  crypt('Client123!', gen_salt('bf')),
  timezone('utc', now()),
  '',
  '',
  '',
  '',
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Maria Santos"}',
  timezone('utc', now()),
  timezone('utc', now())
);

INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
VALUES (
  'b0000001-0000-4000-8000-000000000003',
  'b0000001-0000-4000-8000-000000000003',
  jsonb_build_object(
    'sub', 'b0000001-0000-4000-8000-000000000003',
    'email', 'maria.santos@email.example'
  ),
  'email',
  'b0000001-0000-4000-8000-000000000003',
  timezone('utc', now()),
  timezone('utc', now()),
  timezone('utc', now())
);

-- App profiles (upsert so it works whether or not handle_new_user trigger ran)
INSERT INTO public.profiles (id, full_name, email, role, client_id)
VALUES
  (
    'b0000001-0000-4000-8000-000000000001',
    'Demo Admin',
    'admin@casemanager.com',
    'admin',
    NULL
  ),
  (
    'b0000001-0000-4000-8000-000000000002',
    'Test Staff',
    'test@victory.app',
    'staff',
    NULL
  ),
  (
    'b0000001-0000-4000-8000-000000000003',
    'Maria Santos',
    'maria.santos@email.example',
    'client',
    'a0000000-0000-4000-8000-000000000001'
  )
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  client_id = EXCLUDED.client_id;

COMMIT;

-- =============================================================================
-- After success: sign in at /login with the emails and passwords above.
-- This script does NOT load the full demo service history; use the API seed or
-- import data separately if you need 10 clients + visits.
--
-- If a table above does not exist in your project, comment out that UPDATE line.
--
-- One-off: if delete still fails on a specific profile UUID, clear FKs manually, e.g.:
--   UPDATE public.clients SET created_by = NULL WHERE created_by = 'YOUR-UUID-HERE';
--   UPDATE public.service_entries SET staff_id = NULL WHERE staff_id = 'YOUR-UUID-HERE';
-- =============================================================================
