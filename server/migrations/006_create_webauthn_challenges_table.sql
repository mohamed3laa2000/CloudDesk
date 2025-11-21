-- Migration: Create webauthn_challenges table
-- Description: Creates the webauthn_challenges table for storing temporary WebAuthn challenges
-- Requirements: 11.1, 11.5

CREATE TABLE IF NOT EXISTS webauthn_challenges (
  id SERIAL PRIMARY KEY,
  challenge TEXT NOT NULL UNIQUE,
  user_email VARCHAR(255),
  type VARCHAR(20) NOT NULL CHECK (type IN ('registration', 'authentication')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_email) REFERENCES approved_users(email) ON DELETE CASCADE
);

-- Create indexes for query performance
CREATE INDEX IF NOT EXISTS idx_challenges_challenge ON webauthn_challenges(challenge);
CREATE INDEX IF NOT EXISTS idx_challenges_expires_at ON webauthn_challenges(expires_at);

-- Add comments to webauthn_challenges table
COMMENT ON TABLE webauthn_challenges IS 'Stores temporary WebAuthn challenges for registration and authentication ceremonies';
COMMENT ON COLUMN webauthn_challenges.id IS 'Unique identifier for the challenge record';
COMMENT ON COLUMN webauthn_challenges.challenge IS 'Cryptographically random challenge value (base64url encoded)';
COMMENT ON COLUMN webauthn_challenges.user_email IS 'Email of the user associated with this challenge (nullable for authentication)';
COMMENT ON COLUMN webauthn_challenges.type IS 'Type of ceremony: registration or authentication';
COMMENT ON COLUMN webauthn_challenges.expires_at IS 'Timestamp when challenge expires (5 minutes from creation)';
COMMENT ON COLUMN webauthn_challenges.created_at IS 'Timestamp when challenge was generated';
