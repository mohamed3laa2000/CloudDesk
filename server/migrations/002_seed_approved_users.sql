-- Seed: Insert sample approved email addresses
-- Description: Inserts sample approved user emails for testing
-- Requirements: 8.3

-- Insert sample approved users
-- Using INSERT ... ON CONFLICT to make this script idempotent
INSERT INTO approved_users (email, name, created_at) VALUES
  ('admin@clouddesk.com', 'Admin User', CURRENT_TIMESTAMP),
  ('test@clouddesk.com', 'Test User', CURRENT_TIMESTAMP),
  ('demo@clouddesk.com', 'Demo User', CURRENT_TIMESTAMP),
  ('student@student.ub.ac.id', 'UB Student', CURRENT_TIMESTAMP),
  ('developer@clouddesk.com', 'Developer User', CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- Display inserted users
SELECT email, name, created_at FROM approved_users ORDER BY created_at DESC;
