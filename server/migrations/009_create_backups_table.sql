-- Migration: Create backups table
-- Description: Creates the backups table for storing machine image backup metadata
-- Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 11.1, 11.2, 11.5

CREATE TABLE IF NOT EXISTS backups (
  id VARCHAR(50) PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL,
  instance_id VARCHAR(50),
  name VARCHAR(255) NOT NULL,
  gcp_machine_image_name VARCHAR(255) NOT NULL,
  source_instance_name VARCHAR(255) NOT NULL,
  source_instance_zone VARCHAR(100) NOT NULL,
  storage_bytes BIGINT CHECK (storage_bytes >= 0),
  status VARCHAR(20) NOT NULL CHECK (status IN ('CREATING', 'COMPLETED', 'ERROR', 'DELETED')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_email) REFERENCES approved_users(email) ON DELETE CASCADE,
  FOREIGN KEY (instance_id) REFERENCES instances(id) ON DELETE SET NULL
);

-- Create indexes for query performance
CREATE INDEX IF NOT EXISTS idx_backups_user_email ON backups(user_email);
CREATE INDEX IF NOT EXISTS idx_backups_instance_id ON backups(instance_id);
CREATE INDEX IF NOT EXISTS idx_backups_status ON backups(status);
CREATE INDEX IF NOT EXISTS idx_backups_created_at ON backups(created_at);

-- Add comments to backups table
COMMENT ON TABLE backups IS 'Stores machine image backup metadata for VM instances';
COMMENT ON COLUMN backups.id IS 'Unique identifier for the backup record';
COMMENT ON COLUMN backups.user_email IS 'Email of the user who owns this backup';
COMMENT ON COLUMN backups.instance_id IS 'Reference to the source instance (nullable if instance deleted)';
COMMENT ON COLUMN backups.name IS 'User-defined name for the backup';
COMMENT ON COLUMN backups.gcp_machine_image_name IS 'GCP machine image resource name';
COMMENT ON COLUMN backups.source_instance_name IS 'Name of the source instance at backup time';
COMMENT ON COLUMN backups.source_instance_zone IS 'GCP zone of the source instance';
COMMENT ON COLUMN backups.storage_bytes IS 'Total storage size in bytes';
COMMENT ON COLUMN backups.status IS 'Current status of the backup (CREATING, COMPLETED, ERROR, DELETED)';
COMMENT ON COLUMN backups.error_message IS 'Error message if backup creation failed';
COMMENT ON COLUMN backups.created_at IS 'Timestamp when backup was initiated';
COMMENT ON COLUMN backups.updated_at IS 'Timestamp when backup record was last updated';
