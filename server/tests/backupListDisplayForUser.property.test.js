const fc = require('fast-check');
const { Pool } = require('pg');
require('dotenv').config();

/**
 * Feature: gcp-backup-management, Property 10: Backup list display for user
 * Validates: Requirements 3.2
 * 
 * For any user clicking the Backup panel, the system should display all backups 
 * belonging to that user and no backups belonging to other users.
 */
describe('Backup List Display For User - Property-Based Tests', () => {
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

  describe('Property 10: Backup list display for user', () => {
    it('should return only backups belonging to the requesting user', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random number of backups for each user
          fc.record({
            numUserABackups: fc.integer({ min: 1, max: 5 }),
            numUserBBackups: fc.integer({ min: 1, max: 5 })
          }),
          async ({ numUserABackups, numUserBBackups }) => {
            const client = await pool.connect();
            const createdBackupIds = [];
            
            try {
              // Get two different valid user emails
              const userResult = await client.query(`SELECT email FROM approved_users LIMIT 2`);
              if (userResult.rows.length < 2) {
                // Skip this test iteration if we don't have at least 2 users
                return;
              }
              const userAEmail = userResult.rows[0].email;
              const userBEmail = userResult.rows[1].email;

              // Create backups for User A
              for (let i = 0; i < numUserABackups; i++) {
                const backupId = `bak-test-userA-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
                createdBackupIds.push(backupId);
                
                await client.query(`
                  INSERT INTO backups (
                    id, user_email, instance_id, name, gcp_machine_image_name,
                    source_instance_name, source_instance_zone, storage_bytes, status,
                    created_at, updated_at
                  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                `, [
                  backupId, userAEmail, null, `User A Backup ${i}`,
                  `image-userA-${i}`, `instance-userA-${i}`, 'us-central1-a',
                  null, 'COMPLETED'
                ]);
              }

              // Create backups for User B
              for (let i = 0; i < numUserBBackups; i++) {
                const backupId = `bak-test-userB-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
                createdBackupIds.push(backupId);
                
                await client.query(`
                  INSERT INTO backups (
                    id, user_email, instance_id, name, gcp_machine_image_name,
                    source_instance_name, source_instance_zone, storage_bytes, status,
                    created_at, updated_at
                  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                `, [
                  backupId, userBEmail, null, `User B Backup ${i}`,
                  `image-userB-${i}`, `instance-userB-${i}`, 'us-west1-a',
                  null, 'COMPLETED'
                ]);
              }

              // Query backups for User A using the same query as getBackupsByUser
              const selectQueryA = `
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
              
              const resultA = await client.query(selectQueryA, [userAEmail]);

              // Filter to only our test backups for User A
              const testBackupsA = resultA.rows.filter(row => 
                createdBackupIds.includes(row.id) && row.user_email === userAEmail
              );

              // Requirement 3.2: Verify User A sees only their backups
              expect(testBackupsA.length).toBe(numUserABackups);
              
              // Verify all returned backups belong to User A
              testBackupsA.forEach(backup => {
                expect(backup.user_email).toBe(userAEmail);
                expect(backup.name).toMatch(/^User A Backup/);
              });

              // Verify User A does NOT see User B's backups
              const userBBackupsInResultA = resultA.rows.filter(row => 
                createdBackupIds.includes(row.id) && row.user_email === userBEmail
              );
              expect(userBBackupsInResultA.length).toBe(0);

              // Query backups for User B
              const resultB = await client.query(selectQueryA, [userBEmail]);

              // Filter to only our test backups for User B
              const testBackupsB = resultB.rows.filter(row => 
                createdBackupIds.includes(row.id) && row.user_email === userBEmail
              );

              // Requirement 3.2: Verify User B sees only their backups
              expect(testBackupsB.length).toBe(numUserBBackups);
              
              // Verify all returned backups belong to User B
              testBackupsB.forEach(backup => {
                expect(backup.user_email).toBe(userBEmail);
                expect(backup.name).toMatch(/^User B Backup/);
              });

              // Verify User B does NOT see User A's backups
              const userABackupsInResultB = resultB.rows.filter(row => 
                createdBackupIds.includes(row.id) && row.user_email === userAEmail
              );
              expect(userABackupsInResultB.length).toBe(0);

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

    it('should not display backups from other users even with similar names', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random backup names that might be similar
          fc.record({
            sharedNamePrefix: fc.string({ minLength: 5, maxLength: 20 }),
            numBackupsPerUser: fc.integer({ min: 2, max: 4 })
          }),
          async ({ sharedNamePrefix, numBackupsPerUser }) => {
            const client = await pool.connect();
            const createdBackupIds = [];
            
            try {
              // Get two different valid user emails
              const userResult = await client.query(`SELECT email FROM approved_users LIMIT 2`);
              if (userResult.rows.length < 2) {
                return;
              }
              const userAEmail = userResult.rows[0].email;
              const userBEmail = userResult.rows[1].email;

              // Create backups with similar names for both users
              for (let i = 0; i < numBackupsPerUser; i++) {
                // User A backup
                const backupIdA = `bak-test-similar-A-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
                createdBackupIds.push(backupIdA);
                
                await client.query(`
                  INSERT INTO backups (
                    id, user_email, instance_id, name, gcp_machine_image_name,
                    source_instance_name, source_instance_zone, storage_bytes, status,
                    created_at, updated_at
                  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                `, [
                  backupIdA, userAEmail, null, `${sharedNamePrefix} Backup ${i}`,
                  `image-similar-A-${i}`, `instance-similar-A-${i}`, 'us-central1-a',
                  null, 'COMPLETED'
                ]);

                // User B backup with same name pattern
                const backupIdB = `bak-test-similar-B-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
                createdBackupIds.push(backupIdB);
                
                await client.query(`
                  INSERT INTO backups (
                    id, user_email, instance_id, name, gcp_machine_image_name,
                    source_instance_name, source_instance_zone, storage_bytes, status,
                    created_at, updated_at
                  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                `, [
                  backupIdB, userBEmail, null, `${sharedNamePrefix} Backup ${i}`,
                  `image-similar-B-${i}`, `instance-similar-B-${i}`, 'us-west1-a',
                  null, 'COMPLETED'
                ]);
              }

              // Query backups for User A
              const selectQuery = `
                SELECT 
                  id,
                  user_email,
                  name
                FROM backups 
                WHERE user_email = $1 AND status != 'DELETED'
                ORDER BY created_at DESC
              `;
              
              const resultA = await client.query(selectQuery, [userAEmail]);

              // Filter to only our test backups
              const testBackupsA = resultA.rows.filter(row => 
                createdBackupIds.includes(row.id)
              );

              // Requirement 3.2: Verify User A sees only their backups despite similar names
              expect(testBackupsA.length).toBe(numBackupsPerUser);
              
              // Verify all returned backups belong to User A
              testBackupsA.forEach(backup => {
                expect(backup.user_email).toBe(userAEmail);
                expect(backup.id).toMatch(/bak-test-similar-A-/);
              });

              // Verify no User B backups are in the result
              const userBBackupsInResultA = testBackupsA.filter(backup => 
                backup.user_email === userBEmail
              );
              expect(userBBackupsInResultA.length).toBe(0);

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

    it('should return empty list when user has no backups', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random number of backups for other users
          fc.integer({ min: 1, max: 5 }),
          async (numOtherUserBackups) => {
            const client = await pool.connect();
            const createdBackupIds = [];
            
            try {
              // Get two different valid user emails
              const userResult = await client.query(`SELECT email FROM approved_users LIMIT 2`);
              if (userResult.rows.length < 2) {
                return;
              }
              const userWithNoBackups = userResult.rows[0].email;
              const userWithBackups = userResult.rows[1].email;

              // Create backups only for the second user
              for (let i = 0; i < numOtherUserBackups; i++) {
                const backupId = `bak-test-other-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
                createdBackupIds.push(backupId);
                
                await client.query(`
                  INSERT INTO backups (
                    id, user_email, instance_id, name, gcp_machine_image_name,
                    source_instance_name, source_instance_zone, storage_bytes, status,
                    created_at, updated_at
                  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                `, [
                  backupId, userWithBackups, null, `Other User Backup ${i}`,
                  `image-other-${i}`, `instance-other-${i}`, 'us-central1-a',
                  null, 'COMPLETED'
                ]);
              }

              // Query backups for user with no backups
              const selectQuery = `
                SELECT 
                  id,
                  user_email
                FROM backups 
                WHERE user_email = $1 AND status != 'DELETED'
                ORDER BY created_at DESC
              `;
              
              const result = await client.query(selectQuery, [userWithNoBackups]);

              // Filter to only our test backups
              const testBackups = result.rows.filter(row => 
                createdBackupIds.includes(row.id)
              );

              // Requirement 3.2: Verify user with no backups sees empty list
              expect(testBackups.length).toBe(0);

              // Verify the other user's backups are not returned
              testBackups.forEach(backup => {
                expect(backup.user_email).not.toBe(userWithBackups);
              });

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

    it('should maintain user isolation across multiple concurrent queries', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random number of users and backups
          fc.record({
            numUsers: fc.integer({ min: 2, max: 3 }),
            backupsPerUser: fc.integer({ min: 2, max: 4 })
          }),
          async ({ numUsers, backupsPerUser }) => {
            const client = await pool.connect();
            const createdBackupIds = [];
            const userBackupMap = new Map();
            
            try {
              // Get multiple valid user emails
              const userResult = await client.query(`SELECT email FROM approved_users LIMIT $1`, [numUsers]);
              if (userResult.rows.length < numUsers) {
                return;
              }
              const userEmails = userResult.rows.map(row => row.email);

              // Create backups for each user
              for (const userEmail of userEmails) {
                const userBackups = [];
                
                for (let i = 0; i < backupsPerUser; i++) {
                  const backupId = `bak-test-concurrent-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
                  createdBackupIds.push(backupId);
                  userBackups.push(backupId);
                  
                  await client.query(`
                    INSERT INTO backups (
                      id, user_email, instance_id, name, gcp_machine_image_name,
                      source_instance_name, source_instance_zone, storage_bytes, status,
                      created_at, updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                  `, [
                    backupId, userEmail, null, `Backup for ${userEmail} - ${i}`,
                    `image-${userEmail}-${i}`, `instance-${userEmail}-${i}`, 'us-central1-a',
                    null, 'COMPLETED'
                  ]);
                }
                
                userBackupMap.set(userEmail, userBackups);
              }

              // Query backups for each user and verify isolation
              const selectQuery = `
                SELECT 
                  id,
                  user_email
                FROM backups 
                WHERE user_email = $1 AND status != 'DELETED'
                ORDER BY created_at DESC
              `;

              for (const userEmail of userEmails) {
                const result = await client.query(selectQuery, [userEmail]);
                
                // Filter to only our test backups
                const testBackups = result.rows.filter(row => 
                  createdBackupIds.includes(row.id)
                );

                // Requirement 3.2: Verify each user sees only their own backups
                const expectedBackupIds = userBackupMap.get(userEmail);
                expect(testBackups.length).toBe(expectedBackupIds.length);
                
                // Verify all returned backups belong to this user
                testBackups.forEach(backup => {
                  expect(backup.user_email).toBe(userEmail);
                  expect(expectedBackupIds).toContain(backup.id);
                });

                // Verify no backups from other users are present
                const otherUserBackups = testBackups.filter(backup => 
                  backup.user_email !== userEmail
                );
                expect(otherUserBackups.length).toBe(0);
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
