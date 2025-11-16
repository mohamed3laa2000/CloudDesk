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
