# Passkey Migration Guide

This guide explains how to set up and verify the passkey authentication database schema for CloudDesk.

## Overview

The passkey authentication feature requires three database migrations:

1. **005_create_passkeys_table.sql** - Creates the `passkeys` table for storing WebAuthn credentials
2. **006_create_webauthn_challenges_table.sql** - Creates the `webauthn_challenges` table for temporary challenge storage
3. **007_add_passkey_2fa_enabled.sql** - Adds the `passkey_2fa_enabled` column to the `approved_users` table

## Quick Start

### 1. Run Passkey Migrations

```bash
cd server
npm run migrate:passkey
```

This will:
- Execute all three passkey-related migrations in order
- Verify that all tables and columns were created successfully
- Display confirmation messages for each step

Expected output:
```
Starting passkey database migrations...

Found 3 passkey migration(s) to run

Running migration: 005_create_passkeys_table.sql
✓ Migration 005_create_passkeys_table.sql completed successfully
Running migration: 006_create_webauthn_challenges_table.sql
✓ Migration 006_create_webauthn_challenges_table.sql completed successfully
Running migration: 007_add_passkey_2fa_enabled.sql
✓ Migration 007_add_passkey_2fa_enabled.sql completed successfully

--- Verifying Migrations ---

✓ passkeys table verified
✓ webauthn_challenges table verified
✓ passkey_2fa_enabled column verified

✓ All passkey migrations completed and verified successfully

Passkey authentication is now ready to use!
```

### 2. Test the Migrations (Optional but Recommended)

```bash
npm run migrate:test
```

This will:
- Verify all tables exist with correct structure
- Test CRUD operations on each table
- Verify foreign key constraints
- Clean up test data automatically

Expected output:
```
Starting passkey migration tests...

--- Testing passkeys table ---
✓ passkeys table exists
✓ passkeys table has 12 columns
✓ passkeys table has 4 indexes
✓ Successfully inserted test passkey
✓ Successfully queried test passkey
✓ Successfully updated test passkey
✓ Successfully deleted test passkey

--- Testing webauthn_challenges table ---
✓ webauthn_challenges table exists
✓ webauthn_challenges table has 6 columns
✓ webauthn_challenges table has 4 indexes
✓ Successfully inserted test challenge
✓ Successfully queried test challenge
✓ Successfully deleted test challenge

--- Testing passkey_2fa_enabled column ---
✓ passkey_2fa_enabled column exists
✓ Successfully queried passkey_2fa_enabled column

--- Testing foreign key constraints ---
✓ passkeys table has 1 foreign key(s)
✓ webauthn_challenges table has 1 foreign key(s)

✓ All passkey migration tests passed successfully!
```

## Database Schema

### passkeys Table

Stores WebAuthn passkey credentials for users.

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR(255) | Primary key, unique identifier |
| user_email | VARCHAR(255) | Foreign key to approved_users |
| credential_id | TEXT | WebAuthn credential ID (unique) |
| public_key | TEXT | Public key for signature verification |
| counter | BIGINT | Signature counter (replay attack prevention) |
| aaguid | VARCHAR(36) | Authenticator Attestation GUID |
| transports | TEXT[] | Supported transport types |
| authenticator_type | VARCHAR(20) | 'platform' or 'cross-platform' |
| friendly_name | VARCHAR(100) | User-defined name |
| last_used_at | TIMESTAMP | Last authentication timestamp |
| created_at | TIMESTAMP | Enrollment timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

**Indexes:**
- Primary key on `id`
- Index on `user_email`
- Unique index on `credential_id`

**Foreign Keys:**
- `user_email` references `approved_users(email)` ON DELETE CASCADE

### webauthn_challenges Table

Stores temporary challenges for WebAuthn ceremonies.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| challenge | TEXT | Cryptographically random challenge (unique) |
| user_email | VARCHAR(255) | Foreign key to approved_users (nullable) |
| type | VARCHAR(20) | 'registration' or 'authentication' |
| expires_at | TIMESTAMP | Expiration timestamp |
| created_at | TIMESTAMP | Creation timestamp |

**Indexes:**
- Primary key on `id`
- Unique index on `challenge`
- Index on `expires_at`

**Foreign Keys:**
- `user_email` references `approved_users(email)` ON DELETE CASCADE

### approved_users Table (Updated)

Added column for 2FA preference.

| Column | Type | Description |
|--------|------|-------------|
| passkey_2fa_enabled | BOOLEAN | Whether passkey 2FA is required (default: false) |

## Troubleshooting

### Migration Fails

If the migration fails, check:

1. **Database connection**: Ensure `DATABASE_URL` is set in `.env`
2. **Prerequisites**: Ensure the `approved_users` table exists (run `npm run migrate` first)
3. **Permissions**: Ensure the database user has CREATE TABLE permissions

### Test Fails

If the test fails, check:

1. **Migrations not run**: Run `npm run migrate:passkey` first
2. **Test user missing**: Ensure `test@clouddesk.com` exists in `approved_users` (run `npm run seed`)
3. **Foreign key violations**: Ensure the `approved_users` table exists

## Running All Migrations

If you need to set up the entire database from scratch:

```bash
npm run migrate  # Run all migrations (001-007)
npm run seed     # Insert test users
```

## Manual Verification

You can manually verify the migrations using SQL:

```sql
-- Check passkeys table
SELECT * FROM information_schema.columns WHERE table_name = 'passkeys';

-- Check webauthn_challenges table
SELECT * FROM information_schema.columns WHERE table_name = 'webauthn_challenges';

-- Check passkey_2fa_enabled column
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'approved_users' AND column_name = 'passkey_2fa_enabled';
```

## Next Steps

After running the migrations:

1. Ensure WebAuthn environment variables are set in `.env`:
   - `RP_ID` - Your domain (e.g., 'localhost' for development)
   - `RP_NAME` - Your app name (e.g., 'CloudDesk')
   - `ORIGIN` - Your app URL (e.g., 'http://localhost:5173')

2. Start the server and test passkey enrollment from the profile page

3. Test passkey authentication from the login page

## Requirements

This migration satisfies **Requirement 9.1** from the passkey authentication specification:
- Creates secure storage for passkey credentials
- Implements proper foreign key constraints
- Uses appropriate data types for WebAuthn fields
- Includes indexes for query performance
