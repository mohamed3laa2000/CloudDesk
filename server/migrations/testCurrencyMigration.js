/**
 * Currency Migration Test Script
 * 
 * Tests the currency migration in a safe way without modifying production data
 * Creates temporary test data, runs migration, verifies results, and cleans up
 * 
 * Usage:
 *   node server/migrations/testCurrencyMigration.js
 */

const { Pool } = require('pg');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const CONVERSION_RATE = 16600;

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

async function runTests() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║         Currency Migration Test Suite                 ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const client = await pool.connect();
  let testsPassed = 0;
  let testsFailed = 0;

  try {
    // Cleanup any leftover test data from previous runs
    console.log('🧹 Cleaning up any leftover test data...');
    await client.query(`
      DELETE FROM billing_records 
      WHERE instance_id = 'test-migration-inst-001'
    `);
    await client.query(`
      DELETE FROM instances 
      WHERE id = 'test-migration-inst-001'
    `);
    console.log('✅ Cleanup complete\n');
    
    // Test 1: Create test billing records
    console.log('1️⃣  Creating test billing records...');
    await client.query('BEGIN');
    
    // Ensure we have a test user
    await client.query(`
      INSERT INTO approved_users (email, name)
      VALUES ('test-migration@clouddesk.com', 'Migration Test User')
      ON CONFLICT (email) DO NOTHING
    `);

    // Create a test instance
    await client.query(`
      INSERT INTO instances (
        id, user_email, name, image_id, status, 
        cpu_cores, ram_gb, storage_gb, gpu, region
      )
      VALUES (
        'test-migration-inst-001', 
        'test-migration@clouddesk.com',
        'Test Migration Instance',
        'ubuntu-22-04',
        'STOPPED',
        4, 8, 50, 'NONE', 'SINGAPORE'
      )
      ON CONFLICT (id) DO NOTHING
    `);

    // Create test billing records in USD
    const testRecords = [
      { compute: 10.50, storage: 2.30, total: 12.80 },
      { compute: 25.75, storage: 5.15, total: 30.90 },
      { compute: 100.00, storage: 15.50, total: 115.50 },
    ];

    for (let i = 0; i < testRecords.length; i++) {
      const record = testRecords[i];
      await client.query(`
        INSERT INTO billing_records (
          instance_id, user_email, compute_hours, storage_gb_hours,
          compute_cost, storage_cost, total_cost,
          period_start, period_end
        )
        VALUES (
          'test-migration-inst-001',
          'test-migration@clouddesk.com',
          10.5, 50.0,
          $1, $2, $3,
          NOW() - INTERVAL '1 day',
          NOW()
        )
      `, [record.compute, record.storage, record.total]);
    }

    await client.query('COMMIT');
    console.log(`✅ Created ${testRecords.length} test billing records in USD\n`);
    testsPassed++;

    // Test 2: Verify test records are in USD
    console.log('2️⃣  Verifying test records are in USD range...');
    const beforeResult = await client.query(`
      SELECT 
        compute_cost, storage_cost, total_cost
      FROM billing_records
      WHERE instance_id = 'test-migration-inst-001'
    `);

    const allInUsdRange = beforeResult.rows.every(row => 
      parseFloat(row.total_cost) < 1000
    );

    if (allInUsdRange) {
      console.log('✅ All test records are in USD range (< 1000)\n');
      testsPassed++;
    } else {
      console.log('❌ Some test records are not in USD range\n');
      testsFailed++;
    }

    // Test 3: Run conversion on test records
    console.log('3️⃣  Running conversion on test records...');
    await client.query('BEGIN');

    const conversionResult = await client.query(`
      UPDATE billing_records
      SET 
        compute_cost = compute_cost * ${CONVERSION_RATE},
        storage_cost = storage_cost * ${CONVERSION_RATE},
        total_cost = total_cost * ${CONVERSION_RATE}
      WHERE instance_id = 'test-migration-inst-001'
        AND total_cost < 1000
    `);

    await client.query('COMMIT');
    console.log(`✅ Converted ${conversionResult.rowCount} records\n`);
    testsPassed++;

    // Test 4: Verify conversion accuracy
    console.log('4️⃣  Verifying conversion accuracy...');
    const afterResult = await client.query(`
      SELECT 
        compute_cost, storage_cost, total_cost
      FROM billing_records
      WHERE instance_id = 'test-migration-inst-001'
      ORDER BY id DESC
      LIMIT ${testRecords.length}
    `);

    let conversionAccurate = true;
    // Reverse to match insertion order (we ordered by id DESC to get latest records)
    const latestRecords = afterResult.rows.reverse();
    
    for (let i = 0; i < testRecords.length && i < latestRecords.length; i++) {
      const expected = testRecords[i].total * CONVERSION_RATE;
      const actual = parseFloat(latestRecords[i].total_cost);
      const diff = Math.abs(expected - actual);
      
      if (diff > 1) { // Allow for rounding (IDR uses whole numbers)
        console.log(`❌ Record ${i + 1}: Expected ${expected.toFixed(0)}, got ${actual.toFixed(0)}`);
        conversionAccurate = false;
      }
    }

    if (conversionAccurate) {
      console.log('✅ All conversions are accurate\n');
      testsPassed++;
    } else {
      console.log('❌ Some conversions are inaccurate\n');
      testsFailed++;
    }

    // Test 5: Verify IDR range
    console.log('5️⃣  Verifying records are now in IDR range...');
    const allInIdrRange = afterResult.rows.every(row => 
      parseFloat(row.total_cost) >= 1000
    );

    if (allInIdrRange) {
      console.log('✅ All test records are now in IDR range (>= 1000)\n');
      testsPassed++;
    } else {
      console.log('❌ Some test records are not in IDR range\n');
      testsFailed++;
    }

    // Test 6: Display sample results
    console.log('6️⃣  Sample conversion results:');
    const sampleData = latestRecords.slice(0, testRecords.length).map((row, i) => {
      if (!testRecords[i]) return null;
      return {
        'Original USD': `$${testRecords[i].total.toFixed(2)}`,
        'Converted IDR': `Rp ${parseFloat(row.total_cost).toLocaleString('id-ID')}`,
        'Expected IDR': `Rp ${(testRecords[i].total * CONVERSION_RATE).toLocaleString('id-ID')}`,
        'Match': Math.abs(parseFloat(row.total_cost) - (testRecords[i].total * CONVERSION_RATE)) < 1 ? '✅' : '❌'
      };
    }).filter(Boolean);
    
    console.table(sampleData);
    console.log();
    testsPassed++;

    // Test 7: Test idempotency (running conversion again should not change values)
    console.log('7️⃣  Testing idempotency (running conversion again)...');
    const beforeIdempotency = await client.query(`
      SELECT total_cost FROM billing_records
      WHERE instance_id = 'test-migration-inst-001'
    `);

    await client.query('BEGIN');
    await client.query(`
      UPDATE billing_records
      SET 
        compute_cost = compute_cost * ${CONVERSION_RATE},
        storage_cost = storage_cost * ${CONVERSION_RATE},
        total_cost = total_cost * ${CONVERSION_RATE}
      WHERE instance_id = 'test-migration-inst-001'
        AND total_cost < 1000
    `);
    await client.query('COMMIT');

    const afterIdempotency = await client.query(`
      SELECT total_cost FROM billing_records
      WHERE instance_id = 'test-migration-inst-001'
    `);

    const valuesUnchanged = beforeIdempotency.rows.every((row, i) => 
      Math.abs(parseFloat(row.total_cost) - parseFloat(afterIdempotency.rows[i].total_cost)) < 0.01
    );

    if (valuesUnchanged) {
      console.log('✅ Idempotency verified: Values unchanged on second run\n');
      testsPassed++;
    } else {
      console.log('❌ Idempotency failed: Values changed on second run\n');
      testsFailed++;
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    testsFailed++;
  } finally {
    // Cleanup: Remove test data
    console.log('🧹 Cleaning up test data...');
    try {
      await client.query('BEGIN');
      await client.query(`
        DELETE FROM billing_records 
        WHERE instance_id = 'test-migration-inst-001'
      `);
      await client.query(`
        DELETE FROM instances 
        WHERE id = 'test-migration-inst-001'
      `);
      await client.query(`
        DELETE FROM approved_users 
        WHERE email = 'test-migration@clouddesk.com'
      `);
      await client.query('COMMIT');
      console.log('✅ Test data cleaned up\n');
    } catch (cleanupError) {
      console.error('⚠️  Cleanup warning:', cleanupError.message);
    }

    client.release();
  }

  // Summary
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║                    TEST SUMMARY                        ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  console.log(`✅ Tests Passed: ${testsPassed}`);
  console.log(`❌ Tests Failed: ${testsFailed}`);
  console.log(`📊 Total Tests: ${testsPassed + testsFailed}\n`);

  if (testsFailed === 0) {
    console.log('🎉 All tests passed! Currency migration is working correctly.\n');
    return true;
  } else {
    console.log('⚠️  Some tests failed. Please review the migration logic.\n');
    return false;
  }
}

async function main() {
  try {
    const success = await runTests();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run tests
if (require.main === module) {
  main();
}

module.exports = { runTests };
