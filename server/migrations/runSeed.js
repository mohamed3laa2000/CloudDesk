/**
 * Database Seed Runner
 * Inserts sample approved email addresses for testing
 * Requirements: 8.3
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
 * Run the seed script
 */
async function runSeed() {
  const seedFile = path.join(__dirname, '002_seed_approved_users.sql');
  
  try {
    console.log('Starting database seed...\n');
    console.log('Reading seed file: 002_seed_approved_users.sql');
    
    const sql = fs.readFileSync(seedFile, 'utf8');
    
    console.log('Executing seed script...');
    const result = await pool.query(sql);
    
    console.log('\n✓ Seed completed successfully');
    
    // Display the results if available
    if (result.rows && result.rows.length > 0) {
      console.log('\nApproved users in database:');
      console.table(result.rows);
    }
    
  } catch (error) {
    console.error('\n✗ Seed failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run seed if this script is executed directly
if (require.main === module) {
  runSeed();
}

module.exports = { runSeed };
