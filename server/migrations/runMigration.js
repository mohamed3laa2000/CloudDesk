/**
 * Database Migration Runner
 * Executes SQL migration files against the PostgreSQL database
 * Requirements: 8.1, 8.2, 8.4
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

/**
 * Run a single migration file
 * @param {string} filePath - Path to the SQL migration file
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
 * Run all migrations in the migrations directory
 */
async function runAllMigrations() {
  const migrationsDir = __dirname;
  
  try {
    // Get all SQL files in migrations directory
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Run migrations in alphabetical order
    
    if (files.length === 0) {
      console.log('No migration files found');
      return;
    }
    
    console.log(`Found ${files.length} migration(s) to run\n`);
    
    // Run each migration
    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      await runMigration(filePath);
    }
    
    console.log('\n✓ All migrations completed successfully');
  } catch (error) {
    console.error('\n✗ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations if this script is executed directly
if (require.main === module) {
  console.log('Starting database migrations...\n');
  runAllMigrations();
}

module.exports = { runMigration, runAllMigrations };
