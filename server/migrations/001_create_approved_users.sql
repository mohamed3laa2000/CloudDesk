-- Migration: Create approved_users table
-- Description: Creates the approved_users table to store authorized user emails
-- Requirements: 8.1, 8.2, 8.4

CREATE TABLE IF NOT EXISTS approved_users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

-- Create index on email column for query performance
CREATE INDEX IF NOT EXISTS idx_email ON approved_users(email);

-- Add comment to table
COMMENT ON TABLE approved_users IS 'Stores approved user email addresses for authentication authorization';
COMMENT ON COLUMN approved_users.email IS 'Unique email address of approved user';
COMMENT ON COLUMN approved_users.name IS 'Display name of the user';
COMMENT ON COLUMN approved_users.created_at IS 'Timestamp when user was added to approved list';
COMMENT ON COLUMN approved_users.last_login IS 'Timestamp of user last successful login';
