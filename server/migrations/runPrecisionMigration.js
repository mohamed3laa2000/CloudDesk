/**
 * Billing Cost Precision Migration Runner
 * 
 * Increases the precision of cost columns to support IDR currency
 * Must be run BEFORE the currency conversion migration
 * 
 * Usage:
 *   node server/migrations/runPrecisionMigration.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Database connection - use DATABASE_URL if available, otherwise individual vars
const pool = process.env.DATABASE_URL 
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })
  : new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'clouddesk',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    });

async function runMigration() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     Billing Cost Precision Migration                  ║');
  console.log('║     DECIMAL(10,4) → DECIMAL(15,2)                      ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const client = await pool.connect();

  try {
    // Check current column types
    console.log('1️⃣  Checking current column types...');
    const currentTypes = await client.query(`
      SELECT column_name, data_type, numeric_precision, numeric_scale
      FROM information_schema.columns
      WHERE table_name = 'billing_records' 
        AND column_name IN ('compute_cost', 'storage_cost', 'total_cost')
      ORDER BY column_name
    `);

    console.log('Current column types:');
    console.table(currentTypes.rows.map(row => ({
      Column: row.column_name,
      Type: `${row.data_type}(${row.numeric_precision},${row.numeric_scale})`
    })));

    // Check if already migrated
    const alreadyMigrated = currentTypes.rows.every(row => 
      row.numeric_precision >= 15 && row.numeric_scale === 2
    );

    if (alreadyMigrated) {
      console.log('\n✅ Columns already have sufficient precision (15,2)');
      console.log('   No migration needed.\n');
      return;
    }

    // Read migration SQL
    console.log('\n2️⃣  Reading migration SQL...');
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '007_increase_billing_cost_precision.sql'),
      'utf8'
    );

    // Execute migration
    console.log('3️⃣  Executing migration...');
    await client.query(migrationSQL);
    console.log('✅ Migration executed successfully\n');

    // Verify new column types
    console.log('4️⃣  Verifying new column types...');
    const newTypes = await client.query(`
      SELECT column_name, data_type, numeric_precision, numeric_scale
      FROM information_schema.columns
      WHERE table_name = 'billing_records' 
        AND column_name IN ('compute_cost', 'storage_cost', 'total_cost')
      ORDER BY column_name
    `);

    console.log('New column types:');
    console.table(newTypes.rows.map(row => ({
      Column: row.column_name,
      Type: `${row.data_type}(${row.numeric_precision},${row.numeric_scale})`
    })));

    // Check if migration was successful
    const migrationSuccessful = newTypes.rows.every(row => 
      row.numeric_precision >= 15 && row.numeric_scale === 2
    );

    if (migrationSuccessful) {
      console.log('\n✅ Migration completed successfully!');
      console.log('   Columns now support IDR values up to Rp 9,999,999,999,999.99\n');
      console.log('💡 Next step: Run currency conversion migration');
      console.log('   npm run migrate:currency\n');
    } else {
      console.log('\n⚠️  Migration may not have completed correctly');
      console.log('   Please verify the column types above\n');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
runMigration();
