# Currency Migration Guide - Quick Start

## Simple 3-Step Process

### Step 1: Test the Migration (Safe - No Real Data)
```bash
cd server
npm run migrate:currency:test
```
This runs a safe test with temporary data to ensure everything works.

### Step 2: Run the Migration
```bash
npm run migrate:currency
```
This will:
- Show current statistics
- Preview changes
- Ask for confirmation
- Create automatic backup
- Convert USD to IDR (1 USD = 16,600 IDR)
- Verify results

### Step 3: Verify Results
```bash
npm run migrate:currency:verify
```
Check that everything was converted correctly.

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run migrate:currency:test` | Test migration safely (no real data changed) |
| `npm run migrate:currency` | Run actual migration (converts USD to IDR) |
| `npm run migrate:currency:verify` | Verify migration results |

## Complete Example

```bash
# Navigate to server directory
cd server

# Step 1: Test first (safe, no real data changed)
npm run migrate:currency:test

# Step 2: If test passes, run the migration
npm run migrate:currency

# Step 3: Verify everything worked
npm run migrate:currency:verify

# Step 4: Go back and start your application
cd ..
npm run dev
```

## What Gets Changed

The migration converts all billing records in your database:

**Before:**
```
Compute Cost: $20.00
Storage Cost: $3.45
Total Cost: $23.45
```

**After:**
```
Compute Cost: Rp 332.000
Storage Cost: Rp 57.270
Total Cost: Rp 389.270
```

## Database Connection

The scripts automatically read database credentials from `server/.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=clouddesk
DB_USER=postgres
DB_PASSWORD=your_password
```

Make sure your `server/.env` file has the correct database settings.

## If You Don't Have Existing Data

If you're starting fresh with no billing records in your database, **you don't need to run the migration at all!** The application is already configured to use IDR for all new records.

To check if you have existing data:
```bash
cd server
npm run migrate:currency:verify
```

If it shows "Total Records: 0", you can skip the migration.

## What You'll See

### Test Output
```
╔════════════════════════════════════════════════════════╗
║         Currency Migration Test Suite                 ║
╚════════════════════════════════════════════════════════╝

1️⃣  Creating test billing records...
✅ Created 3 test billing records in USD

2️⃣  Verifying test records are in USD range...
✅ All test records are in USD range (< 1000)

...

✅ Tests Passed: 7
❌ Tests Failed: 0
📊 Total Tests: 7

🎉 All tests passed! Currency migration is working correctly.
```

### Migration Output
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
...

⚠️  Proceed with migration? (yes/no): yes

💾 Creating backup of billing_records table...
✅ Backup created: billing_records_backup_2025-01-20T10-30-45

🔄 Running currency conversion migration...
✅ Updated 42 billing records
✅ Migration committed successfully

✅ Migration completed successfully!
```

## Safety Features

✅ **Test First** - Safe test with temporary data  
✅ **Confirmation Required** - Asks before making changes  
✅ **Automatic Backup** - Creates backup table automatically  
✅ **Idempotent** - Safe to run multiple times  
✅ **Verification** - Checks results after migration  

## Troubleshooting

### "Database connection error"
Check your `server/.env` file has correct database credentials.

### "Migration already applied"
The migration has already been run. Run `npm run migrate:currency:verify` to check the current state.

### Need to Rollback?
The migration creates an automatic backup table. Check the migration output for the backup table name and rollback instructions.

## Detailed Documentation

For more information, see:
- `server/migrations/CURRENCY_MIGRATION_GUIDE.md` - Complete guide with troubleshooting
- `server/migrations/CURRENCY_MIGRATION_QUICKSTART.md` - Quick reference
- `DATABASE-MIGRATION-SUMMARY.md` - Technical overview

## After Migration

Once migration is complete:

1. **Test your application:**
   ```bash
   cd ..
   npm run dev
   ```

2. **Check these pages:**
   - Dashboard - Verify estimated monthly cost shows IDR
   - Usage - Check all cost columns show IDR
   - Create Instance - Verify cost estimator shows IDR
   - Instance Detail - Check estimated cost shows IDR

3. **Verify API responses:**
   All costs should be in IDR (Rp X.XXX format)

## Support

If you encounter issues:
1. Run `npm run migrate:currency:test` to check if tests pass
2. Run `npm run migrate:currency:verify` to check current state
3. Check `server/.env` has correct database credentials
4. Review detailed documentation in `server/migrations/`
