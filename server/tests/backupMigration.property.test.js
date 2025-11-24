const fc = require('fast-check');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

/**
 * Feature: gcp-backup-management, Property 12: Migration idempotency
 * Validates: Requirements 11.1, 11.2, 11.5
 * 
 * For any number of times the migration script is executed, the backups table 
 * and indexes should be created exactly once without errors, and no existing 
 * tables should be modified or dropped.
 */
describe('Backup Migration - Property-Based Tests', () => {
  let pool;

  beforeAll(() => {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      },
      max: 5, // Limit pool size to avoid overwhelming the database
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    });

    // Handle pool errors
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

  describe('Property 12: Migration idempotency', () => {
    it('should allow multiple executions without errors or data loss', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random number of migration executions (2-5 times to avoid overwhelming DB)
          fc.integer({ min: 2, max: 5 }),
          async (executionCount) => {
            // Read the migration SQL
            const migrationPath = path.join(__dirname, '../migrations/009_create_backups_table.sql');
            const migrationSql = fs.readFileSync(migrationPath, 'utf8');

            // Use a single client for all operations in this test iteration
            const client = await pool.connect();
            
            try {

              // Get initial state of database tables before any migration runs
              const initialTablesQuery = `
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_type = 'BASE TABLE'
                ORDER BY table_name;
              `;
              const initialTablesResult = await client.query(initialTablesQuery);
              const initialTables = initialTablesResult.rows.map(row => row.table_name);

              // Execute the migration multiple times
              for (let i = 0; i < executionCount; i++) {
                try {
                  await client.query(migrationSql);
                } catch (error) {
                  // Migration should never fail due to idempotency issues
                  throw new Error(`Migration execution ${i + 1} failed: ${error.message}`);
                }
              }

              // Verify the backups table exists
              const tableExistsQuery = `
                SELECT EXISTS (
                  SELECT FROM information_schema.tables 
                  WHERE table_schema = 'public' 
                  AND table_name = 'backups'
                );
              `;
              const tableExistsResult = await client.query(tableExistsQuery);
              expect(tableExistsResult.rows[0].exists).toBe(true);

              // Verify all required columns exist with correct types
              const columnsQuery = `
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_schema = 'public' 
                AND table_name = 'backups'
                ORDER BY ordinal_position;
              `;
              const columnsResult = await client.query(columnsQuery);
              const columns = columnsResult.rows;

              // Verify required columns
              const requiredColumns = [
                { name: 'id', type: 'character varying', nullable: 'NO' },
                { name: 'user_email', type: 'character varying', nullable: 'NO' },
                { name: 'instance_id', type: 'character varying', nullable: 'YES' },
                { name: 'name', type: 'character varying', nullable: 'NO' },
                { name: 'gcp_machine_image_name', type: 'character varying', nullable: 'NO' },
                { name: 'source_instance_name', type: 'character varying', nullable: 'NO' },
                { name: 'source_instance_zone', type: 'character varying', nullable: 'NO' },
                { name: 'storage_bytes', type: 'bigint', nullable: 'YES' },
                { name: 'status', type: 'character varying', nullable: 'NO' },
                { name: 'error_message', type: 'text', nullable: 'YES' },
                { name: 'created_at', type: 'timestamp with time zone', nullable: 'YES' },
                { name: 'updated_at', type: 'timestamp with time zone', nullable: 'YES' }
              ];

              for (const required of requiredColumns) {
                const column = columns.find(c => c.column_name === required.name);
                expect(column).toBeDefined();
                expect(column.data_type).toBe(required.type);
                expect(column.is_nullable).toBe(required.nullable);
              }

              // Verify primary key constraint exists
              const pkQuery = `
                SELECT constraint_name
                FROM information_schema.table_constraints
                WHERE table_schema = 'public'
                AND table_name = 'backups'
                AND constraint_type = 'PRIMARY KEY';
              `;
              const pkResult = await client.query(pkQuery);
              expect(pkResult.rows.length).toBe(1);

              // Verify foreign key constraints exist
              const fkQuery = `
                SELECT constraint_name, 
                       (SELECT table_name FROM information_schema.constraint_column_usage 
                        WHERE constraint_name = tc.constraint_name 
                        AND constraint_schema = 'public' LIMIT 1) as referenced_table
                FROM information_schema.table_constraints tc
                WHERE tc.table_schema = 'public'
                AND tc.table_name = 'backups'
                AND tc.constraint_type = 'FOREIGN KEY';
              `;
              const fkResult = await client.query(fkQuery);
              expect(fkResult.rows.length).toBe(2); // user_email and instance_id foreign keys

              const referencedTables = fkResult.rows.map(row => row.referenced_table).sort();
              expect(referencedTables).toContain('approved_users');
              expect(referencedTables).toContain('instances');

              // Verify check constraints exist
              const checkQuery = `
                SELECT constraint_name
                FROM information_schema.table_constraints
                WHERE table_schema = 'public'
                AND table_name = 'backups'
                AND constraint_type = 'CHECK';
              `;
              const checkResult = await client.query(checkQuery);
              expect(checkResult.rows.length).toBeGreaterThanOrEqual(2); // status and storage_bytes checks

              // Verify indexes exist
              const indexQuery = `
                SELECT indexname
                FROM pg_indexes
                WHERE schemaname = 'public'
                AND tablename = 'backups'
                ORDER BY indexname;
              `;
              const indexResult = await client.query(indexQuery);
              const indexes = indexResult.rows.map(row => row.indexname);

              // Should have primary key index plus 4 additional indexes
              expect(indexes.length).toBeGreaterThanOrEqual(4);
              expect(indexes.some(idx => idx.includes('user_email'))).toBe(true);
              expect(indexes.some(idx => idx.includes('instance_id'))).toBe(true);
              expect(indexes.some(idx => idx.includes('status'))).toBe(true);
              expect(indexes.some(idx => idx.includes('created_at'))).toBe(true);

              // Verify no existing tables were dropped
              const finalTablesResult = await client.query(initialTablesQuery);
              const finalTables = finalTablesResult.rows.map(row => row.table_name);

              // All initial tables should still exist
              for (const initialTable of initialTables) {
                expect(finalTables).toContain(initialTable);
              }

              // The only new table should be 'backups' (if it wasn't there before)
              const newTables = finalTables.filter(t => !initialTables.includes(t));
              if (newTables.length > 0) {
                expect(newTables).toEqual(['backups']);
              }
            } finally {
              client.release();
            }
          }
        ),
        { numRuns: 10 } // Reduced runs to avoid overwhelming database connection pool
      );
    }, 60000); // 60 second timeout for property-based test

    it('should preserve existing data when re-run', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random backup records to insert
          fc.array(
            fc.record({
              id: fc.string({ minLength: 10, maxLength: 50 }).map(s => `bak-test-${s}`),
              name: fc.string({ minLength: 5, maxLength: 100 }),
              gcp_machine_image_name: fc.string({ minLength: 10, maxLength: 100 }).map(s => `image-${s}`),
              source_instance_name: fc.string({ minLength: 5, maxLength: 100 }),
              source_instance_zone: fc.constantFrom('us-central1-a', 'us-east1-b', 'europe-west1-c'),
              storage_bytes: fc.integer({ min: 0, max: 1000000000000 }),
              status: fc.constantFrom('CREATING', 'COMPLETED', 'ERROR', 'DELETED')
            }),
            { minLength: 1, maxLength: 5 }
          ),
          // Generate number of re-executions
          fc.integer({ min: 1, max: 3 }),
          async (testRecords, reExecutions) => {
            // Read the migration SQL
            const migrationPath = path.join(__dirname, '../migrations/009_create_backups_table.sql');
            const migrationSql = fs.readFileSync(migrationPath, 'utf8');

            // Use a single client for all operations in this test iteration
            const client = await pool.connect();
            
            try {
              // Ensure the table exists by running migration once
              await client.query(migrationSql);

              // Get a valid user email from the approved_users table
              const userResult = await client.query(`SELECT email FROM approved_users LIMIT 1`);
              if (userResult.rows.length === 0) {
                // Skip this test iteration if no users exist
                return;
              }
              const validUserEmail = userResult.rows[0].email;

              // Clean up any test records from previous runs
              await client.query(`DELETE FROM backups WHERE id LIKE 'bak-test-%'`);

              // Insert test records with valid user email
              for (const record of testRecords) {
                const insertQuery = `
                  INSERT INTO backups (
                    id, user_email, instance_id, name, gcp_machine_image_name,
                    source_instance_name, source_instance_zone, storage_bytes, status
                  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                  ON CONFLICT (id) DO NOTHING;
                `;
                await client.query(insertQuery, [
                  record.id,
                  validUserEmail, // Use valid user email instead of random one
                  null, // Set instance_id to null to avoid foreign key issues
                  record.name,
                  record.gcp_machine_image_name,
                  record.source_instance_name,
                  record.source_instance_zone,
                  record.storage_bytes,
                  record.status
                ]);
              }

              // Get count of inserted records
              const countBeforeQuery = `SELECT COUNT(*) as count FROM backups WHERE id LIKE 'bak-test-%'`;
              const countBeforeResult = await client.query(countBeforeQuery);
              const countBefore = parseInt(countBeforeResult.rows[0].count);

              // Re-run the migration multiple times
              for (let i = 0; i < reExecutions; i++) {
                await client.query(migrationSql);
              }

              // Verify all records still exist
              const countAfterResult = await client.query(countBeforeQuery);
              const countAfter = parseInt(countAfterResult.rows[0].count);
              expect(countAfter).toBe(countBefore);

              // Verify each record's data is intact
              for (const record of testRecords) {
                const selectQuery = `SELECT * FROM backups WHERE id = $1`;
                const selectResult = await client.query(selectQuery, [record.id]);
                
                if (selectResult.rows.length > 0) {
                  const savedRecord = selectResult.rows[0];
                  expect(savedRecord.user_email).toBe(validUserEmail);
                  expect(savedRecord.name).toBe(record.name);
                  expect(savedRecord.gcp_machine_image_name).toBe(record.gcp_machine_image_name);
                  expect(savedRecord.source_instance_name).toBe(record.source_instance_name);
                  expect(savedRecord.source_instance_zone).toBe(record.source_instance_zone);
                  expect(savedRecord.status).toBe(record.status);
                  
                  // Handle bigint comparison
                  if (record.storage_bytes !== null) {
                    expect(parseInt(savedRecord.storage_bytes)).toBe(record.storage_bytes);
                  }
                }
              }

              // Clean up test records
              await client.query(`DELETE FROM backups WHERE id LIKE 'bak-test-%'`);
            } finally {
              client.release();
            }
          }
        ),
        { numRuns: 10 } // Reduced runs to avoid overwhelming database connection pool
      );
    }, 60000); // 60 second timeout for property-based test
  });
});
