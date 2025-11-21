/**
 * Verify Passkeys Table Migration
 * Checks that the passkeys table was created correctly
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function verifyPasskeysTable() {
  console.log('Verifying passkeys table...\n');
  
  try {
    // Check passkeys table structure
    const columnsQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'passkeys'
      ORDER BY ordinal_position;
    `;
    const columnsResult = await pool.query(columnsQuery);
    
    if (columnsResult.rows.length === 0) {
      console.error('✗ passkeys table not found');
      process.exit(1);
    } else {
      console.log('✓ passkeys table exists with columns:');
      columnsResult.rows.forEach(row => {
        console.log(`  - ${row.column_name} (${row.data_type}, nullable: ${row.is_nullable})`);
      });
    }
    
    console.log('');
    
    // Check foreign key constraints
    const fkQuery = `
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'passkeys';
    `;
    const fkResult = await pool.query(fkQuery);
    
    if (fkResult.rows.length > 0) {
      console.log('✓ Foreign key constraints:');
      fkResult.rows.forEach(row => {
        console.log(`  - ${row.column_name} -> ${row.foreign_table_name}(${row.foreign_column_name})`);
      });
    } else {
      console.error('✗ No foreign key constraints found');
    }
    
    console.log('');
    
    // Check indexes
    const indexQuery = `
      SELECT indexname, tablename
      FROM pg_indexes
      WHERE tablename = 'passkeys'
      ORDER BY indexname;
    `;
    const indexResult = await pool.query(indexQuery);
    
    console.log('✓ Indexes created:');
    indexResult.rows.forEach(row => {
      console.log(`  - ${row.indexname}`);
    });
    
    // Check unique constraint on credential_id
    const uniqueQuery = `
      SELECT constraint_name, column_name
      FROM information_schema.constraint_column_usage
      WHERE table_name = 'passkeys'
        AND constraint_name LIKE '%unique%';
    `;
    const uniqueResult = await pool.query(uniqueQuery);
    
    console.log('');
    if (uniqueResult.rows.length > 0) {
      console.log('✓ Unique constraints:');
      uniqueResult.rows.forEach(row => {
        console.log(`  - ${row.constraint_name} on ${row.column_name}`);
      });
    }
    
    console.log('\n✓ Passkeys table verification completed successfully');
  } catch (error) {
    console.error('\n✗ Verification failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run verification if this script is executed directly
if (require.main === module) {
  verifyPasskeysTable();
}

module.exports = { verifyPasskeysTable };
