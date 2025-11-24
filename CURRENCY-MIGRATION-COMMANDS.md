# Currency Migration - Quick Command Reference

## 🚀 Quick Start (3 Commands)

```bash
cd server
npm run migrate:currency:test      # Test first
npm run migrate:currency            # Run migration
npm run migrate:currency:verify     # Verify results
```

## 📋 Available Commands

| Command | What It Does | Safe? |
|---------|--------------|-------|
| `npm run migrate:currency:test` | Tests migration with temporary data | ✅ Yes - No real data changed |
| `npm run migrate:currency` | Converts USD to IDR (1 USD = 16,600 IDR) | ⚠️ Modifies billing_records table |
| `npm run migrate:currency:verify` | Checks migration status and results | ✅ Yes - Read-only |

## 📝 Step-by-Step

### 1. Test First (Always!)
```bash
cd server
npm run migrate:currency:test
```
**Expected output:**
```
✅ Tests Passed: 7
❌ Tests Failed: 0
🎉 All tests passed!
```

### 2. Run Migration
```bash
npm run migrate:currency
```
**What happens:**
1. Shows current statistics
2. Previews changes (first 10 records)
3. Asks: "Proceed with migration? (yes/no):"
4. Creates automatic backup table
5. Converts all USD values to IDR
6. Verifies results
7. Shows rollback instructions

### 3. Verify Results
```bash
npm run migrate:currency:verify
```
**Expected output:**
```
✅ MIGRATION SUCCESSFUL
   All billing records appear to be in IDR
   Table metadata updated correctly
```

## 🔍 What Gets Changed

**Database Table:** `billing_records`

**Columns:**
- `compute_cost` → Multiplied by 16,600
- `storage_cost` → Multiplied by 16,600
- `total_cost` → Multiplied by 16,600

**Example:**
```
Before: $23.45  →  After: Rp 389.270
Before: $100.00 →  After: Rp 1.660.000
```

## ⚙️ Configuration

Database credentials are read from `server/.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=clouddesk
DB_USER=postgres
DB_PASSWORD=your_password
```

## ✅ Safety Features

- ✅ Test mode available (no real data changed)
- ✅ Automatic backup before migration
- ✅ Confirmation prompt required
- ✅ Idempotent (safe to run multiple times)
- ✅ Rollback instructions provided
- ✅ Comprehensive verification

## 🆘 Troubleshooting

### "Migration already applied"
```bash
npm run migrate:currency:verify  # Check current state
```

### "Database connection error"
Check `server/.env` has correct credentials

### Need to rollback?
Check migration output for backup table name:
```sql
DROP TABLE billing_records;
ALTER TABLE billing_records_backup_TIMESTAMP RENAME TO billing_records;
DELETE FROM migration_log WHERE migration_name = '008_convert_usd_to_idr';
```

## 📚 More Information

- [MIGRATION-GUIDE.md](MIGRATION-GUIDE.md) - Complete guide
- [server/migrations/CURRENCY_MIGRATION_GUIDE.md](server/migrations/CURRENCY_MIGRATION_GUIDE.md) - Detailed documentation
- [DATABASE-MIGRATION-SUMMARY.md](DATABASE-MIGRATION-SUMMARY.md) - Technical overview

## 💡 Do I Need This?

**Run migration if:**
- ✅ You have existing billing records in USD
- ✅ You're upgrading from an older version

**Skip migration if:**
- ✅ Fresh installation (no existing data)
- ✅ Already using IDR
- ✅ No billing_records table yet

To check:
```bash
cd server
npm run migrate:currency:verify
```
If it shows "Total Records: 0", you can skip the migration.
