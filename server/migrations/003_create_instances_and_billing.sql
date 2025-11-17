-- Migration: Create instances and billing_records tables
-- Description: Creates tables for storing cloud desktop instances and billing records
-- Requirements: 3.1, 3.2, 3.3, 3.4, 3.5

-- Create instances table
CREATE TABLE IF NOT EXISTS instances (
  id VARCHAR(50) PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  image_id VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('PROVISIONING', 'RUNNING', 'STOPPED', 'DELETED', 'ERROR')),
  cpu_cores INTEGER NOT NULL CHECK (cpu_cores > 0),
  ram_gb INTEGER NOT NULL CHECK (ram_gb > 0),
  storage_gb INTEGER NOT NULL CHECK (storage_gb > 0),
  gpu VARCHAR(20) NOT NULL DEFAULT 'NONE',
  region VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_email) REFERENCES approved_users(email) ON DELETE CASCADE
);

-- Create indexes for instances table
CREATE INDEX IF NOT EXISTS idx_instances_user_email ON instances(user_email);
CREATE INDEX IF NOT EXISTS idx_instances_status ON instances(status);
CREATE INDEX IF NOT EXISTS idx_instances_created_at ON instances(created_at);

-- Add comments to instances table
COMMENT ON TABLE instances IS 'Stores cloud desktop instance configurations and states';
COMMENT ON COLUMN instances.id IS 'Unique identifier for the instance';
COMMENT ON COLUMN instances.user_email IS 'Email of the user who owns this instance';
COMMENT ON COLUMN instances.name IS 'User-defined name for the instance';
COMMENT ON COLUMN instances.image_id IS 'Operating system image identifier';
COMMENT ON COLUMN instances.status IS 'Current operational status of the instance';
COMMENT ON COLUMN instances.cpu_cores IS 'Number of CPU cores allocated';
COMMENT ON COLUMN instances.ram_gb IS 'Amount of RAM in gigabytes';
COMMENT ON COLUMN instances.storage_gb IS 'Amount of storage in gigabytes';
COMMENT ON COLUMN instances.gpu IS 'GPU type allocated (NONE, T4, A10G, A100)';
COMMENT ON COLUMN instances.region IS 'Cloud region where instance is deployed';
COMMENT ON COLUMN instances.created_at IS 'Timestamp when instance was created';
COMMENT ON COLUMN instances.updated_at IS 'Timestamp when instance was last updated';

-- Create billing_records table
CREATE TABLE IF NOT EXISTS billing_records (
  id SERIAL PRIMARY KEY,
  instance_id VARCHAR(50) NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  compute_hours DECIMAL(10, 2) NOT NULL DEFAULT 0,
  storage_gb_hours DECIMAL(10, 2) NOT NULL DEFAULT 0,
  compute_cost DECIMAL(10, 4) NOT NULL DEFAULT 0,
  storage_cost DECIMAL(10, 4) NOT NULL DEFAULT 0,
  total_cost DECIMAL(10, 4) NOT NULL DEFAULT 0,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (instance_id) REFERENCES instances(id) ON DELETE CASCADE,
  FOREIGN KEY (user_email) REFERENCES approved_users(email) ON DELETE CASCADE
);

-- Create indexes for billing_records table
CREATE INDEX IF NOT EXISTS idx_billing_user_email ON billing_records(user_email);
CREATE INDEX IF NOT EXISTS idx_billing_instance_id ON billing_records(instance_id);
CREATE INDEX IF NOT EXISTS idx_billing_period ON billing_records(period_start, period_end);

-- Add comments to billing_records table
COMMENT ON TABLE billing_records IS 'Stores billing records for instance usage';
COMMENT ON COLUMN billing_records.id IS 'Unique identifier for the billing record';
COMMENT ON COLUMN billing_records.instance_id IS 'Reference to the instance being billed';
COMMENT ON COLUMN billing_records.user_email IS 'Email of the user being billed';
COMMENT ON COLUMN billing_records.compute_hours IS 'Total compute hours in the billing period';
COMMENT ON COLUMN billing_records.storage_gb_hours IS 'Total storage GB-hours in the billing period';
COMMENT ON COLUMN billing_records.compute_cost IS 'Cost for compute usage';
COMMENT ON COLUMN billing_records.storage_cost IS 'Cost for storage usage';
COMMENT ON COLUMN billing_records.total_cost IS 'Total cost for the billing period';
COMMENT ON COLUMN billing_records.period_start IS 'Start of the billing period';
COMMENT ON COLUMN billing_records.period_end IS 'End of the billing period';
COMMENT ON COLUMN billing_records.created_at IS 'Timestamp when billing record was created';
