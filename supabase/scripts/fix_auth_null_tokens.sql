-- Optional fix when login returns "Database error querying schema" / scan error on confirmation_token.
-- Cause: some seeded or SQL-created auth.users rows have NULL in token columns; GoTrue expects ''.
-- Only run in Supabase SQL Editor if logs show that error. Altering auth schema is at your own risk.
-- Reference: https://github.com/supabase/auth/issues/1940

BEGIN;

UPDATE auth.users
SET
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change = COALESCE(email_change, '')
WHERE confirmation_token IS NULL
   OR recovery_token IS NULL
   OR email_change_token_new IS NULL
   OR email_change IS NULL;

COMMIT;
