-- Migration: Add passkey_2fa_enabled column to approved_users
-- Description: Adds a boolean column to track whether passkey 2FA is required after Google login
-- Requirements: 5.4

-- Add passkey_2fa_enabled column with default false
ALTER TABLE approved_users 
ADD COLUMN IF NOT EXISTS passkey_2fa_enabled BOOLEAN DEFAULT FALSE;

-- Add comment describing the column
COMMENT ON COLUMN approved_users.passkey_2fa_enabled IS 'Whether passkey 2FA is required after Google login';
