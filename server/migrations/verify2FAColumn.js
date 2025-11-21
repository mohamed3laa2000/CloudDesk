const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function verify2FAColumn() {
  const client = await pool.connect();
  
  try {
    console.log('Verifying passkey_2fa_enabled column...\n');
    
    // Check if column exists
    const columnCheck = await client.query(`
      SELECT 
        column_name,
        data_type,
        column_default,
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'approved_users'
        AND column_name = 'passkey_2fa_enabled';
    `);
    
    if (columnCheck.rows.length === 0) {
      console.error('❌ Column passkey_2fa_enabled does not exist in approved_users table');
      process.exit(1);
    }
    
    const column = columnCheck.rows[0];
    console.log('✅ Column exists with the following properties:');
    console.log(`   - Name: ${column.column_name}`);
    console.log(`   - Type: ${column.data_type}`);
    console.log(`   - Default: ${column.column_default}`);
    console.log(`   - Nullable: ${column.is_nullable}`);
    
    // Check column comment
    const commentCheck = await client.query(`
      SELECT 
        col_description('approved_users'::regclass, ordinal_position) as column_comment
      FROM information_schema.columns
      WHERE table_name = 'approved_users'
        AND column_name = 'passkey_2fa_enabled';
    `);
    
    if (commentCheck.rows.length > 0 && commentCheck.rows[0].column_comment) {
      console.log(`   - Comment: ${commentCheck.rows[0].column_comment}`);
      console.log('\n✅ Column comment is set correctly');
    } else {
      console.log('\n⚠️  Column comment is not set');
    }
    
    // Verify default value works
    const testQuery = await client.query(`
      SELECT passkey_2fa_enabled 
      FROM approved_users 
      LIMIT 1;
    `);
    
    if (testQuery.rows.length > 0) {
      console.log(`\n✅ Column is queryable. Sample value: ${testQuery.rows[0].passkey_2fa_enabled}`);
    }
    
    console.log('\n✅ All verifications passed!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

verify2FAColumn();
