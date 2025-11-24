# Currency Migration Guide: USD to IDR

## Overview

This guide covers the migration of all billing data from US Dollars (USD) to Indonesian Rupiah (IDR) with a conversion rate of **1 USD = 16,600 IDR**.

## Migration Files

### 1. SQL Migration Script
**File:** `008_convert_usd_to_idr.sql`

Direct SQL migration that can be run manually or through a migration tool.

```bash
psql -U postgres -d clouddesk -f server/migrations/008_convert_usd_to_idr.sql
```

### 2. JavaScript Migration Runner
**File:** `runCurrencyMigration.js`

Interactive migration script with safety features:
- Dry run preview
- Automatic backup creation
- User confirmation prompt
- Rollback instructions
- Verification checks

```bash
node server/migrations/runCurrencyMigration.js
```

### 3. Verification Script
**File:** `verifyCurrencyMigration.js`

Comprehensive verification of migration results:
- Migration status check
- Statistical analysis
- Suspicious value detection
- Metadata verification
- Sample data review

```bash
node server/migrations/verifyCurrencyMigration.js
```

## Migration Process

### Step 1: Pre-Migration Checks

1. **Backup your database:**
   ```bash
   pg_dump -U postgres clouddesk > clouddesk_backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Check current data:**
   ```bash
   node server/migrations/verifyCurrencyMigration.js
   ```

3. **Review billing records:**
   ```sql
   SELECT COUNT(*), MIN(total_cost), MAX(total_cost), AVG(total_cost)
   FROM billing_records;
   ```

### Step 2: Run Migration

**Option A: Interactive JavaScript Runner (Recommended)**

```bash
cd server
node migrations/runCurrencyMigration.js
```

The script will:
1. Show current statistics
2. Preview changes (first 10 records)
3. Ask for confirmation
4. Create automatic backup
5. Run migration
6. Verify results
7. Provide rollback instructions

**Option B: Direct SQL Migration**

```bash
psql -U postgres -d clouddesk -f server/migrations/008_convert_usd_to_idr.sql
```

### Step 3: Verify Migration

```bash
node server/migrations/verifyCurrencyMigration.js
```

Expected output:
- ✅ Migration found in log
- ✅ All records >= 1000 (IDR range)
- ✅ Table metadata updated with "IDR"
- ✅ No suspicious values

### Step 4: Test Application

1. **Start the server:**
   ```bash
   npm run dev
   ```

2. **Check the following pages:**
   - Dashboard: Verify estimated monthly cost displays in IDR
   - Usage: Check all cost columns show IDR with proper formatting
   - Create Instance: Verify cost estimator shows IDR
   - Instance Detail: Check estimated cost displays in IDR

3. **Verify API responses:**
   ```bash
   curl http://localhost:3001/api/usage/summary
   ```

## What Gets Converted

### Database Tables

**billing_records table:**
- `compute_cost`: Multiplied by 16,600
- `storage_cost`: Multiplied by 16,600
- `total_cost`: Multiplied by 16,600

**Table metadata:**
- Table comment updated to indicate IDR currency
- Column comments updated to specify IDR

### Application Code

The following files were already updated to use IDR:
- `src/data/pricing.ts` - Base pricing configuration
- `server/services/dbService.js` - Backend pricing
- All UI components displaying currency
- All documentation and marketing pages

## Conversion Logic

The migration uses a simple threshold to identify USD records:

```sql
WHERE total_cost < 1000
```

**Rationale:**
- USD costs are typically < $100 (< 100)
- IDR costs are typically > Rp 10,000 (> 10000)
- Threshold of 1000 safely separates the two

**Edge cases:**
- Very small charges (< Rp 1000) might be flagged as USD
- These are rare and can be manually reviewed

## Rollback Procedure

If you need to rollback the migration:

### Option 1: Using Backup Table

The migration script creates an automatic backup table named `billing_records_backup_TIMESTAMP`.

```sql
-- 1. Drop current table
DROP TABLE billing_records;

-- 2. Rename backup to original
ALTER TABLE billing_records_backup_TIMESTAMP RENAME TO billing_records;

-- 3. Remove migration log entry
DELETE FROM migration_log WHERE migration_name = '008_convert_usd_to_idr';
```

### Option 2: Using Database Backup

```bash
# Restore from backup file
psql -U postgres -d clouddesk < clouddesk_backup_TIMESTAMP.sql
```

### Option 3: Manual Conversion Back to USD

```sql
BEGIN;

UPDATE billing_records
SET 
  compute_cost = compute_cost / 16600,
  storage_cost = storage_cost / 16600,
  total_cost = total_cost / 16600
WHERE total_cost >= 1000;

DELETE FROM migration_log WHERE migration_name = '008_convert_usd_to_idr';

COMMIT;
```

## Troubleshooting

### Issue: Migration already applied

**Error:** "Migration has already been applied!"

**Solution:**
```sql
-- Check migration log
SELECT * FROM migration_log WHERE migration_name = '008_convert_usd_to_idr';

-- If you need to re-run, delete the log entry
DELETE FROM migration_log WHERE migration_name = '008_convert_usd_to_idr';
```

### Issue: Some records still show USD values

**Symptom:** Records with `total_cost < 1000` after migration

**Solution:**
```sql
-- Check these records
SELECT * FROM billing_records WHERE total_cost < 1000;

-- If they're actually USD, convert them
UPDATE billing_records
SET 
  compute_cost = compute_cost * 16600,
  storage_cost = storage_cost * 16600,
  total_cost = total_cost * 16600
WHERE total_cost < 1000;
```

### Issue: Database connection error

**Error:** "Connection refused" or "Authentication failed"

**Solution:**
1. Check `.env` file has correct database credentials
2. Verify PostgreSQL is running: `pg_isready`
3. Test connection: `psql -U postgres -d clouddesk`

### Issue: Permission denied

**Error:** "Permission denied for table billing_records"

**Solution:**
```sql
-- Grant necessary permissions
GRANT ALL PRIVILEGES ON TABLE billing_records TO your_user;
GRANT ALL PRIVILEGES ON TABLE migration_log TO your_user;
```

## Verification Checklist

After migration, verify:

- [ ] Migration log entry exists
- [ ] All `total_cost` values >= 1000 (or 0)
- [ ] Table comment mentions "IDR"
- [ ] Column comments mention "IDR"
- [ ] Backup table created
- [ ] Application displays IDR correctly
- [ ] API returns IDR values
- [ ] No console errors in browser
- [ ] Usage page shows IDR
- [ ] Dashboard shows IDR
- [ ] Create instance page shows IDR

## Support

If you encounter issues:

1. **Check logs:** Review migration output carefully
2. **Run verification:** `node server/migrations/verifyCurrencyMigration.js`
3. **Check database:** Query `billing_records` and `migration_log` tables
4. **Review backup:** Ensure backup table exists before making changes
5. **Test rollback:** In a development environment first

## Notes

- **Idempotent:** Migration can be run multiple times safely (checks if already applied)
- **Safe:** Creates automatic backup before making changes
- **Reversible:** Provides clear rollback instructions
- **Verified:** Includes comprehensive verification script
- **Logged:** Records migration in `migration_log` table

## Example Output

### Successful Migration

```
╔════════════════════════════════════════════════════════╗
║   Currency Migration: USD → IDR (1 USD = 16,600 IDR)  ║
╚════════════════════════════════════════════════════════╝

📊 Current billing records statistics:
┌─────────────────┬────────┐
│ Total Records   │ 42     │
│ Min Cost        │ $0.15  │
│ Max Cost        │ $125.50│
│ Avg Cost        │ $23.45 │
└─────────────────┴────────┘

📊 PREVIEW: Records that will be converted
Sample of records to be converted (showing first 10):
┌────┬──────────────────────┬──────────────┬─────────────────┬────────────┐
│ ID │ User                 │ Current Total│ New Total       │ Period     │
├────┼──────────────────────┼──────────────┼─────────────────┼────────────┤
│ 1  │ user@example.com...  │ $23.45       │ Rp 389,270      │ 2025-01-15 │
│ 2  │ admin@example.com... │ $45.20       │ Rp 750,320      │ 2025-01-14 │
└────┴──────────────────────┴──────────────┴─────────────────┴────────────┘

📝 Total records to convert: 42

⚠️  Proceed with migration? (yes/no): yes

💾 Creating backup of billing_records table...
✅ Backup created: billing_records_backup_2025-01-20T10-30-45 (42 records)

🔄 Running currency conversion migration...
✅ Updated 42 billing records
✅ Migration committed successfully

🔍 Verifying migration results...
📊 Post-migration statistics:
┌─────────────────┬─────────────────┐
│ Total Records   │ 42              │
│ Min Cost        │ Rp 2,490        │
│ Max Cost        │ Rp 2,083,300    │
│ Avg Cost        │ Rp 389,270      │
│ Total Sum       │ Rp 16,349,340   │
└─────────────────┴─────────────────┘

✅ All records successfully converted to IDR

✅ Migration completed successfully!
📦 Backup table: billing_records_backup_2025-01-20T10-30-45
```

## Related Documentation

- [CURRENCY-CONVERSION-SUMMARY.md](../../CURRENCY-CONVERSION-SUMMARY.md) - Overview of all currency changes
- [README.md](./README.md) - General migration guide
- [PASSKEY_MIGRATION_GUIDE.md](./PASSKEY_MIGRATION_GUIDE.md) - Passkey migration reference
