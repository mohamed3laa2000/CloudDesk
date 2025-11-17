/**
 * Verify Migration Script
 * Checks that the instances and billing_records tables were created correctly
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function verifyTables() {
  console.log('Verifying database tables...\n');
  
  try {
    // Check instances table
    const instancesQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'instances'
      ORDER BY ordinal_position;
    `;
    const instancesResult = await pool.query(instancesQuery);
    
    if (instancesResult.rows.length === 0) {
      console.error('✗ instances table not found');
    } else {
      console.log('✓ instances table exists with columns:');
      instancesResult.rows.forEach(row => {
        console.log(`  - ${row.column_name} (${row.data_type})`);
      });
    }
    
    console.log('');
    
    // Check billing_records table
    const billingQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'billing_records'
      ORDER BY ordinal_position;
    `;
    const billingResult = await pool.query(billingQuery);
    
    if (billingResult.rows.length === 0) {
      console.error('✗ billing_records table not found');
    } else {
      console.log('✓ billing_records table exists with columns:');
      billingResult.rows.forEach(row => {
        console.log(`  - ${row.column_name} (${row.data_type})`);
      });
    }
    
    console.log('');
    
    // Check indexes
    const indexQuery = `
      SELECT indexname, tablename
      FROM pg_indexes
      WHERE tablename IN ('instances', 'billing_records')
      ORDER BY tablename, indexname;
    `;
    const indexResult = await pool.query(indexQuery);
    
    console.log('✓ Indexes created:');
    indexResult.rows.forEach(row => {
      console.log(`  - ${row.indexname} on ${row.tablename}`);
    });
    
    console.log('\n✓ Migration verification completed successfully');
  } catch (error) {
    console.error('\n✗ Verification failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run verification if this script is executed directly
if (require.main === module) {
  verifyTables();
}

module.exports = { verifyTables };
