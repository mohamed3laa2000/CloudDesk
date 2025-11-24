# Database Migrations

This directory contains SQL migration files for the CloudDesk database schema.

## Migration Files

### 001_create_approved_users.sql
Creates the `approved_users` table with the following structure:
- `id` - Serial primary key
- `email` - Unique email address (VARCHAR 255, NOT NULL)
- `name` - User display name (VARCHAR 255)
- `created_at` - Timestamp when user was added (default: CURRENT_TIMESTAMP)
- `last_login` - Timestamp of last successful login

Also creates an index on the `email` column for query performance.

### 002_seed_approved_users.sql
Inserts sample approved email addresses for testing:
- admin@clouddesk.com
- test@clouddesk.com
- demo@clouddesk.com
- student@student.ub.ac.id
- developer@clouddesk.com

Uses `ON CONFLICT DO NOTHING` to make the seed script idempotent.

### 003_create_instances_and_billing.sql
Creates the `instances` and `billing_records` tables for storing cloud desktop instances and billing data:

**instances table:**
- `id` - Unique instance identifier (VARCHAR 50, PRIMARY KEY)
- `user_email` - Owner's email (VARCHAR 255, NOT NULL, FOREIGN KEY)
- `name` - User-defined instance name (VARCHAR 255, NOT NULL)
- `image_id` - Operating system image identifier (VARCHAR 50, NOT NULL)
- `status` - Instance status: PROVISIONING, RUNNING, STOPPED, DELETED, ERROR (VARCHAR 20, NOT NULL)
- `cpu_cores` - Number of CPU cores (INTEGER, NOT NULL, > 0)
- `ram_gb` - RAM in gigabytes (INTEGER, NOT NULL, > 0)
- `storage_gb` - Storage in gigabytes (INTEGER, NOT NULL, > 0)
- `gpu` - GPU type: NONE, T4, A10G, A100 (VARCHAR 20, DEFAULT 'NONE')
- `region` - Cloud region (VARCHAR 50, NOT NULL)
- `created_at` - Creation timestamp (TIMESTAMP WITH TIME ZONE)
- `updated_at` - Last update timestamp (TIMESTAMP WITH TIME ZONE)

**billing_records table:**
- `id` - Serial primary key
- `instance_id` - Reference to instance (VARCHAR 50, FOREIGN KEY)
- `user_email` - User being billed (VARCHAR 255, FOREIGN KEY)
- `compute_hours` - Total compute hours (DECIMAL 10,2)
- `storage_gb_hours` - Total storage GB-hours (DECIMAL 10,2)
- `compute_cost` - Compute cost (DECIMAL 10,4)
- `storage_cost` - Storage cost (DECIMAL 10,4)
- `total_cost` - Total cost (DECIMAL 10,4)
- `period_start` - Billing period start (TIMESTAMP WITH TIME ZONE)
- `period_end` - Billing period end (TIMESTAMP WITH TIME ZONE)
- `created_at` - Record creation timestamp (TIMESTAMP WITH TIME ZONE)

Also creates indexes on user_email, status, created_at for instances, and user_email, instance_id, period for billing_records.

### 004_create_user_preferences.sql
Creates the `user_preferences` table for storing user-specific settings and preferences.

### 005_create_passkeys_table.sql
Creates the `passkeys` table for storing WebAuthn passkey credentials:

**passkeys table:**
- `id` - Unique identifier for the passkey record (VARCHAR 255, PRIMARY KEY)
- `user_email` - Owner's email (VARCHAR 255, NOT NULL, FOREIGN KEY)
- `credential_id` - WebAuthn credential ID (TEXT, NOT NULL, UNIQUE)
- `public_key` - Public key for credential verification (TEXT, NOT NULL)
- `counter` - Signature counter for replay attack prevention (BIGINT, NOT NULL, DEFAULT 0)
- `aaguid` - Authenticator Attestation GUID (VARCHAR 36)
- `transports` - Array of supported transport types (TEXT[])
- `authenticator_type` - Type of authenticator: platform or cross-platform (VARCHAR 20, NOT NULL)
- `friendly_name` - User-defined name for the passkey (VARCHAR 100)
- `last_used_at` - Timestamp when passkey was last used (TIMESTAMP WITH TIME ZONE)
- `created_at` - Timestamp when passkey was enrolled (TIMESTAMP WITH TIME ZONE)
- `updated_at` - Timestamp when passkey record was last updated (TIMESTAMP WITH TIME ZONE)

Also creates indexes on user_email and credential_id for query performance.

### 006_create_webauthn_challenges_table.sql
Creates the `webauthn_challenges` table for storing temporary WebAuthn challenges:

**webauthn_challenges table:**
- `id` - Serial primary key (SERIAL, PRIMARY KEY)
- `challenge` - Cryptographically random challenge value (TEXT, NOT NULL, UNIQUE)
- `user_email` - Email of the user associated with this challenge (VARCHAR 255, nullable, FOREIGN KEY)
- `type` - Type of ceremony: registration or authentication (VARCHAR 20, NOT NULL)
- `expires_at` - Timestamp when challenge expires (TIMESTAMP WITH TIME ZONE, NOT NULL)
- `created_at` - Timestamp when challenge was generated (TIMESTAMP WITH TIME ZONE)

Also creates indexes on challenge and expires_at for query performance and challenge validation.

### 007_add_passkey_2fa_enabled.sql
Adds the `passkey_2fa_enabled` column to the `approved_users` table:

**Column added:**
- `passkey_2fa_enabled` - Boolean flag indicating whether passkey 2FA is required after Google login (BOOLEAN, DEFAULT FALSE)

Also adds a comment describing the column's purpose.

### 008_convert_usd_to_idr.sql
Converts all existing billing records from USD to IDR currency:

**Changes:**
- Multiplies all cost fields in `billing_records` by 16,600 (conversion rate: 1 USD = 16,600 IDR)
- Updates table and column comments to indicate IDR currency
- Creates `migration_log` table to track currency migration
- Only converts records with `total_cost < 1000` (assumed to be in USD)

**Affected columns:**
- `compute_cost` - Converted to IDR
- `storage_cost` - Converted to IDR
- `total_cost` - Converted to IDR

See [CURRENCY_MIGRATION_GUIDE.md](./CURRENCY_MIGRATION_GUIDE.md) for detailed migration instructions.

## Running Migrations

### Run All Migrations

Execute all migrations:
```bash
npm run migrate
```

Or run directly:
```bash
node migrations/runMigration.js
```

### Run Passkey Migrations Only

If you only need to set up passkey authentication tables, you can run the passkey-specific migrations:

```bash
npm run migrate:passkey
```

Or run directly:
```bash
node migrations/runPasskeyMigrations.js
```

This will execute the following migrations:
- `005_create_passkeys_table.sql` - Creates the passkeys table for storing WebAuthn credentials
- `006_create_webauthn_challenges_table.sql` - Creates the challenges table for temporary challenge storage
- `007_add_passkey_2fa_enabled.sql` - Adds the 2FA flag to the approved_users table

The script will also verify that all tables and columns were created successfully.

### Test Passkey Migrations

To verify that passkey migrations were applied correctly and test the database schema:

```bash
npm run migrate:test
```

Or run directly:
```bash
node migrations/testPasskeyMigrations.js
```

This test script will:
- Verify all passkey tables exist with correct structure
- Test inserting, querying, updating, and deleting sample data
- Verify foreign key constraints are in place
- Check that the 2FA column exists in approved_users table
- Clean up all test data automatically

### Run Currency Migration

To convert existing billing records from USD to IDR:

```bash
node migrations/runCurrencyMigration.js
```

This interactive script will:
- Show current billing statistics
- Preview records to be converted
- Ask for confirmation
- Create automatic backup
- Convert all USD values to IDR (1 USD = 16,600 IDR)
- Verify migration results
- Provide rollback instructions

**Important:** This migration is idempotent and safe to run multiple times. It will skip records already in IDR.

See [CURRENCY_MIGRATION_GUIDE.md](./CURRENCY_MIGRATION_GUIDE.md) for detailed instructions, troubleshooting, and rollback procedures.

### Verify Currency Migration

To verify that the currency migration was successful:

```bash
node migrations/verifyCurrencyMigration.js
```

This will check:
- Migration log entry exists
- All billing records are in IDR range
- Table metadata updated correctly
- No suspicious values remain

## Running Seeds

Insert sample approved users for testing:
```bash
npm run seed
```

Or run directly:
```bash
node migrations/runSeed.js
```

## Requirements

- PostgreSQL database (Supabase)
- `DATABASE_URL` environment variable configured
- `pg` package installed

## Migration Naming Convention

Migration files should follow the pattern: `XXX_description.sql`
- `XXX` - Three-digit sequential number (001, 002, etc.)
- `description` - Brief description using snake_case

Migrations are executed in alphabetical order.

## Notes

- Migrations use `IF NOT EXISTS` clauses to be idempotent
- SSL is configured for Supabase connections
- Failed migrations will halt execution and display error details
