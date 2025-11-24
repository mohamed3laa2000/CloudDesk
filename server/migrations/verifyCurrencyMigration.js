/**
 * Currency Migration Verification Script
 * 
 * Verifies that the USD to IDR migration was successful
 * 
 * Usage:
 *   node server/migrations/verifyCurrencyMigration.js
 */

const { Pool } = require('pg');
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

async function verifyMigration() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║        Currency Migration Verification Report         ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  try {
    // 1. Check if migration was applied
    console.log('1️⃣  Checking migration status...');
    const migrationCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'migration_log'
      ) as table_exists
    `);

    if (migrationCheck.rows[0].table_exists) {
      const migrationLog = await pool.query(`
        SELECT * FROM migration_log 
        WHERE migration_name = '008_convert_usd_to_idr'
        ORDER BY applied_at DESC
        LIMIT 1
      `);

      if (migrationLog.rows.length > 0) {
        const log = migrationLog.rows[0];
        console.log('✅ Migration found in log');
        console.log(`   Applied at: ${log.applied_at}`);
        console.log(`   Conversion rate: ${log.conversion_rate}`);
        console.log(`   Description: ${log.description}\n`);
      } else {
        console.log('⚠️  Migration not found in log\n');
      }
    } else {
      console.log('⚠️  migration_log table does not exist\n');
    }

    // 2. Check billing records statistics
    console.log('2️⃣  Analyzing billing records...');
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_records,
        MIN(total_cost) as min_cost,
        MAX(total_cost) as max_cost,
        AVG(total_cost) as avg_cost,
        SUM(total_cost) as sum_cost,
        COUNT(CASE WHEN total_cost < 1000 THEN 1 END) as potential_usd_records,
        COUNT(CASE WHEN total_cost >= 1000 THEN 1 END) as potential_idr_records
      FROM billing_records
    `);

    const s = stats.rows[0];
    console.log('📊 Billing Records Statistics:');
    console.table({
      'Total Records': s.total_records,
      'Min Cost': `Rp ${parseFloat(s.min_cost || 0).toLocaleString('id-ID')}`,
      'Max Cost': `Rp ${parseFloat(s.max_cost || 0).toLocaleString('id-ID')}`,
      'Avg Cost': `Rp ${parseFloat(s.avg_cost || 0).toLocaleString('id-ID')}`,
      'Total Sum': `Rp ${parseFloat(s.sum_cost || 0).toLocaleString('id-ID')}`,
      'Records < 1000 (likely USD)': s.potential_usd_records,
      'Records >= 1000 (likely IDR)': s.potential_idr_records
    });

    // 3. Check for suspicious values
    console.log('\n3️⃣  Checking for suspicious values...');
    
    if (parseInt(s.potential_usd_records) > 0) {
      console.log(`⚠️  Found ${s.potential_usd_records} records with cost < 1000`);
      console.log('   These might still be in USD or are very small charges\n');
      
      const samples = await pool.query(`
        SELECT id, user_email, total_cost, period_start, period_end
        FROM billing_records
        WHERE total_cost < 1000
        ORDER BY total_cost DESC
        LIMIT 5
      `);
      
      console.log('   Sample records:');
      console.table(samples.rows.map(r => ({
        ID: r.id,
        User: r.user_email.substring(0, 25),
        Cost: `Rp ${parseFloat(r.total_cost).toFixed(2)}`,
        Period: r.period_start.toISOString().split('T')[0]
      })));
    } else {
      console.log('✅ No records with cost < 1000 found');
      console.log('   All records appear to be in IDR\n');
    }

    // 4. Check table comments
    console.log('4️⃣  Checking table metadata...');
    const tableComment = await pool.query(`
      SELECT obj_description('billing_records'::regclass) as comment
    `);
    
    const columnComments = await pool.query(`
      SELECT 
        column_name,
        col_description('billing_records'::regclass, ordinal_position) as comment
      FROM information_schema.columns
      WHERE table_name = 'billing_records'
        AND column_name IN ('compute_cost', 'storage_cost', 'total_cost')
      ORDER BY ordinal_position
    `);

    console.log('📝 Table comment:', tableComment.rows[0].comment || 'None');
    console.log('📝 Column comments:');
    columnComments.rows.forEach(row => {
      const hasIDR = row.comment && row.comment.includes('IDR');
      const status = hasIDR ? '✅' : '⚠️ ';
      console.log(`   ${status} ${row.column_name}: ${row.comment || 'None'}`);
    });

    // 5. Sample recent records
    console.log('\n5️⃣  Sample of recent billing records:');
    const recentRecords = await pool.query(`
      SELECT 
        id,
        user_email,
        compute_cost,
        storage_cost,
        total_cost,
        period_start
      FROM billing_records
      ORDER BY created_at DESC
      LIMIT 5
    `);

    if (recentRecords.rows.length > 0) {
      console.table(recentRecords.rows.map(r => ({
        ID: r.id,
        User: r.user_email.substring(0, 20),
        'Compute': `Rp ${parseFloat(r.compute_cost).toLocaleString('id-ID')}`,
        'Storage': `Rp ${parseFloat(r.storage_cost).toLocaleString('id-ID')}`,
        'Total': `Rp ${parseFloat(r.total_cost).toLocaleString('id-ID')}`,
        'Period': r.period_start.toISOString().split('T')[0]
      })));
    } else {
      console.log('   No billing records found');
    }

    // 6. Final verdict
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║                    FINAL VERDICT                       ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    const allGood = 
      parseInt(s.potential_usd_records) === 0 &&
      parseInt(s.total_records) > 0 &&
      tableComment.rows[0].comment?.includes('IDR');

    if (allGood) {
      console.log('✅ MIGRATION SUCCESSFUL');
      console.log('   All billing records appear to be in IDR');
      console.log('   Table metadata updated correctly');
    } else if (parseInt(s.total_records) === 0) {
      console.log('ℹ️  NO DATA TO MIGRATE');
      console.log('   No billing records exist in the database');
    } else {
      console.log('⚠️  MIGRATION MAY BE INCOMPLETE');
      console.log('   Please review the warnings above');
      if (parseInt(s.potential_usd_records) > 0) {
        console.log('   Consider re-running the migration for records < 1000');
      }
    }

  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

// Run verification
verifyMigration();
