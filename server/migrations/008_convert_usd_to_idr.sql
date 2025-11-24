-- Migration: Convert USD to IDR currency
-- Description: Converts all existing billing records from USD to IDR (1 USD = 16,600 IDR)
-- Date: 2025-01-20
-- Conversion Rate: 1 USD = 16,600 IDR

-- Note: This migration updates all monetary values in the billing_records table
-- to reflect Indonesian Rupiah (IDR) instead of US Dollars (USD)

BEGIN;

-- Add a migration tracking comment
COMMENT ON TABLE billing_records IS 'Stores billing records for instance usage (Currency: IDR as of 2025-01-20)';

-- Update all existing billing records to convert USD to IDR
-- Multiply all cost fields by 16,600
UPDATE billing_records
SET 
  compute_cost = compute_cost * 16600,
  storage_cost = storage_cost * 16600,
  total_cost = total_cost * 16600
WHERE 
  -- Only update records that haven't been converted yet
  -- (assuming costs less than 1000 are in USD, costs >= 1000 are already in IDR)
  total_cost < 1000;

-- Update column comments to reflect IDR currency
COMMENT ON COLUMN billing_records.compute_cost IS 'Cost for compute usage (IDR)';
COMMENT ON COLUMN billing_records.storage_cost IS 'Cost for storage usage (IDR)';
COMMENT ON COLUMN billing_records.total_cost IS 'Total cost for the billing period (IDR)';

-- Create a migration log table if it doesn't exist
CREATE TABLE IF NOT EXISTS migration_log (
  id SERIAL PRIMARY KEY,
  migration_name VARCHAR(255) NOT NULL,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  description TEXT,
  conversion_rate DECIMAL(10, 2)
);

-- Log this migration
INSERT INTO migration_log (migration_name, description, conversion_rate)
VALUES (
  '008_convert_usd_to_idr',
  'Converted all billing records from USD to IDR. Conversion rate: 1 USD = 16,600 IDR',
  16600.00
);

COMMIT;

-- Verification query (run this after migration to verify)
-- SELECT 
--   COUNT(*) as total_records,
--   MIN(total_cost) as min_cost,
--   MAX(total_cost) as max_cost,
--   AVG(total_cost) as avg_cost
-- FROM billing_records;
