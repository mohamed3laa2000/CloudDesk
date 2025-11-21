-- Migration: Create passkeys table
-- Description: Creates the passkeys table for storing WebAuthn passkey credentials
-- Requirements: 9.1, 9.2

CREATE TABLE IF NOT EXISTS passkeys (
  id VARCHAR(255) PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter BIGINT NOT NULL DEFAULT 0,
  aaguid VARCHAR(36),
  transports TEXT[],
  authenticator_type VARCHAR(20) NOT NULL CHECK (authenticator_type IN ('platform', 'cross-platform')),
  friendly_name VARCHAR(100),
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_email) REFERENCES approved_users(email) ON DELETE CASCADE
);

-- Create indexes for query performance
CREATE INDEX IF NOT EXISTS idx_passkeys_user_email ON passkeys(user_email);
CREATE INDEX IF NOT EXISTS idx_passkeys_credential_id ON passkeys(credential_id);

-- Add comments to passkeys table
COMMENT ON TABLE passkeys IS 'Stores WebAuthn passkey credentials for passwordless authentication';
COMMENT ON COLUMN passkeys.id IS 'Unique identifier for the passkey record';
COMMENT ON COLUMN passkeys.user_email IS 'Email of the user who owns this passkey';
COMMENT ON COLUMN passkeys.credential_id IS 'WebAuthn credential ID (base64url encoded)';
COMMENT ON COLUMN passkeys.public_key IS 'Public key for credential verification (base64url encoded)';
COMMENT ON COLUMN passkeys.counter IS 'Signature counter for replay attack prevention';
COMMENT ON COLUMN passkeys.aaguid IS 'Authenticator Attestation GUID';
COMMENT ON COLUMN passkeys.transports IS 'Array of supported transport types (usb, nfc, ble, internal)';
COMMENT ON COLUMN passkeys.authenticator_type IS 'Type of authenticator: platform or cross-platform';
COMMENT ON COLUMN passkeys.friendly_name IS 'User-defined name for the passkey';
COMMENT ON COLUMN passkeys.last_used_at IS 'Timestamp when passkey was last used for authentication';
COMMENT ON COLUMN passkeys.created_at IS 'Timestamp when passkey was enrolled';
COMMENT ON COLUMN passkeys.updated_at IS 'Timestamp when passkey record was last updated';
