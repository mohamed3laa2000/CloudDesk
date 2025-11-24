# Currency Conversion Summary: USD to IDR

## Conversion Rate
**1 USD = 16,600 IDR**

## Files Modified

### Core Pricing Configuration

#### 1. `src/data/pricing.ts`
- Updated all base pricing from USD to IDR
- `basePerCpuPerHour`: $0.0475 → Rp 788.5
- `basePerRamGbPerHour`: $0.0065 → Rp 107.9
- `basePerStorageGbPerHour`: $0.00014 → Rp 2.324
- GPU pricing converted:
  - T4: $0.35 → Rp 5,810
  - V100: $2.48 → Rp 41,168
  - A10: $1.80 → Rp 29,880
  - A100: $3.67 → Rp 60,922
  - H100: $8.00 → Rp 132,800
  - RTX_4090: $2.80 → Rp 46,480
  - RTX_A6000: $3.20 → Rp 53,120
- Updated `formatCost()` function to display IDR with proper formatting

#### 2. `server/services/dbService.js`
- Updated backend pricing configuration to match frontend
- All pricing values converted to IDR
- Maintains consistency between frontend and backend calculations

### UI Components

#### 3. `src/routes/CreateInstance.tsx`
- Updated GPU options pricing display
- Cost estimate card now shows IDR
- Billing information updated (storage: Rp 1,660/GB/month)
- All currency displays use Indonesian locale formatting

#### 4. `src/routes/Usage.tsx`
- Total estimated cost display converted to IDR
- Average cost per desktop in IDR
- Usage chart cost labels in IDR
- Table columns (Compute Cost, Storage Cost, Total Cost) in IDR
- Mobile card view costs in IDR
- Document title updated to show IDR

#### 5. `src/routes/Dashboard.tsx`
- Estimated monthly cost calculation updated (Rp 705,500 per instance)
- Dashboard metric card displays IDR

#### 6. `src/routes/InstanceDetail.tsx`
- Estimated cost display in IDR
- Hourly rate display in IDR

#### 7. `src/components/ui/LiveCostCounter.tsx`
- Real-time cost counter displays IDR
- Uses Indonesian locale formatting

### Marketing & Documentation Pages

#### 8. `src/routes/Pricing.tsx`
- Student plan: $0.25/hr → Rp 4,150/hr (~Rp 332,000/month)
- Professional plan: $0.50/hr → Rp 8,300/hr (~Rp 664,000/month)
- GPU add-ons:
  - T4: +$0.50/hr → +Rp 5,810/hr
  - A100: +$2.00/hr → +Rp 60,922/hr
- Storage:
  - Additional: $0.10/GB/month → Rp 1,660/GB/month
  - Backup: $0.05/GB/month → Rp 830/GB/month

#### 9. `src/routes/Documentation.tsx`
- Compute pricing: $0.10-$2.50/hr → Rp 1,660-Rp 41,500/hr
- Storage: $0.10/GB/month → Rp 1,660/GB/month
- GPU: $0.50-$3.00/hr → Rp 5,810-Rp 132,800/hr
- Snapshots: $0.05/GB/month → Rp 830/GB/month

#### 10. `src/routes/UseCases.tsx`
- Development preset: $0.15/hr → Rp 2,490/hr
- Engineering preset: $1.20/hr → Rp 19,920/hr
- Data Science preset: $2.50/hr → Rp 41,500/hr
- Storage pricing: $0.10/GB/month → Rp 1,660/GB/month

### Demo Data

#### 11. `src/data/usage.ts`
- Updated demo daily costs from USD to IDR
- Adjusted cost calculation formulas
- Average hourly rate: $0.42 → Rp 6,972

## Display Format

All IDR amounts are displayed using Indonesian locale formatting:
- Format: `Rp X.XXX` (with thousand separators using periods)
- No decimal places for whole numbers
- Example: `Rp 788.5` displays as "Rp 789"
- Example: `Rp 60922` displays as "Rp 60.922"

## Testing Recommendations

1. **Verify pricing calculations** - Ensure all cost calculations are accurate
2. **Check UI displays** - Confirm all currency displays show proper IDR formatting
3. **Test backend API** - Verify usage summary endpoint returns correct IDR values
4. **Cross-check consistency** - Ensure frontend and backend pricing match
5. **Review demo data** - Confirm demo instances show realistic IDR costs

## Database Migration

For existing databases with USD billing records, a migration script is provided:

### Migration Files

1. **SQL Script:** `server/migrations/008_convert_usd_to_idr.sql`
2. **Interactive Runner:** `server/migrations/runCurrencyMigration.js`
3. **Verification:** `server/migrations/verifyCurrencyMigration.js`
4. **Documentation:** `server/migrations/CURRENCY_MIGRATION_GUIDE.md`
5. **Quick Start:** `server/migrations/CURRENCY_MIGRATION_QUICKSTART.md`

### Quick Migration

```bash
# 1. Backup database
pg_dump -U postgres clouddesk > backup_$(date +%Y%m%d).sql

# 2. Run migration
cd server
node migrations/runCurrencyMigration.js

# 3. Verify
node migrations/verifyCurrencyMigration.js
```

### What Gets Migrated

The migration converts all `billing_records` table data:
- `compute_cost` × 16,600
- `storage_cost` × 16,600
- `total_cost` × 16,600

### Safety Features

- ✅ Automatic backup creation
- ✅ Dry run preview
- ✅ User confirmation required
- ✅ Idempotent (safe to run multiple times)
- ✅ Rollback instructions provided
- ✅ Comprehensive verification

See [server/migrations/CURRENCY_MIGRATION_GUIDE.md](server/migrations/CURRENCY_MIGRATION_GUIDE.md) for complete documentation.

## Notes

- All pricing maintains the same relative proportions as USD pricing
- Storage costs: Rp 1,660/GB/month (equivalent to $0.10/GB/month)
- The conversion preserves the original pricing structure and markup rates
- Indonesian locale formatting (`id-ID`) is used throughout for proper number display
- Database migration is optional for new installations (no existing billing data)
