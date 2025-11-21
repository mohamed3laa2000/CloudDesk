/**
 * Passkey Migration Test Script
 * Tests passkey migrations on the database
 * Requirements: 9.1
 * 
 * This script:
 * 1. Verifies all passkey tables exist
 * 2. Tests inserting sample data
 * 3. Tests querying the data
 * 4. Cleans up test data
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

/**
 * Test passkeys table
 */
async function testPasskeysTable() {
  console.log('\n--- Testing passkeys table ---\n');
  
  try {
    // Check table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'passkeys'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      throw new Error('passkeys table does not exist');
    }
    console.log('✓ passkeys table exists');
    
    // Check columns
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'passkeys'
      ORDER BY ordinal_position;
    `);
    
    console.log('✓ passkeys table has', columns.rows.length, 'columns');
    
    // Check indexes
    const indexes = await pool.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'passkeys';
    `);
    
    console.log('✓ passkeys table has', indexes.rows.length, 'indexes');
    
    // Test insert (using a test user email that should exist)
    const testPasskey = {
      id: 'test-passkey-' + Date.now(),
      user_email: 'test@clouddesk.com',
      credential_id: 'test-credential-' + Date.now(),
      public_key: 'test-public-key',
      counter: 0,
      authenticator_type: 'platform',
      friendly_name: 'Test Passkey'
    };
    
    await pool.query(`
      INSERT INTO passkeys (id, user_email, credential_id, public_key, counter, authenticator_type, friendly_name)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      testPasskey.id,
      testPasskey.user_email,
      testPasskey.credential_id,
      testPasskey.public_key,
      testPasskey.counter,
      testPasskey.authenticator_type,
      testPasskey.friendly_name
    ]);
    
    console.log('✓ Successfully inserted test passkey');
    
    // Test query
    const result = await pool.query(`
      SELECT * FROM passkeys WHERE id = $1
    `, [testPasskey.id]);
    
    if (result.rows.length === 0) {
      throw new Error('Failed to retrieve test passkey');
    }
    
    console.log('✓ Successfully queried test passkey');
    
    // Test update
    await pool.query(`
      UPDATE passkeys SET counter = $1, last_used_at = NOW()
      WHERE id = $2
    `, [1, testPasskey.id]);
    
    console.log('✓ Successfully updated test passkey');
    
    // Clean up
    await pool.query(`
      DELETE FROM passkeys WHERE id = $1
    `, [testPasskey.id]);
    
    console.log('✓ Successfully deleted test passkey');
    
    return true;
  } catch (error) {
    console.error('✗ passkeys table test failed:', error.message);
    throw error;
  }
}

/**
 * Test webauthn_challenges table
 */
async function testWebAuthnChallengesTable() {
  console.log('\n--- Testing webauthn_challenges table ---\n');
  
  try {
    // Check table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'webauthn_challenges'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      throw new Error('webauthn_challenges table does not exist');
    }
    console.log('✓ webauthn_challenges table exists');
    
    // Check columns
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'webauthn_challenges'
      ORDER BY ordinal_position;
    `);
    
    console.log('✓ webauthn_challenges table has', columns.rows.length, 'columns');
    
    // Check indexes
    const indexes = await pool.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'webauthn_challenges';
    `);
    
    console.log('✓ webauthn_challenges table has', indexes.rows.length, 'indexes');
    
    // Test insert
    const testChallenge = {
      challenge: 'test-challenge-' + Date.now(),
      user_email: 'test@clouddesk.com',
      type: 'registration',
      expires_at: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes from now
    };
    
    await pool.query(`
      INSERT INTO webauthn_challenges (challenge, user_email, type, expires_at)
      VALUES ($1, $2, $3, $4)
    `, [
      testChallenge.challenge,
      testChallenge.user_email,
      testChallenge.type,
      testChallenge.expires_at
    ]);
    
    console.log('✓ Successfully inserted test challenge');
    
    // Test query
    const result = await pool.query(`
      SELECT * FROM webauthn_challenges WHERE challenge = $1
    `, [testChallenge.challenge]);
    
    if (result.rows.length === 0) {
      throw new Error('Failed to retrieve test challenge');
    }
    
    console.log('✓ Successfully queried test challenge');
    
    // Clean up
    await pool.query(`
      DELETE FROM webauthn_challenges WHERE challenge = $1
    `, [testChallenge.challenge]);
    
    console.log('✓ Successfully deleted test challenge');
    
    return true;
  } catch (error) {
    console.error('✗ webauthn_challenges table test failed:', error.message);
    throw error;
  }
}

/**
 * Test passkey_2fa_enabled column
 */
async function test2FAColumn() {
  console.log('\n--- Testing passkey_2fa_enabled column ---\n');
  
  try {
    // Check column exists
    const columnCheck = await pool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'approved_users' AND column_name = 'passkey_2fa_enabled';
    `);
    
    if (columnCheck.rows.length === 0) {
      throw new Error('passkey_2fa_enabled column does not exist');
    }
    console.log('✓ passkey_2fa_enabled column exists');
    console.log('  - Data type:', columnCheck.rows[0].data_type);
    console.log('  - Default:', columnCheck.rows[0].column_default);
    
    // Test query
    const result = await pool.query(`
      SELECT email, passkey_2fa_enabled FROM approved_users LIMIT 1
    `);
    
    if (result.rows.length > 0) {
      console.log('✓ Successfully queried passkey_2fa_enabled column');
      console.log('  - Sample value:', result.rows[0].passkey_2fa_enabled);
    }
    
    return true;
  } catch (error) {
    console.error('✗ passkey_2fa_enabled column test failed:', error.message);
    throw error;
  }
}

/**
 * Test foreign key constraints
 */
async function testForeignKeys() {
  console.log('\n--- Testing foreign key constraints ---\n');
  
  try {
    // Check passkeys foreign key
    const passkeysFk = await pool.query(`
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
    `);
    
    console.log('✓ passkeys table has', passkeysFk.rows.length, 'foreign key(s)');
    
    // Check webauthn_challenges foreign key
    const challengesFk = await pool.query(`
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
    `);
    
    console.log('✓ webauthn_challenges table has', challengesFk.rows.length, 'foreign key(s)');
    
    return true;
  } catch (error) {
    console.error('✗ Foreign key test failed:', error.message);
    throw error;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  try {
    console.log('Starting passkey migration tests...\n');
    console.log('Database:', process.env.DATABASE_URL ? 'Connected' : 'Not configured');
    
    await testPasskeysTable();
    await testWebAuthnChallengesTable();
    await test2FAColumn();
    await testForeignKeys();
    
    console.log('\n✓ All passkey migration tests passed successfully!\n');
    console.log('The passkey authentication database schema is working correctly.');
    
  } catch (error) {
    console.error('\n✗ Passkey migration tests failed:', error.message);
    console.error('\nPlease ensure migrations have been run: npm run migrate:passkey');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { 
  testPasskeysTable, 
  testWebAuthnChallengesTable, 
  test2FAColumn,
  testForeignKeys 
};
