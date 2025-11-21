/**
 * Passkey Migration Runner
 * Executes passkey-related SQL migration files against the PostgreSQL database
 * Requirements: 9.1
 * 
 * This script runs the following migrations:
 * - 005_create_passkeys_table.sql
 * - 006_create_webauthn_challenges_table.sql
 * - 007_add_passkey_2fa_enabled.sql
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Passkey-related migration files in order
const PASSKEY_MIGRATIONS = [
  '005_create_passkeys_table.sql',
  '006_create_webauthn_challenges_table.sql',
  '007_add_passkey_2fa_enabled.sql'
];

/**
 * Run a single migration file
 * @param {string} filePath - Path to the SQL migration file
 * @returns {Promise<boolean>} - True if successful
 */
async function runMigration(filePath) {
  const fileName = path.basename(filePath);
  console.log(`Running migration: ${fileName}`);
  
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    await pool.query(sql);
    console.log(`✓ Migration ${fileName} completed successfully`);
    return true;
  } catch (error) {
    console.error(`✗ Migration ${fileName} failed:`, error.message);
    throw error;
  }
}

/**
 * Verify that passkeys table exists and has correct structure
 */
async function verifyPasskeysTable() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'passkeys'
      ORDER BY ordinal_position;
    `);
    
    if (result.rows.length === 0) {
      throw new Error('passkeys table does not exist');
    }
    
    const requiredColumns = [
      'id', 'user_email', 'credential_id', 'public_key', 'counter',
      'aaguid', 'transports', 'authenticator_type', 'friendly_name',
      'last_used_at', 'created_at', 'updated_at'
    ];
    
    const existingColumns = result.rows.map(row => row.column_name);
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
    
    if (missingColumns.length > 0) {
      throw new Error(`passkeys table is missing columns: ${missingColumns.join(', ')}`);
    }
    
    console.log('✓ passkeys table verified');
    return true;
  } catch (error) {
    console.error('✗ passkeys table verification failed:', error.message);
    throw error;
  }
}

/**
 * Verify that webauthn_challenges table exists and has correct structure
 */
async function verifyWebAuthnChallengesTable() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'webauthn_challenges'
      ORDER BY ordinal_position;
    `);
    
    if (result.rows.length === 0) {
      throw new Error('webauthn_challenges table does not exist');
    }
    
    const requiredColumns = ['id', 'challenge', 'user_email', 'type', 'expires_at', 'created_at'];
    const existingColumns = result.rows.map(row => row.column_name);
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
    
    if (missingColumns.length > 0) {
      throw new Error(`webauthn_challenges table is missing columns: ${missingColumns.join(', ')}`);
    }
    
    console.log('✓ webauthn_challenges table verified');
    return true;
  } catch (error) {
    console.error('✗ webauthn_challenges table verification failed:', error.message);
    throw error;
  }
}

/**
 * Verify that passkey_2fa_enabled column exists in approved_users table
 */
async function verify2FAColumn() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'approved_users' AND column_name = 'passkey_2fa_enabled';
    `);
    
    if (result.rows.length === 0) {
      throw new Error('passkey_2fa_enabled column does not exist in approved_users table');
    }
    
    console.log('✓ passkey_2fa_enabled column verified');
    return true;
  } catch (error) {
    console.error('✗ passkey_2fa_enabled column verification failed:', error.message);
    throw error;
  }
}

/**
 * Run all passkey-related migrations
 */
async function runPasskeyMigrations() {
  const migrationsDir = __dirname;
  
  try {
    console.log('Starting passkey database migrations...\n');
    console.log(`Found ${PASSKEY_MIGRATIONS.length} passkey migration(s) to run\n`);
    
    // Run each passkey migration
    for (const file of PASSKEY_MIGRATIONS) {
      const filePath = path.join(migrationsDir, file);
      
      if (!fs.existsSync(filePath)) {
        throw new Error(`Migration file not found: ${file}`);
      }
      
      await runMigration(filePath);
    }
    
    console.log('\n--- Verifying Migrations ---\n');
    
    // Verify all migrations were successful
    await verifyPasskeysTable();
    await verifyWebAuthnChallengesTable();
    await verify2FAColumn();
    
    console.log('\n✓ All passkey migrations completed and verified successfully');
    console.log('\nPasskey authentication is now ready to use!');
    
  } catch (error) {
    console.error('\n✗ Passkey migration failed:', error.message);
    console.error('\nPlease check your database connection and try again.');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations if this script is executed directly
if (require.main === module) {
  runPasskeyMigrations();
}

module.exports = { runPasskeyMigrations, verifyPasskeysTable, verifyWebAuthnChallengesTable, verify2FAColumn };
