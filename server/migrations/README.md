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

## Running Migrations

Execute all migrations:
```bash
npm run migrate
```

Or run directly:
```bash
node migrations/runMigration.js
```

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
