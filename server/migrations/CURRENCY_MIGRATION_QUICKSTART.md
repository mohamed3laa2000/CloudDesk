# Currency Migration Quick Start

## TL;DR - Run This

```bash
# 1. Backup database (IMPORTANT!)
pg_dump -U postgres clouddesk > backup_$(date +%Y%m%d).sql

# 2. Run migration
cd server
node migrations/runCurrencyMigration.js

# 3. Verify results
node migrations/verifyCurrencyMigration.js

# 4. Test application
npm run dev
```

## What This Does

Converts all billing records from USD to IDR:
- **Conversion Rate:** 1 USD = 16,600 IDR
- **Affected Table:** `billing_records`
- **Affected Columns:** `compute_cost`, `storage_cost`, `total_cost`

## Before Running

✅ Backup your database  
✅ Check you have PostgreSQL credentials in `.env`  
✅ Ensure no active billing processes are running  

## After Running

✅ Verify all costs show IDR (Rp X.XXX format)  
✅ Check Dashboard shows IDR  
✅ Check Usage page shows IDR  
✅ Check Create Instance page shows IDR  

## If Something Goes Wrong

```bash
# Rollback using backup
psql -U postgres -d clouddesk < backup_YYYYMMDD.sql

# Or use automatic backup table
psql -U postgres -d clouddesk
DROP TABLE billing_records;
ALTER TABLE billing_records_backup_TIMESTAMP RENAME TO billing_records;
DELETE FROM migration_log WHERE migration_name = '008_convert_usd_to_idr';
```

## Need Help?

See [CURRENCY_MIGRATION_GUIDE.md](./CURRENCY_MIGRATION_GUIDE.md) for:
- Detailed instructions
- Troubleshooting guide
- Rollback procedures
- Verification checklist

## Files Created

- `008_convert_usd_to_idr.sql` - SQL migration script
- `runCurrencyMigration.js` - Interactive migration runner
- `verifyCurrencyMigration.js` - Verification script
- `CURRENCY_MIGRATION_GUIDE.md` - Complete documentation
- `CURRENCY_MIGRATION_QUICKSTART.md` - This file

## Safety Features

✅ Automatic backup before migration  
✅ Dry run preview  
✅ User confirmation required  
✅ Idempotent (safe to run multiple times)  
✅ Rollback instructions provided  
✅ Comprehensive verification  

## Expected Results

**Before:**
```
Total Cost: $23.45
Compute: $20.00
Storage: $3.45
```

**After:**
```
Total Cost: Rp 389.270
Compute: Rp 332.000
Storage: Rp 57.270
```
