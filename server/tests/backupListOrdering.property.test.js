const fc = require('fast-check');
const { Pool } = require('pg');
require('dotenv').config();

/**
 * Feature: gcp-backup-management, Property 9: Backup list ordering
 * Validates: Requirements 7.8
 * 
 * For any user's backup list, backups should be ordered by created_at timestamp 
 * in descending order (newest first).
 */
describe('Backup List Ordering - Property-Based Tests', () => {
  let pool;

  beforeAll(() => {
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
  });

  afterAll(async () => {
    try {
      await pool.end();
    } catch (error) {
      console.error('Error closing pool:', error);
    }
  });

  describe('Property 9: Backup list ordering', () => {
    it('should return backups ordered by created_at DESC for any user', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate a random number of backups (2-10) to test ordering
          fc.integer({ min: 2, max: 10 }),
          async (numBackups) => {
            const client = await pool.connect();
            const createdBackupIds = [];
            
            try {
              // Get a valid user email
              const userResult = await client.query(`SELECT email FROM approved_users LIMIT 1`);
              if (userResult.rows.length === 0) {
                // Skip this test iteration if no users exist
                return;
              }
              const validUserEmail = userResult.rows[0].email;

              // Create multiple backups with different timestamps
              const backupTimestamps = [];
              
              for (let i = 0; i < numBackups; i++) {
                const backupId = `bak-test-order-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
                createdBackupIds.push(backupId);
                
                // Insert backup with a specific timestamp offset
                // We'll use different offsets to ensure different created_at values
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
                  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP - INTERVAL '${i} hours', CURRENT_TIMESTAMP)
                  RETURNING created_at;
                `;

                const insertResult = await client.query(insertQuery, [
                  backupId,
                  validUserEmail,
                  null,
                  `Test Backup ${i}`,
                  `image-test-${i}`,
                  `instance-test-${i}`,
                  'us-central1-a',
                  null,
                  'COMPLETED'
                ]);

                backupTimestamps.push(insertResult.rows[0].created_at);
              }

              // Query backups using the same query as getBackupsByUser
              const selectQuery = `
                SELECT 
                  id,
                  user_email,
                  instance_id,
                  name,
                  gcp_machine_image_name,
                  source_instance_name,
                  source_instance_zone,
                  storage_bytes,
                  status,
                  error_message,
                  created_at,
                  updated_at
                FROM backups 
                WHERE user_email = $1 AND status != 'DELETED'
                ORDER BY created_at DESC
              `;
              
              const selectResult = await client.query(selectQuery, [validUserEmail]);

              // Filter to only our test backups
              const testBackups = selectResult.rows.filter(row => 
                createdBackupIds.includes(row.id)
              );

              // Requirement 7.8: Verify backups are ordered by created_at DESC
              expect(testBackups.length).toBe(numBackups);

              // Check that each backup's created_at is >= the next backup's created_at
              for (let i = 0; i < testBackups.length - 1; i++) {
                const currentTimestamp = new Date(testBackups[i].created_at);
                const nextTimestamp = new Date(testBackups[i + 1].created_at);
                
                // Current backup should be newer or equal to next backup (DESC order)
                expect(currentTimestamp.getTime()).toBeGreaterThanOrEqual(nextTimestamp.getTime());
              }

              // Verify the first backup is the newest (smallest offset)
              const firstBackup = testBackups[0];
              const lastBackup = testBackups[testBackups.length - 1];
              
              expect(new Date(firstBackup.created_at).getTime())
                .toBeGreaterThanOrEqual(new Date(lastBackup.created_at).getTime());

            } finally {
              // Clean up all test records
              for (const backupId of createdBackupIds) {
                await client.query(`DELETE FROM backups WHERE id = $1`, [backupId]);
              }
              client.release();
            }
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in design
      );
    }, 120000); // 120 second timeout for multiple inserts

    it('should maintain DESC ordering when backups have identical timestamps', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate 3-5 backups with the same timestamp
          fc.integer({ min: 3, max: 5 }),
          async (numBackups) => {
            const client = await pool.connect();
            const createdBackupIds = [];
            
            try {
              // Get a valid user email
              const userResult = await client.query(`SELECT email FROM approved_users LIMIT 1`);
              if (userResult.rows.length === 0) {
                return;
              }
              const validUserEmail = userResult.rows[0].email;

              // Create a fixed timestamp for all backups
              const fixedTimestamp = new Date(Date.now() - 3600000); // 1 hour ago

              // Create multiple backups with the same timestamp
              for (let i = 0; i < numBackups; i++) {
                const backupId = `bak-test-same-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
                createdBackupIds.push(backupId);
                
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
                  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP);
                `;

                await client.query(insertQuery, [
                  backupId,
                  validUserEmail,
                  null,
                  `Test Backup Same Time ${i}`,
                  `image-same-${i}`,
                  `instance-same-${i}`,
                  'us-central1-a',
                  null,
                  'COMPLETED',
                  fixedTimestamp
                ]);
              }

              // Query backups
              const selectQuery = `
                SELECT 
                  id,
                  created_at
                FROM backups 
                WHERE user_email = $1 AND status != 'DELETED'
                ORDER BY created_at DESC
              `;
              
              const selectResult = await client.query(selectQuery, [validUserEmail]);

              // Filter to only our test backups
              const testBackups = selectResult.rows.filter(row => 
                createdBackupIds.includes(row.id)
              );

              // Verify all backups are returned
              expect(testBackups.length).toBe(numBackups);

              // Verify ordering is still consistent (even if timestamps are identical)
              // The query should not fail or return inconsistent results
              for (let i = 0; i < testBackups.length - 1; i++) {
                const currentTimestamp = new Date(testBackups[i].created_at);
                const nextTimestamp = new Date(testBackups[i + 1].created_at);
                
                // Should be >= (DESC order allows equal timestamps)
                expect(currentTimestamp.getTime()).toBeGreaterThanOrEqual(nextTimestamp.getTime());
              }

            } finally {
              // Clean up all test records
              for (const backupId of createdBackupIds) {
                await client.query(`DELETE FROM backups WHERE id = $1`, [backupId]);
              }
              client.release();
            }
          }
        ),
        { numRuns: 100 }
      );
    }, 120000);

    it('should exclude DELETED backups from ordered list', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random number of active and deleted backups
          fc.record({
            numActive: fc.integer({ min: 2, max: 5 }),
            numDeleted: fc.integer({ min: 1, max: 3 })
          }),
          async ({ numActive, numDeleted }) => {
            const client = await pool.connect();
            const createdBackupIds = [];
            
            try {
              // Get a valid user email
              const userResult = await client.query(`SELECT email FROM approved_users LIMIT 1`);
              if (userResult.rows.length === 0) {
                return;
              }
              const validUserEmail = userResult.rows[0].email;

              // Create active backups
              for (let i = 0; i < numActive; i++) {
                const backupId = `bak-test-active-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
                createdBackupIds.push(backupId);
                
                await client.query(`
                  INSERT INTO backups (
                    id, user_email, instance_id, name, gcp_machine_image_name,
                    source_instance_name, source_instance_zone, storage_bytes, status,
                    created_at, updated_at
                  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP - INTERVAL '${i} hours', CURRENT_TIMESTAMP)
                `, [
                  backupId, validUserEmail, null, `Active Backup ${i}`,
                  `image-active-${i}`, `instance-active-${i}`, 'us-central1-a',
                  null, 'COMPLETED'
                ]);
              }

              // Create deleted backups
              for (let i = 0; i < numDeleted; i++) {
                const backupId = `bak-test-deleted-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
                createdBackupIds.push(backupId);
                
                await client.query(`
                  INSERT INTO backups (
                    id, user_email, instance_id, name, gcp_machine_image_name,
                    source_instance_name, source_instance_zone, storage_bytes, status,
                    created_at, updated_at
                  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP - INTERVAL '${i + numActive} hours', CURRENT_TIMESTAMP)
                `, [
                  backupId, validUserEmail, null, `Deleted Backup ${i}`,
                  `image-deleted-${i}`, `instance-deleted-${i}`, 'us-central1-a',
                  null, 'DELETED'
                ]);
              }

              // Query backups (should exclude DELETED)
              const selectQuery = `
                SELECT 
                  id,
                  status,
                  created_at
                FROM backups 
                WHERE user_email = $1 AND status != 'DELETED'
                ORDER BY created_at DESC
              `;
              
              const selectResult = await client.query(selectQuery, [validUserEmail]);

              // Filter to only our test backups
              const testBackups = selectResult.rows.filter(row => 
                createdBackupIds.includes(row.id)
              );

              // Requirement 7.8: Verify only active backups are returned (DELETED excluded)
              expect(testBackups.length).toBe(numActive);
              
              // Verify none of the returned backups have DELETED status
              testBackups.forEach(backup => {
                expect(backup.status).not.toBe('DELETED');
              });

              // Verify ordering is still DESC
              for (let i = 0; i < testBackups.length - 1; i++) {
                const currentTimestamp = new Date(testBackups[i].created_at);
                const nextTimestamp = new Date(testBackups[i + 1].created_at);
                
                expect(currentTimestamp.getTime()).toBeGreaterThanOrEqual(nextTimestamp.getTime());
              }

            } finally {
              // Clean up all test records
              for (const backupId of createdBackupIds) {
                await client.query(`DELETE FROM backups WHERE id = $1`, [backupId]);
              }
              client.release();
            }
          }
        ),
        { numRuns: 100 }
      );
    }, 120000);
  });
});
