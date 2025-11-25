const fc = require('fast-check');
const { Pool } = require('pg');
require('dotenv').config();

/**
 * Feature: gcp-backup-management, Property 5: Backup record storage completeness
 * Validates: Requirements 7.2, 7.3, 7.4, 7.5, 7.6, 7.7
 * 
 * For any backup created in the database, all required fields (unique ID, user email, 
 * instance ID, GCP machine image name, storage bytes, creation timestamp) should be 
 * stored and retrievable.
 */
describe('Backup Record Storage - Property-Based Tests', () => {
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

  describe('Property 5: Backup record storage completeness', () => {
    it('should store and retrieve all required fields for any backup', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random backup data
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }),
            gcpMachineImageName: fc.string({ minLength: 10, maxLength: 100 }).map(s => `image-${s.replace(/[^a-z0-9-]/g, '')}`),
            sourceInstanceName: fc.string({ minLength: 5, maxLength: 100 }).map(s => `instance-${s.replace(/[^a-z0-9-]/g, '')}`),
            sourceInstanceZone: fc.constantFrom('us-central1-a', 'us-east1-b', 'europe-west1-c', 'asia-east1-a')
          }),
          async (backupData) => {
            const client = await pool.connect();
            
            try {
              // Get a valid user email and instance ID from the database
              const userResult = await client.query(`SELECT email FROM approved_users LIMIT 1`);
              if (userResult.rows.length === 0) {
                // Skip this test iteration if no users exist
                return;
              }
              const validUserEmail = userResult.rows[0].email;

              // Get a valid instance ID (or use null if none exist)
              const instanceResult = await client.query(`SELECT id FROM instances WHERE user_email = $1 LIMIT 1`, [validUserEmail]);
              const validInstanceId = instanceResult.rows.length > 0 ? instanceResult.rows[0].id : null;

              // Generate unique backup ID
              const backupId = `bak-test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

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
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                RETURNING *;
              `;

              const insertResult = await client.query(insertQuery, [
                backupId,
                validUserEmail,
                validInstanceId,
                backupData.name,
                backupData.gcpMachineImageName,
                backupData.sourceInstanceName,
                backupData.sourceInstanceZone,
                null, // storage_bytes initially null
                'CREATING'
              ]);

              expect(insertResult.rows.length).toBe(1);
              const insertedRecord = insertResult.rows[0];

              // Retrieve the backup record
              const selectQuery = `SELECT * FROM backups WHERE id = $1`;
              const selectResult = await client.query(selectQuery, [backupId]);

              expect(selectResult.rows.length).toBe(1);
              const retrievedRecord = selectResult.rows[0];

              // Requirement 7.2: Verify unique backup ID is stored and retrievable
              expect(retrievedRecord.id).toBe(backupId);
              expect(retrievedRecord.id).toBeTruthy();
              expect(retrievedRecord.id).toMatch(/^bak-/);

              // Requirement 7.3: Verify user email is stored and retrievable
              expect(retrievedRecord.user_email).toBe(validUserEmail);
              expect(retrievedRecord.user_email).toBeTruthy();

              // Requirement 7.4: Verify instance ID is stored and retrievable
              if (validInstanceId) {
                expect(retrievedRecord.instance_id).toBe(validInstanceId);
              } else {
                expect(retrievedRecord.instance_id).toBeNull();
              }

              // Requirement 7.5: Verify GCP machine image name is stored and retrievable
              expect(retrievedRecord.gcp_machine_image_name).toBe(backupData.gcpMachineImageName);
              expect(retrievedRecord.gcp_machine_image_name).toBeTruthy();

              // Requirement 7.6: Verify storage size in bytes is stored and retrievable
              // Initially null, but the field should exist
              expect(retrievedRecord).toHaveProperty('storage_bytes');
              expect(retrievedRecord.storage_bytes).toBeNull();

              // Requirement 7.7: Verify creation timestamp is stored and retrievable
              expect(retrievedRecord.created_at).toBeTruthy();
              expect(retrievedRecord.created_at).toBeInstanceOf(Date);

              // Verify all other required fields are present
              expect(retrievedRecord.name).toBe(backupData.name);
              expect(retrievedRecord.source_instance_name).toBe(backupData.sourceInstanceName);
              expect(retrievedRecord.source_instance_zone).toBe(backupData.sourceInstanceZone);
              expect(retrievedRecord.status).toBe('CREATING');
              expect(retrievedRecord.updated_at).toBeTruthy();
              expect(retrievedRecord.updated_at).toBeInstanceOf(Date);

              // Clean up test record
              await client.query(`DELETE FROM backups WHERE id = $1`, [backupId]);
            } finally {
              client.release();
            }
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in design
      );
    }, 60000); // 60 second timeout

    it('should store and retrieve storage_bytes when provided', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random backup data with storage bytes
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }),
            gcpMachineImageName: fc.string({ minLength: 10, maxLength: 100 }).map(s => `image-${s.replace(/[^a-z0-9-]/g, '')}`),
            sourceInstanceName: fc.string({ minLength: 5, maxLength: 100 }).map(s => `instance-${s.replace(/[^a-z0-9-]/g, '')}`),
            sourceInstanceZone: fc.constantFrom('us-central1-a', 'us-east1-b', 'europe-west1-c'),
            storageBytes: fc.integer({ min: 0, max: 1000000000000 }) // 0 to 1TB in bytes
          }),
          async (backupData) => {
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

              // Insert backup record with storage_bytes
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
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                RETURNING *;
              `;

              await client.query(insertQuery, [
                backupId,
                validUserEmail,
                null,
                backupData.name,
                backupData.gcpMachineImageName,
                backupData.sourceInstanceName,
                backupData.sourceInstanceZone,
                backupData.storageBytes,
                'COMPLETED'
              ]);

              // Retrieve the backup record
              const selectQuery = `SELECT * FROM backups WHERE id = $1`;
              const selectResult = await client.query(selectQuery, [backupId]);

              expect(selectResult.rows.length).toBe(1);
              const retrievedRecord = selectResult.rows[0];

              // Requirement 7.6: Verify storage_bytes is stored and retrievable with correct value
              expect(retrievedRecord.storage_bytes).not.toBeNull();
              // PostgreSQL returns bigint as string, so we need to parse it
              expect(parseInt(retrievedRecord.storage_bytes)).toBe(backupData.storageBytes);

              // Clean up test record
              await client.query(`DELETE FROM backups WHERE id = $1`, [backupId]);
            } finally {
              client.release();
            }
          }
        ),
        { numRuns: 100 }
      );
    }, 60000);

    it('should maintain referential integrity with user_email foreign key', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }),
            gcpMachineImageName: fc.string({ minLength: 10, maxLength: 100 }).map(s => `image-${s.replace(/[^a-z0-9-]/g, '')}`),
            sourceInstanceName: fc.string({ minLength: 5, maxLength: 100 }).map(s => `instance-${s.replace(/[^a-z0-9-]/g, '')}`),
            sourceInstanceZone: fc.constantFrom('us-central1-a', 'us-east1-b', 'europe-west1-c')
          }),
          async (backupData) => {
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
                  status
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *;
              `;

              await client.query(insertQuery, [
                backupId,
                validUserEmail,
                null,
                backupData.name,
                backupData.gcpMachineImageName,
                backupData.sourceInstanceName,
                backupData.sourceInstanceZone,
                null,
                'CREATING'
              ]);

              // Requirement 7.3: Verify foreign key relationship - backup should reference valid user
              const joinQuery = `
                SELECT b.*, u.email as verified_email
                FROM backups b
                INNER JOIN approved_users u ON b.user_email = u.email
                WHERE b.id = $1
              `;
              const joinResult = await client.query(joinQuery, [backupId]);

              expect(joinResult.rows.length).toBe(1);
              expect(joinResult.rows[0].verified_email).toBe(validUserEmail);

              // Clean up test record
              await client.query(`DELETE FROM backups WHERE id = $1`, [backupId]);
            } finally {
              client.release();
            }
          }
        ),
        { numRuns: 100 }
      );
    }, 60000);
  });
});
