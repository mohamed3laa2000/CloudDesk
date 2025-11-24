/**
 * Currency Migration Runner: USD to IDR
 * 
 * This script converts all existing billing records from USD to IDR
 * Conversion rate: 1 USD = 16,600 IDR
 * 
 * Usage:
 *   node server/migrations/runCurrencyMigration.js
 * 
 * Safety features:
 * - Dry run mode to preview changes
 * - Backup creation before migration
 * - Rollback capability
 * - Verification checks
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const CONVERSION_RATE = 16600;

// Database connection
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

/**
 * Check if migration has already been applied
 */
async function checkMigrationStatus() {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM migration_log 
        WHERE migration_name = '008_convert_usd_to_idr'
      ) as already_applied
    `);
    return result.rows[0].already_applied;
  } catch (error) {
    // If migration_log table doesn't exist, migration hasn't been applied
    return false;
  }
}

/**
 * Get current billing records statistics
 */
async function getBillingStats() {
  const result = await pool.query(`
    SELECT 
      COUNT(*) as total_records,
      MIN(total_cost) as min_cost,
      MAX(total_cost) as max_cost,
      AVG(total_cost) as avg_cost,
      SUM(total_cost) as sum_cost
    FROM billing_records
  `);
  return result.rows[0];
}

/**
 * Preview what will be changed (dry run)
 */
async function previewChanges() {
  console.log('\n📊 PREVIEW: Records that will be converted\n');
  
  const result = await pool.query(`
    SELECT 
      id,
      instance_id,
      user_email,
      compute_cost as current_compute_cost,
      compute_cost * ${CONVERSION_RATE} as new_compute_cost,
      storage_cost as current_storage_cost,
      storage_cost * ${CONVERSION_RATE} as new_storage_cost,
      total_cost as current_total_cost,
      total_cost * ${CONVERSION_RATE} as new_total_cost,
      period_start,
      period_end
    FROM billing_records
    WHERE total_cost < 1000
    ORDER BY created_at DESC
    LIMIT 10
  `);

  if (result.rows.length === 0) {
    console.log('✅ No records need conversion (all costs >= 1000, likely already in IDR)');
    return false;
  }

  console.log('Sample of records to be converted (showing first 10):');
  console.table(result.rows.map(row => ({
    ID: row.id,
    User: row.user_email.substring(0, 20) + '...',
    'Current Total': `$${parseFloat(row.current_total_cost).toFixed(2)}`,
    'New Total': `Rp ${parseFloat(row.new_total_cost).toLocaleString('id-ID')}`,
    Period: row.period_start.toISOString().split('T')[0]
  })));

  const countResult = await pool.query(`
    SELECT COUNT(*) as count FROM billing_records WHERE total_cost < 1000
  `);
  console.log(`\n📝 Total records to convert: ${countResult.rows[0].count}`);
  
  return true;
}

/**
 * Create backup of billing_records table
 */
async function createBackup() {
  console.log('\n💾 Creating backup of billing_records table...');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupTableName = `billing_records_backup_${timestamp}`;
  
  await pool.query(`
    CREATE TABLE ${backupTableName} AS 
    SELECT * FROM billing_records
  `);
  
  const count = await pool.query(`SELECT COUNT(*) FROM ${backupTableName}`);
  console.log(`✅ Backup created: ${backupTableName} (${count.rows[0].count} records)`);
  
  return backupTableName;
}

/**
 * Run the migration
 */
async function runMigration() {
  console.log('\n🔄 Running currency conversion migration...');
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Update billing records
    const updateResult = await client.query(`
      UPDATE billing_records
      SET 
        compute_cost = compute_cost * ${CONVERSION_RATE},
        storage_cost = storage_cost * ${CONVERSION_RATE},
        total_cost = total_cost * ${CONVERSION_RATE}
      WHERE total_cost < 1000
    `);
    
    console.log(`✅ Updated ${updateResult.rowCount} billing records`);
    
    // Update table and column comments
    await client.query(`
      COMMENT ON TABLE billing_records IS 'Stores billing records for instance usage (Currency: IDR as of 2025-01-20)'
    `);
    
    await client.query(`
      COMMENT ON COLUMN billing_records.compute_cost IS 'Cost for compute usage (IDR)'
    `);
    
    await client.query(`
      COMMENT ON COLUMN billing_records.storage_cost IS 'Cost for storage usage (IDR)'
    `);
    
    await client.query(`
      COMMENT ON COLUMN billing_records.total_cost IS 'Total cost for the billing period (IDR)'
    `);
    
    // Create migration_log table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS migration_log (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        description TEXT,
        conversion_rate DECIMAL(10, 2)
      )
    `);
    
    // Log the migration
    await client.query(`
      INSERT INTO migration_log (migration_name, description, conversion_rate)
      VALUES ($1, $2, $3)
    `, [
      '008_convert_usd_to_idr',
      'Converted all billing records from USD to IDR. Conversion rate: 1 USD = 16,600 IDR',
      CONVERSION_RATE
    ]);
    
    await client.query('COMMIT');
    console.log('✅ Migration committed successfully');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed, rolled back:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Verify migration results
 */
async function verifyMigration() {
  console.log('\n🔍 Verifying migration results...');
  
  const stats = await getBillingStats();
  
  console.log('\n📊 Post-migration statistics:');
  console.table({
    'Total Records': stats.total_records,
    'Min Cost': `Rp ${parseFloat(stats.min_cost || 0).toLocaleString('id-ID')}`,
    'Max Cost': `Rp ${parseFloat(stats.max_cost || 0).toLocaleString('id-ID')}`,
    'Avg Cost': `Rp ${parseFloat(stats.avg_cost || 0).toLocaleString('id-ID')}`,
    'Total Sum': `Rp ${parseFloat(stats.sum_cost || 0).toLocaleString('id-ID')}`
  });
  
  // Check if any records still have USD values (< 1000)
  const usdRecords = await pool.query(`
    SELECT COUNT(*) as count FROM billing_records WHERE total_cost < 1000
  `);
  
  if (usdRecords.rows[0].count > 0) {
    console.log(`⚠️  Warning: ${usdRecords.rows[0].count} records still have values < 1000`);
  } else {
    console.log('✅ All records successfully converted to IDR');
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   Currency Migration: USD → IDR (1 USD = 16,600 IDR)  ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  
  try {
    // Check if already applied
    const alreadyApplied = await checkMigrationStatus();
    if (alreadyApplied) {
      console.log('\n⚠️  Migration has already been applied!');
      console.log('To re-run, first remove the entry from migration_log table.');
      process.exit(0);
    }
    
    // Get current stats
    console.log('\n📊 Current billing records statistics:');
    const beforeStats = await getBillingStats();
    console.table({
      'Total Records': beforeStats.total_records,
      'Min Cost': `$${parseFloat(beforeStats.min_cost || 0).toFixed(2)}`,
      'Max Cost': `$${parseFloat(beforeStats.max_cost || 0).toFixed(2)}`,
      'Avg Cost': `$${parseFloat(beforeStats.avg_cost || 0).toFixed(2)}`
    });
    
    // Preview changes
    const hasChanges = await previewChanges();
    if (!hasChanges) {
      console.log('\n✅ No migration needed. Exiting.');
      process.exit(0);
    }
    
    // Ask for confirmation
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise(resolve => {
      readline.question('\n⚠️  Proceed with migration? (yes/no): ', resolve);
    });
    readline.close();
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('\n❌ Migration cancelled by user');
      process.exit(0);
    }
    
    // Create backup
    const backupTable = await createBackup();
    
    // Run migration
    await runMigration();
    
    // Verify results
    await verifyMigration();
    
    console.log('\n✅ Migration completed successfully!');
    console.log(`📦 Backup table: ${backupTable}`);
    console.log('\n💡 To rollback, run:');
    console.log(`   DROP TABLE billing_records;`);
    console.log(`   ALTER TABLE ${backupTable} RENAME TO billing_records;`);
    console.log(`   DELETE FROM migration_log WHERE migration_name = '008_convert_usd_to_idr';`);
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };
