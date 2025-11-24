-- Migration: Increase billing cost column precision for IDR currency
-- Description: Changes cost columns from DECIMAL(10,4) to DECIMAL(15,2) to support IDR values
-- Date: 2025-01-20
-- Note: Run this BEFORE the currency conversion migration (008)

BEGIN;

-- Alter cost columns to support larger IDR values
-- DECIMAL(15,2) supports up to 9,999,999,999,999.99 (enough for IDR)
ALTER TABLE billing_records 
  ALTER COLUMN compute_cost TYPE DECIMAL(15, 2),
  ALTER COLUMN storage_cost TYPE DECIMAL(15, 2),
  ALTER COLUMN total_cost TYPE DECIMAL(15, 2);

-- Update column comments
COMMENT ON COLUMN billing_records.compute_cost IS 'Cost for compute usage (supports both USD and IDR)';
COMMENT ON COLUMN billing_records.storage_cost IS 'Cost for storage usage (supports both USD and IDR)';
COMMENT ON COLUMN billing_records.total_cost IS 'Total cost for the billing period (supports both USD and IDR)';

COMMIT;

-- Verification query (run this after migration to verify)
-- SELECT column_name, data_type, numeric_precision, numeric_scale
-- FROM information_schema.columns
-- WHERE table_name = 'billing_records' 
--   AND column_name IN ('compute_cost', 'storage_cost', 'total_cost');
