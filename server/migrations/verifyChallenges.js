/**
 * Verify WebAuthn Challenges Table Migration
 * Checks that the webauthn_challenges table was created correctly
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function verifyChallengesTable() {
  console.log('Verifying webauthn_challenges table...\n');
  
  try {
    // Check webauthn_challenges table structure
    const columnsQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'webauthn_challenges'
      ORDER BY ordinal_position;
    `;
    const columnsResult = await pool.query(columnsQuery);
    
    if (columnsResult.rows.length === 0) {
      console.error('✗ webauthn_challenges table not found');
      process.exit(1);
    } else {
      console.log('✓ webauthn_challenges table exists with columns:');
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
        AND tc.table_name = 'webauthn_challenges';
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
      WHERE tablename = 'webauthn_challenges'
      ORDER BY indexname;
    `;
    const indexResult = await pool.query(indexQuery);
    
    console.log('✓ Indexes created:');
    indexResult.rows.forEach(row => {
      console.log(`  - ${row.indexname}`);
    });
    
    // Check unique constraint on challenge
    const uniqueQuery = `
      SELECT constraint_name, column_name
      FROM information_schema.constraint_column_usage
      WHERE table_name = 'webauthn_challenges'
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
    
    // Check CHECK constraint on type column
    const checkQuery = `
      SELECT constraint_name, check_clause
      FROM information_schema.check_constraints
      WHERE constraint_name IN (
        SELECT constraint_name
        FROM information_schema.constraint_column_usage
        WHERE table_name = 'webauthn_challenges'
      );
    `;
    const checkResult = await pool.query(checkQuery);
    
    console.log('');
    if (checkResult.rows.length > 0) {
      console.log('✓ Check constraints:');
      checkResult.rows.forEach(row => {
        console.log(`  - ${row.constraint_name}: ${row.check_clause}`);
      });
    }
    
    console.log('\n✓ WebAuthn challenges table verification completed successfully');
  } catch (error) {
    console.error('\n✗ Verification failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run verification if this script is executed directly
if (require.main === module) {
  verifyChallengesTable();
}

module.exports = { verifyChallengesTable };
