-- Migration: Create user_preferences table
-- Description: Creates table for storing user customization preferences
-- Requirements: 3.1, 3.2, 3.3, 8.1, 8.2

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id SERIAL PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL UNIQUE,
  theme VARCHAR(20) NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
  accent_color VARCHAR(7) NOT NULL DEFAULT '#14b8a6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_email) REFERENCES approved_users(email) ON DELETE CASCADE
);

-- Create index for fast lookups by user email
CREATE INDEX IF NOT EXISTS idx_user_preferences_email ON user_preferences(user_email);

-- Add comments to user_preferences table
COMMENT ON TABLE user_preferences IS 'Stores user customization preferences for theme and appearance';
COMMENT ON COLUMN user_preferences.id IS 'Unique identifier for the preference record';
COMMENT ON COLUMN user_preferences.user_email IS 'Email of the user (references approved_users)';
COMMENT ON COLUMN user_preferences.theme IS 'Theme preference: light, dark, or system';
COMMENT ON COLUMN user_preferences.accent_color IS 'Hex color code for accent color customization';
COMMENT ON COLUMN user_preferences.created_at IS 'Timestamp when preferences were first created';
COMMENT ON COLUMN user_preferences.updated_at IS 'Timestamp when preferences were last updated';

-- Add updated_at column to approved_users if it doesn't exist
ALTER TABLE approved_users 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Add comment for new column
COMMENT ON COLUMN approved_users.updated_at IS 'Timestamp when user profile was last updated';

-- Create trigger function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to user_preferences table
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to approved_users table
DROP TRIGGER IF EXISTS update_approved_users_updated_at ON approved_users;
CREATE TRIGGER update_approved_users_updated_at
  BEFORE UPDATE ON approved_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
