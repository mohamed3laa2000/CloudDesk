const fc = require('fast-check');
const { Pool } = require('pg');
require('dotenv').config();

/**
 * Feature: gcp-backup-management, Property 3: Backup cost calculation accuracy
 * Validates: Requirements 4.7, 5.2, 5.3, 5.4
 * 
 * For any backup with storage size S GB and age H hours, the calculated cost should 
 * equal S × H × RATE where RATE is the configured storage cost per GB-hour.
 */
describe('Backup Cost Calculation - Property-Based Tests', () => {
  let pool;
  let dbService;

  // Storage rate constant from dbService.js
  const STORAGE_RATE_PER_GB_HOUR = 2.306; // IDR per GB per hour

  beforeAll(async () => {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    });

    pool.on('error', (err) => {
      console.error('Unexpected pool error:', err);
    });

    // Initialize dbService connection
    dbService = require('../services/dbService');
    await dbService.connect();
  });

  afterAll(async () => {
    try {
      // Disconnect dbService
      if (dbService) {
        await dbService.disconnect();
      }
      await pool.end();
    } catch (error) {
      console.error('Error closing pool:', error);
    }
  });

  describe('Property 3: Backup cost calculation accuracy', () => {
    it('should calculate cost as storageGb × hours × rate for any backup', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random storage size (0 to 1000 GB)
          fc.integer({ min: 0, max: 1000 }),
          // Generate random hours elapsed (0 to 8760 hours = 1 year)
          fc.double({ min: 0, max: 8760, noNaN: true }),
          async (storageGb, hoursElapsed) => {
            const client = await pool.connect();
            
            try {
              // Get a valid user email
              const userResult = await client.query(`SELECT email FROM approved_users LIMIT 1`);
              if (userResult.rows.length === 0) {
                // Skip if no users exist
                return;
              }
              const validUserEmail = userResult.rows[0].email;

              // Generate unique backup ID
              const backupId = `bak-test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

              // Calculate storage in bytes
              const storageBytes = storageGb * 1024 * 1024 * 1024;

              // Calculate creation timestamp based on hours elapsed
              const now = new Date();
              const createdAt = new Date(now.getTime() - (hoursElapsed * 60 * 60 * 1000));

              // Insert backup record
              const insertQuery = `
                INSERT INTO backups (
                  id,
                  user_email,
                  instance_id,
                  name,
                  gcp_machine_image_name,
                  source_instance_name,
                  source_instance_zone,
                  storage_bytes,
                  status,
                  created_at,
                  updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING *;
              `;

              await client.query(insertQuery, [
                backupId,
                validUserEmail,
                null,
                'Test Backup',
                'test-image',
                'test-instance',
                'us-central1-a',
                storageBytes,
                'COMPLETED',
                createdAt,
                now
              ]);

              // Calculate costs using the service
              const result = await dbService.calculateBackupCosts(validUserEmail);

              // Find the backup we just created
              const backupCost = result.costByBackup.find(b => b.backupId === backupId);
              expect(backupCost).toBeDefined();

              // Calculate expected cost: storageGb × hours × rate
              const expectedCost = storageGb * hoursElapsed * STORAGE_RATE_PER_GB_HOUR;
              const expectedCostRounded = Math.round(expectedCost * 100) / 100;

              // Requirement 4.7, 5.2, 5.3, 5.4: Verify cost calculation formula
              // Allow small floating point tolerance (0.05 IDR to account for rounding)
              expect(Math.abs(backupCost.cost - expectedCostRounded)).toBeLessThanOrEqual(0.05);

              // Verify storage size is correct
              expect(backupCost.storageGb).toBe(storageGb);

              // Verify total cost includes this backup
              expect(result.totalBackupStorageCost).toBeGreaterThanOrEqual(backupCost.cost);

              // Clean up test record
              await client.query(`DELETE FROM backups WHERE id = $1`, [backupId]);
            } finally {
              client.release();
            }
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in design
      );
    }, 120000); // 120 second timeout for property test

    it('should calculate zero cost for backups with null storage_bytes', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random hours elapsed
          fc.double({ min: 0, max: 8760, noNaN: true }),
          async (hoursElapsed) => {
            const client = await pool.connect();
            
            try {
              // Get a valid user email
              const userResult = await client.query(`SELECT email FROM approved_users LIMIT 1`);
              if (userResult.rows.length === 0) {
                return;
              }
              const validUserEmail = userResult.rows[0].email;

              // Generate unique backup ID
              const backupId = `bak-test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

              // Calculate creation timestamp
              const now = new Date();
              const createdAt = new Date(now.getTime() - (hoursElapsed * 60 * 60 * 1000));

              // Insert backup record with null storage_bytes (CREATING status)
              const insertQuery = `
                INSERT INTO backups (
                  id,
                  user_email,
                  instance_id,
                  name,
                  gcp_machine_image_name,
                  source_instance_name,
                  source_instance_zone,
                  storage_bytes,
                  status,
                  created_at,
                  updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING *;
              `;

              await client.query(insertQuery, [
                backupId,
                validUserEmail,
                null,
                'Creating Backup',
                'creating-image',
                'creating-instance',
                'us-central1-a',
                null, // null storage_bytes
                'CREATING',
                createdAt,
                now
              ]);

              // Calculate costs
              const result = await dbService.calculateBackupCosts(validUserEmail);

              // Find the backup we just created
              const backupCost = result.costByBackup.find(b => b.backupId === backupId);
              expect(backupCost).toBeDefined();

              // Requirement 5.2, 5.3: Verify cost is zero when storage is not available
              expect(backupCost.cost).toBe(0);
              expect(backupCost.storageGb).toBe(0);

              // Clean up test record
              await client.query(`DELETE FROM backups WHERE id = $1`, [backupId]);
            } finally {
              client.release();
            }
          }
        ),
        { numRuns: 100 }
      );
    }, 120000);

    it('should calculate cost correctly for DELETED backups using deletion time', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random storage size
          fc.integer({ min: 1, max: 1000 }),
          // Generate random hours from creation to deletion
          fc.double({ min: 0.1, max: 8760, noNaN: true }),
          async (storageGb, hoursUntilDeletion) => {
            const client = await pool.connect();
            
            try {
              // Get a valid user email
              const userResult = await client.query(`SELECT email FROM approved_users LIMIT 1`);
              if (userResult.rows.length === 0) {
                return;
              }
              const validUserEmail = userResult.rows[0].email;

              // Generate unique backup ID
              const backupId = `bak-test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

              // Calculate storage in bytes
              const storageBytes = storageGb * 1024 * 1024 * 1024;

              // Calculate timestamps
              const now = new Date();
              const createdAt = new Date(now.getTime() - (hoursUntilDeletion * 60 * 60 * 1000));
              const deletedAt = now; // Deleted now

              // Insert DELETED backup record
              const insertQuery = `
                INSERT INTO backups (
                  id,
                  user_email,
                  instance_id,
                  name,
                  gcp_machine_image_name,
                  source_instance_name,
                  source_instance_zone,
                  storage_bytes,
                  status,
                  created_at,
                  updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING *;
              `;

              await client.query(insertQuery, [
                backupId,
                validUserEmail,
                null,
                'Deleted Backup',
                'deleted-image',
                'deleted-instance',
                'us-central1-a',
                storageBytes,
                'DELETED',
                createdAt,
                deletedAt
              ]);

              // Calculate costs
              const result = await dbService.calculateBackupCosts(validUserEmail);

              // Find the backup we just created
              const backupCost = result.costByBackup.find(b => b.backupId === backupId);
              expect(backupCost).toBeDefined();

              // Calculate expected cost using deletion time
              const expectedCost = storageGb * hoursUntilDeletion * STORAGE_RATE_PER_GB_HOUR;
              const expectedCostRounded = Math.round(expectedCost * 100) / 100;

              // Requirement 4.7, 5.2, 5.3, 5.4: Verify cost uses deletion time for DELETED backups
              // Allow small floating point tolerance (0.05 IDR to account for rounding)
              expect(Math.abs(backupCost.cost - expectedCostRounded)).toBeLessThanOrEqual(0.05);

              // Clean up test record
              await client.query(`DELETE FROM backups WHERE id = $1`, [backupId]);
            } finally {
              client.release();
            }
          }
        ),
        { numRuns: 100 }
      );
    }, 120000);

    it('should sum costs correctly for multiple backups', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate array of 2-5 backups with random storage and hours
          fc.array(
            fc.record({
              storageGb: fc.integer({ min: 0, max: 500 }),
              hoursElapsed: fc.double({ min: 0, max: 1000, noNaN: true })
            }),
            { minLength: 2, maxLength: 5 }
          ),
          async (backups) => {
            const client = await pool.connect();
            const backupIds = [];
            
            try {
              // Get a valid user email
              const userResult = await client.query(`SELECT email FROM approved_users LIMIT 1`);
              if (userResult.rows.length === 0) {
                return;
              }
              const validUserEmail = userResult.rows[0].email;

              const now = new Date();

              // Insert all backups
              for (let i = 0; i < backups.length; i++) {
                const backup = backups[i];
                const backupId = `bak-test-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 9)}`;
                backupIds.push(backupId);

                const storageBytes = backup.storageGb * 1024 * 1024 * 1024;
                const createdAt = new Date(now.getTime() - (backup.hoursElapsed * 60 * 60 * 1000));

                const insertQuery = `
                  INSERT INTO backups (
                    id,
                    user_email,
                    instance_id,
                    name,
                    gcp_machine_image_name,
                    source_instance_name,
                    source_instance_zone,
                    storage_bytes,
                    status,
                    created_at,
                    updated_at
                  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                `;

                await client.query(insertQuery, [
                  backupId,
                  validUserEmail,
                  null,
                  `Test Backup ${i}`,
                  `test-image-${i}`,
                  `test-instance-${i}`,
                  'us-central1-a',
                  storageBytes,
                  'COMPLETED',
                  createdAt,
                  now
                ]);
              }

              // Calculate costs
              const result = await dbService.calculateBackupCosts(validUserEmail);

              // Calculate expected total cost
              let expectedTotalCost = 0;
              let expectedTotalStorageGb = 0;

              for (const backup of backups) {
                const cost = backup.storageGb * backup.hoursElapsed * STORAGE_RATE_PER_GB_HOUR;
                expectedTotalCost += cost;
                expectedTotalStorageGb += backup.storageGb;
              }

              expectedTotalCost = Math.round(expectedTotalCost * 100) / 100;

              // Requirement 5.1, 5.2, 5.3, 5.4: Verify total cost is sum of individual costs
              // Filter to only the backups we created in this test
              const ourBackups = result.costByBackup.filter(b => backupIds.includes(b.backupId));
              
              // Verify we found all our backups
              expect(ourBackups.length).toBe(backups.length);

              // Verify sum of our backups' costs matches expected
              const sumOfIndividualCosts = ourBackups.reduce((sum, b) => sum + b.cost, 0);
              // Allow slightly larger tolerance for accumulated rounding errors across multiple backups
              expect(Math.abs(sumOfIndividualCosts - expectedTotalCost)).toBeLessThanOrEqual(0.15);

              // Verify each individual backup has correct storage
              const totalStorageFromOurBackups = ourBackups.reduce((sum, b) => sum + b.storageGb, 0);
              expect(totalStorageFromOurBackups).toBe(expectedTotalStorageGb);

              // Clean up test records
              for (const backupId of backupIds) {
                await client.query(`DELETE FROM backups WHERE id = $1`, [backupId]);
              }
            } finally {
              client.release();
            }
          }
        ),
        { numRuns: 50 } // Reduced runs due to multiple database operations per iteration
      );
    }, 180000); // 180 second timeout for complex multi-backup test
  });
});
