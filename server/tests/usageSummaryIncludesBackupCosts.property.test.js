const fc = require('fast-check');
const { Pool } = require('pg');
require('dotenv').config();

/**
 * Feature: gcp-backup-management, Property 8: Usage summary includes backup costs
 * Validates: Requirements 5.1
 * 
 * For any user with backups, the total cost returned by calculateUsageSummary should 
 * equal the sum of instance costs plus backup storage costs.
 */
describe('Usage Summary Includes Backup Costs - Property-Based Tests', () => {
  let pool;
  let dbService;

  // Pricing constants from dbService.js
  const PRICING_CONFIG = {
    basePerCpuPerHour: 788.5,
    basePerRamGbPerHour: 107.9,
    basePerStorageGbPerHour: 2.324,
    gpuExtraPerHour: {
      NONE: 0.0,
      T4: 5810,
      V100: 41168,
      A10: 29880,
      A100: 60922,
      H100: 132800,
      RTX_4090: 46480,
      RTX_A6000: 53120,
    },
    markupRate: 1.0,
  };

  const STORAGE_RATE_PER_GB_HOUR = 2.306; // IDR per GB per hour for backups

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

  describe('Property 8: Usage summary includes backup costs', () => {
    it('should include backup costs in total cost for any user with instances and backups', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random number of instances (0-3)
          fc.array(
            fc.record({
              cpuCores: fc.integer({ min: 1, max: 8 }),
              ramGb: fc.integer({ min: 1, max: 32 }),
              storageGb: fc.integer({ min: 10, max: 500 }),
              gpu: fc.constantFrom('NONE', 'T4', 'V100'),
              hoursElapsed: fc.double({ min: 0.1, max: 100, noNaN: true })
            }),
            { minLength: 0, maxLength: 3 }
          ),
          // Generate random number of backups (1-3)
          fc.array(
            fc.record({
              storageGb: fc.integer({ min: 1, max: 500 }),
              hoursElapsed: fc.double({ min: 0.1, max: 100, noNaN: true })
            }),
            { minLength: 1, maxLength: 3 }
          ),
          async (instances, backups) => {
            const client = await pool.connect();
            const instanceIds = [];
            const backupIds = [];
            
            try {
              // Get a valid user email
              const userResult = await client.query(`SELECT email FROM approved_users LIMIT 1`);
              if (userResult.rows.length === 0) {
                return;
              }
              const validUserEmail = userResult.rows[0].email;

              // Clean up any existing test data for this user
              await client.query(`DELETE FROM backups WHERE user_email = $1 AND id LIKE 'bak-test-%'`, [validUserEmail]);
              await client.query(`DELETE FROM instances WHERE user_email = $1 AND id LIKE 'inst-test-%'`, [validUserEmail]);

              const now = new Date();

              // Insert instances
              for (let i = 0; i < instances.length; i++) {
                const instance = instances[i];
                const instanceId = `inst-test-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 9)}`;
                instanceIds.push(instanceId);

                const createdAt = new Date(now.getTime() - (instance.hoursElapsed * 60 * 60 * 1000));

                const insertQuery = `
                  INSERT INTO instances (
                    id,
                    user_email,
                    name,
                    image_id,
                    status,
                    cpu_cores,
                    ram_gb,
                    storage_gb,
                    gpu,
                    region,
                    created_at,
                    updated_at
                  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                `;

                await client.query(insertQuery, [
                  instanceId,
                  validUserEmail,
                  `Test Instance ${i}`,
                  'windows-general',
                  'RUNNING',
                  instance.cpuCores,
                  instance.ramGb,
                  instance.storageGb,
                  instance.gpu,
                  'SINGAPORE',
                  createdAt,
                  now
                ]);
              }

              // Insert backups
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

              // Calculate usage summary using the service
              const result = await dbService.calculateUsageSummary(validUserEmail);

              // Calculate expected instance costs
              let expectedInstanceCost = 0;
              for (const instance of instances) {
                const cpuCost = instance.cpuCores * PRICING_CONFIG.basePerCpuPerHour;
                const ramCost = instance.ramGb * PRICING_CONFIG.basePerRamGbPerHour;
                const gpuCost = PRICING_CONFIG.gpuExtraPerHour[instance.gpu] || 0;
                const computeHourlyRate = (cpuCost + ramCost + gpuCost) * PRICING_CONFIG.markupRate;
                const storageHourlyRate = instance.storageGb * PRICING_CONFIG.basePerStorageGbPerHour * PRICING_CONFIG.markupRate;
                const totalHourlyRate = computeHourlyRate + storageHourlyRate;
                
                const cost = totalHourlyRate * instance.hoursElapsed;
                expectedInstanceCost += cost;
              }
              expectedInstanceCost = Math.round(expectedInstanceCost * 100) / 100;

              // Calculate expected backup costs
              let expectedBackupCost = 0;
              for (const backup of backups) {
                const cost = backup.storageGb * backup.hoursElapsed * STORAGE_RATE_PER_GB_HOUR;
                expectedBackupCost += cost;
              }
              expectedBackupCost = Math.round(expectedBackupCost * 100) / 100;

              // Calculate expected total cost
              const expectedTotalCost = Math.round((expectedInstanceCost + expectedBackupCost) * 100) / 100;

              // Requirement 5.1: Verify total cost equals sum of instance costs + backup costs
              // Allow small floating point tolerance (5.0 IDR to account for rounding and floating-point precision)
              expect(Math.abs(result.totalCost - expectedTotalCost)).toBeLessThanOrEqual(5.0);

              // Verify backup costs are included in the result
              expect(result.backupStorageCost).toBeDefined();
              expect(result.backupCount).toBe(backups.length);
              
              // Verify backup cost matches expected
              expect(Math.abs(result.backupStorageCost - expectedBackupCost)).toBeLessThanOrEqual(0.10);

              // Clean up test records
              for (const instanceId of instanceIds) {
                await client.query(`DELETE FROM instances WHERE id = $1`, [instanceId]);
              }
              for (const backupId of backupIds) {
                await client.query(`DELETE FROM backups WHERE id = $1`, [backupId]);
              }
            } finally {
              client.release();
            }
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in design
      );
    }, 180000); // 180 second timeout for complex test

    it('should calculate correct total cost when user has only backups (no instances)', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random number of backups (1-3)
          fc.array(
            fc.record({
              storageGb: fc.integer({ min: 1, max: 500 }),
              hoursElapsed: fc.double({ min: 0.1, max: 100, noNaN: true })
            }),
            { minLength: 1, maxLength: 3 }
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

              // Clean up any existing test data for this user
              await client.query(`DELETE FROM backups WHERE user_email = $1 AND id LIKE 'bak-test-%'`, [validUserEmail]);
              await client.query(`DELETE FROM instances WHERE user_email = $1 AND id LIKE 'inst-test-%'`, [validUserEmail]);

              const now = new Date();

              // Insert backups
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

              // Calculate usage summary using the service
              const result = await dbService.calculateUsageSummary(validUserEmail);

              // Calculate expected backup costs
              let expectedBackupCost = 0;
              for (const backup of backups) {
                const cost = backup.storageGb * backup.hoursElapsed * STORAGE_RATE_PER_GB_HOUR;
                expectedBackupCost += cost;
              }
              expectedBackupCost = Math.round(expectedBackupCost * 100) / 100;

              // Requirement 5.1: When no instances exist, total cost should equal backup costs
              expect(Math.abs(result.totalCost - expectedBackupCost)).toBeLessThanOrEqual(0.10);
              expect(Math.abs(result.backupStorageCost - expectedBackupCost)).toBeLessThanOrEqual(0.10);
              expect(result.backupCount).toBe(backups.length);
              
              // Verify instance costs are zero
              expect(result.totalComputeCost).toBe(0);
              expect(result.activeDesktops).toBe(0);

              // Clean up test records
              for (const backupId of backupIds) {
                await client.query(`DELETE FROM backups WHERE id = $1`, [backupId]);
              }
            } finally {
              client.release();
            }
          }
        ),
        { numRuns: 100 }
      );
    }, 180000);

    it('should handle zero backups correctly (total cost equals instance costs only)', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random number of instances (1-3)
          fc.array(
            fc.record({
              cpuCores: fc.integer({ min: 1, max: 8 }),
              ramGb: fc.integer({ min: 1, max: 32 }),
              storageGb: fc.integer({ min: 10, max: 500 }),
              gpu: fc.constantFrom('NONE', 'T4'),
              hoursElapsed: fc.double({ min: 0.1, max: 100, noNaN: true })
            }),
            { minLength: 1, maxLength: 3 }
          ),
          async (instances) => {
            const client = await pool.connect();
            const instanceIds = [];
            
            try {
              // Get a valid user email
              const userResult = await client.query(`SELECT email FROM approved_users LIMIT 1`);
              if (userResult.rows.length === 0) {
                return;
              }
              const validUserEmail = userResult.rows[0].email;

              // Clean up any existing test data for this user
              await client.query(`DELETE FROM backups WHERE user_email = $1 AND id LIKE 'bak-test-%'`, [validUserEmail]);
              await client.query(`DELETE FROM instances WHERE user_email = $1 AND id LIKE 'inst-test-%'`, [validUserEmail]);

              const now = new Date();

              // Insert instances
              for (let i = 0; i < instances.length; i++) {
                const instance = instances[i];
                const instanceId = `inst-test-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 9)}`;
                instanceIds.push(instanceId);

                const createdAt = new Date(now.getTime() - (instance.hoursElapsed * 60 * 60 * 1000));

                const insertQuery = `
                  INSERT INTO instances (
                    id,
                    user_email,
                    name,
                    image_id,
                    status,
                    cpu_cores,
                    ram_gb,
                    storage_gb,
                    gpu,
                    region,
                    created_at,
                    updated_at
                  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                `;

                await client.query(insertQuery, [
                  instanceId,
                  validUserEmail,
                  `Test Instance ${i}`,
                  'windows-general',
                  'RUNNING',
                  instance.cpuCores,
                  instance.ramGb,
                  instance.storageGb,
                  instance.gpu,
                  'SINGAPORE',
                  createdAt,
                  now
                ]);
              }

              // Calculate usage summary using the service
              const result = await dbService.calculateUsageSummary(validUserEmail);

              // Calculate expected instance costs
              let expectedInstanceCost = 0;
              for (const instance of instances) {
                const cpuCost = instance.cpuCores * PRICING_CONFIG.basePerCpuPerHour;
                const ramCost = instance.ramGb * PRICING_CONFIG.basePerRamGbPerHour;
                const gpuCost = PRICING_CONFIG.gpuExtraPerHour[instance.gpu] || 0;
                const computeHourlyRate = (cpuCost + ramCost + gpuCost) * PRICING_CONFIG.markupRate;
                const storageHourlyRate = instance.storageGb * PRICING_CONFIG.basePerStorageGbPerHour * PRICING_CONFIG.markupRate;
                const totalHourlyRate = computeHourlyRate + storageHourlyRate;
                
                const cost = totalHourlyRate * instance.hoursElapsed;
                expectedInstanceCost += cost;
              }
              expectedInstanceCost = Math.round(expectedInstanceCost * 100) / 100;

              // Requirement 5.1: When no backups exist, total cost should equal instance costs
              expect(Math.abs(result.totalCost - expectedInstanceCost)).toBeLessThanOrEqual(5.0);
              
              // Verify backup costs are zero
              expect(result.backupStorageCost).toBe(0);
              expect(result.backupCount).toBe(0);
              expect(result.backupStorageGb).toBe(0);

              // Clean up test records
              for (const instanceId of instanceIds) {
                await client.query(`DELETE FROM instances WHERE id = $1`, [instanceId]);
              }
            } finally {
              client.release();
            }
          }
        ),
        { numRuns: 100 }
      );
    }, 180000);
  });
});
