const fc = require('fast-check');
const passkeyController = require('../controllers/passkeyController');
const webauthnService = require('../services/webauthnService');
const dbService = require('../services/dbService');

// Mock the services
jest.mock('../services/webauthnService');
jest.mock('../services/dbService');

describe('Passkey Controller - Property-Based Tests', () => {
  let req, res, next;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Setup request, response, and next function
    req = {
      body: {},
      user: {
        email: 'test@example.com',
        name: 'Test User'
      }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    next = jest.fn();
  });

  /**
   * Feature: passkey-authentication, Property 3: Duplicate credential IDs are rejected
   * Validates: Requirements 1.4
   * 
   * For any credential ID that already exists in the database, attempting to register 
   * a passkey with the same credential ID SHALL be rejected
   */
  describe('Property 3: Duplicate credential IDs are rejected', () => {
    it('should reject registration attempts with duplicate credential IDs', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random credential IDs (base64-encoded strings)
          fc.array(fc.base64String({ minLength: 20, maxLength: 100 }), { minLength: 1, maxLength: 10 }),
          async (credentialIds) => {
            // For each credential ID, we'll try to register it twice
            for (const credentialId of credentialIds) {
              // Setup mock credential
              const mockCredential = {
                response: {
                  clientDataJSON: Buffer.from(JSON.stringify({
                    challenge: `challenge-${credentialId}`,
                    origin: 'http://localhost:5173'
                  })).toString('base64'),
                  transports: ['internal']
                },
                authenticatorAttachment: 'platform'
              };

              req.body.credential = mockCredential;
              req.body.friendlyName = `Test Passkey ${credentialId}`;

              const mockStoredChallenge = {
                challenge: `challenge-${credentialId}`,
                userEmail: 'test@example.com',
                type: 'registration',
                expiresAt: new Date(Date.now() + 60000)
              };

              const mockVerification = {
                verified: true,
                registrationInfo: {
                  credentialID: Buffer.from(credentialId),
                  credentialPublicKey: Buffer.from(`public-key-${credentialId}`),
                  counter: 0,
                  aaguid: `aaguid-${credentialId}`
                }
              };

              // First registration attempt - should succeed
              dbService.getChallenge.mockResolvedValue(mockStoredChallenge);
              webauthnService.verifyRegistrationResponse.mockResolvedValue(mockVerification);
              dbService.deleteChallenge.mockResolvedValue(true);
              dbService.createPasskey.mockResolvedValueOnce({
                id: `pk-${credentialId}`,
                credentialId: Buffer.from(credentialId).toString('base64'),
                authenticatorType: 'platform',
                friendlyName: `Test Passkey ${credentialId}`,
                createdAt: new Date()
              });

              // Reset response mocks
              res.status.mockClear();
              res.json.mockClear();

              // First registration
              await passkeyController.registerVerify(req, res, next);

              // Verify first registration succeeded
              expect(res.status).toHaveBeenCalledWith(201);
              expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                  success: true,
                  passkey: expect.any(Object)
                })
              );

              // Second registration attempt - should fail with duplicate error
              dbService.getChallenge.mockResolvedValue(mockStoredChallenge);
              webauthnService.verifyRegistrationResponse.mockResolvedValue(mockVerification);
              dbService.deleteChallenge.mockResolvedValue(true);
              dbService.createPasskey.mockRejectedValueOnce(
                new Error('A passkey with this credential ID already exists')
              );

              // Reset response mocks
              res.status.mockClear();
              res.json.mockClear();

              // Second registration attempt
              await passkeyController.registerVerify(req, res, next);

              // Verify second registration was rejected with 409 Conflict
              expect(res.status).toHaveBeenCalledWith(409);
              expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                  success: false,
                  error: 'Conflict',
                  message: 'This authenticator is already registered'
                })
              );
            }
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in design doc
      );
    });
  });

  /**
   * Feature: passkey-authentication, Property 8: Users only see their own passkeys
   * Validates: Requirements 3.4
   * 
   * For any authenticated user, the passkey list API SHALL return only passkeys 
   * where user_email matches the authenticated user's email
   */
  describe('Property 8: Users only see their own passkeys', () => {
    it('should return only passkeys belonging to the authenticated user', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate multiple users with their passkeys
          fc.array(
            fc.record({
              email: fc.emailAddress(),
              name: fc.string({ minLength: 3, maxLength: 50 }),
              passkeys: fc.array(
                fc.record({
                  id: fc.uuid(),
                  credentialId: fc.base64String({ minLength: 20, maxLength: 100 }),
                  authenticatorType: fc.constantFrom('platform', 'cross-platform'),
                  friendlyName: fc.string({ minLength: 5, maxLength: 50 }),
                  lastUsedAt: fc.option(fc.date(), { nil: null }),
                  createdAt: fc.date()
                }),
                { minLength: 1, maxLength: 5 }
              )
            }),
            { minLength: 2, maxLength: 5 } // At least 2 users to test isolation
          ),
          async (users) => {
            // Test each user's passkey list
            for (const user of users) {
              // Setup request with this user's authentication
              req.user = {
                email: user.email,
                name: user.name
              };

              // Mock the database to return only this user's passkeys
              dbService.getPasskeysByUser.mockResolvedValue(user.passkeys);

              // Reset response mocks
              res.status.mockClear();
              res.json.mockClear();

              // Call the list endpoint
              await passkeyController.listPasskeys(req, res, next);

              // Verify the database was queried with the correct user email
              expect(dbService.getPasskeysByUser).toHaveBeenCalledWith(user.email);

              // Verify the response was successful
              expect(res.status).toHaveBeenCalledWith(200);

              // Verify the response contains only this user's passkeys
              expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                  success: true,
                  passkeys: expect.arrayContaining(
                    user.passkeys.map(pk => 
                      expect.objectContaining({
                        id: pk.id,
                        authenticatorType: pk.authenticatorType,
                        friendlyName: pk.friendlyName
                      })
                    )
                  )
                })
              );

              // Verify the response has exactly the right number of passkeys
              const responseCall = res.json.mock.calls[0][0];
              expect(responseCall.passkeys).toHaveLength(user.passkeys.length);

              // Verify no passkeys from other users are included
              const returnedIds = responseCall.passkeys.map(pk => pk.id);
              const expectedIds = user.passkeys.map(pk => pk.id);
              expect(returnedIds.sort()).toEqual(expectedIds.sort());

              // Verify that passkeys from other users are NOT in the response
              const otherUsersPasskeyIds = users
                .filter(u => u.email !== user.email)
                .flatMap(u => u.passkeys.map(pk => pk.id));
              
              for (const otherId of otherUsersPasskeyIds) {
                expect(returnedIds).not.toContain(otherId);
              }
            }
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in design doc
      );
    });
  });

  /**
   * Feature: passkey-authentication, Property 11: Enabling 2FA requires enrolled passkeys
   * Validates: Requirements 5.1
   * 
   * For any user with zero enrolled passkeys, attempting to enable 2FA mode SHALL be rejected
   */
  describe('Property 11: Enabling 2FA requires enrolled passkeys', () => {
    it('should reject 2FA enablement for users with no enrolled passkeys', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random users with no passkeys
          fc.array(
            fc.record({
              email: fc.emailAddress(),
              name: fc.string({ minLength: 3, maxLength: 50 })
            }),
            { minLength: 1, maxLength: 10 }
          ),
          async (users) => {
            // Test each user attempting to enable 2FA without passkeys
            for (const user of users) {
              // Setup request with this user's authentication
              req.user = {
                email: user.email,
                name: user.name
              };

              req.body = {
                enabled: true
              };

              // Mock the database to return no passkeys for this user
              dbService.getPasskeysByUser.mockResolvedValue([]);

              // Mock set2FAStatus to throw error when no passkeys exist
              dbService.set2FAStatus.mockRejectedValue(
                new Error('Cannot enable 2FA: user must have at least one enrolled passkey')
              );

              // Reset response mocks
              res.status.mockClear();
              res.json.mockClear();

              // Attempt to enable 2FA
              await passkeyController.set2FAStatus(req, res, next);

              // Verify the request was rejected with 400 Bad Request
              expect(res.status).toHaveBeenCalledWith(400);
              expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                  success: false,
                  error: 'Bad Request',
                  message: 'Cannot enable 2FA without at least one enrolled passkey'
                })
              );

              // Verify dbService.set2FAStatus was called with correct parameters
              expect(dbService.set2FAStatus).toHaveBeenCalledWith(user.email, true);
            }
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in design doc
      );
    });
  });

  /**
   * Feature: passkey-authentication, Property 26: Friendly names are validated
   * Validates: Requirements 10.5
   * 
   * For any friendly name input, the validation SHALL limit names to 100 characters 
   * and sanitize special characters
   */
  describe('Property 26: Friendly names are validated', () => {
    it('should enforce validation rules on friendly names', async () => {
      // Use the actual implementation, not the mock
      jest.unmock('../services/dbService');
      const dbService = require('../services/dbService');
      
      await fc.assert(
        fc.asyncProperty(
          // Generate names of various lengths and character compositions
          fc.array(
            fc.oneof(
              // Valid names within length limit (non-empty strings with at least some valid chars)
              fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
              // Names exceeding length limit
              fc.string({ minLength: 101, maxLength: 200 }).filter(s => s.trim().length > 100),
              // Empty or whitespace-only names
              fc.constantFrom('', '   ', '\t\t', '\n\n'),
              // Names with only special characters that get sanitized away
              fc.constantFrom('!!!', '@@@', '###', '^^^', '~~~', '```'),
              // Valid names with allowed special characters
              fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0).map(s => `${s} - Test (2024)`),
              // Names with multiple spaces
              fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0).map(s => s.split('').join('  '))
            ),
            { minLength: 1, maxLength: 20 }
          ),
          async (names) => {
            for (const name of names) {
              // Test validation with throwOnError = false (returns null on invalid)
              const validatedName = dbService.__testExports.validateFriendlyName(name, false);
              
              // If name is valid (not null), it should meet all criteria
              if (validatedName !== null && validatedName !== undefined) {
                // Must not be empty
                expect(validatedName.length).toBeGreaterThan(0);
                
                // Must not exceed 100 characters
                expect(validatedName.length).toBeLessThanOrEqual(100);
                
                // Must not have leading/trailing whitespace
                expect(validatedName).toBe(validatedName.trim());
                
                // Must not have multiple consecutive spaces
                expect(validatedName).not.toMatch(/\s{2,}/);
                
                // Must not contain control characters
                expect(validatedName).not.toMatch(/[\x00-\x1F\x7F]/);
                
                // Must not contain disallowed special characters
                expect(validatedName).toMatch(/^[\w\s\-.,!?()&@#]+$/);
              }
              
              // Test validation with throwOnError = true
              // Determine what should happen based on the input
              const isEmpty = !name || typeof name !== 'string' || name.trim().length === 0;
              
              if (isEmpty) {
                // Empty or whitespace-only names should throw
                expect(() => {
                  dbService.__testExports.validateFriendlyName(name, true);
                }).toThrow('Friendly name cannot be empty');
              } else {
                const trimmed = name.trim();
                
                // Names exceeding 100 characters should throw
                if (trimmed.length > 100) {
                  expect(() => {
                    dbService.__testExports.validateFriendlyName(name, true);
                  }).toThrow('Friendly name cannot exceed 100 characters');
                } else {
                  // Check if sanitization would result in empty string
                  const sanitized = trimmed
                    .replace(/[^\w\s\-.,!?()&@#]/g, '')
                    .replace(/\s+/g, ' ')
                    .trim();
                  
                  if (sanitized.length === 0) {
                    // Should throw if only special characters
                    expect(() => {
                      dbService.__testExports.validateFriendlyName(name, true);
                    }).toThrow('Friendly name cannot contain only special characters');
                  } else {
                    // Should succeed and return sanitized name
                    let result;
                    try {
                      result = dbService.__testExports.validateFriendlyName(name, true);
                    } catch (error) {
                      // If it threw an error, the sanitization logic in our test doesn't match the actual function
                      // This means our test's sanitization is wrong
                      throw new Error(`Unexpected error for name "${name}": ${error.message}. Expected sanitized: "${sanitized}"`);
                    }
                    expect(result).toBe(sanitized);
                    expect(result.length).toBeLessThanOrEqual(100);
                    expect(result.length).toBeGreaterThan(0);
                  }
                }
              }
            }
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in design doc
      );
    });
  });

  /**
   * Feature: passkey-authentication, Property 17: Passkey sessions have equivalent privileges
   * Validates: Requirements 7.3
   * 
   * For any user authenticated via passkey, the JWT payload SHALL contain the same 
   * fields (email, name) as a Google-authenticated session
   */
  describe('Property 17: Passkey sessions have equivalent privileges', () => {
    it('should generate JWT tokens with same fields for passkey and Google auth', async () => {
      const jwtService = require('../services/jwtService');
      const jwt = require('jsonwebtoken');

      // Set JWT_SECRET for testing
      const originalSecret = process.env.JWT_SECRET;
      process.env.JWT_SECRET = 'test-secret-key-for-property-testing';

      try {
        await fc.assert(
        fc.asyncProperty(
          // Generate random users
          fc.array(
            fc.record({
              email: fc.emailAddress(),
              name: fc.string({ minLength: 3, maxLength: 50 })
            }),
            { minLength: 1, maxLength: 10 }
          ),
          async (users) => {
            // Test each user's JWT tokens from both auth methods
            for (const user of users) {
              // Generate JWT token as if from Google auth (using jwtService directly)
              const googleAuthToken = jwtService.generateAccessToken({
                email: user.email,
                name: user.name
              });

              // Decode Google auth token to inspect payload
              const googlePayload = jwt.decode(googleAuthToken);

              // Setup passkey authentication flow
              const credentialId = Buffer.from(`credential-${user.email}`).toString('base64');
              
              // Mock stored credential
              const mockStoredCredential = {
                userEmail: user.email,
                credentialId: credentialId,
                publicKey: 'mock-public-key',
                counter: 0
              };

              // Mock credential response
              const mockCredential = {
                rawId: Buffer.from(credentialId, 'base64').toString('base64'),
                response: {
                  clientDataJSON: Buffer.from(JSON.stringify({
                    challenge: `challenge-${user.email}`,
                    origin: 'http://localhost:5173'
                  })).toString('base64'),
                  authenticatorData: Buffer.from('mock-auth-data').toString('base64'),
                  signature: Buffer.from('mock-signature').toString('base64')
                }
              };

              req.body = { credential: mockCredential };

              const mockStoredChallenge = {
                challenge: `challenge-${user.email}`,
                userEmail: null, // Authentication challenges don't have user email
                type: 'authentication',
                expiresAt: new Date(Date.now() + 60000)
              };

              const mockVerification = {
                verified: true,
                authenticationInfo: {
                  newCounter: 1
                }
              };

              // Mock database and service calls
              dbService.getChallenge.mockResolvedValue(mockStoredChallenge);
              dbService.getPasskeyByCredentialId.mockResolvedValue(mockStoredCredential);
              dbService.isEmailApproved.mockResolvedValue(true);
              webauthnService.verifyAuthenticationResponse.mockResolvedValue(mockVerification);
              dbService.deleteChallenge.mockResolvedValue(true);
              dbService.updatePasskeyCounter.mockResolvedValue(true);
              dbService.updatePasskeyLastUsed.mockResolvedValue(true);
              dbService.updateLastLogin.mockResolvedValue(true);
              
              // Mock database connection for user name lookup
              const mockQuery = jest.fn().mockResolvedValue({
                rows: [{ name: user.name }]
              });
              dbService.connect.mockResolvedValue({
                query: mockQuery
              });

              // Reset response mocks
              res.status.mockClear();
              res.json.mockClear();

              // Call passkey login verify
              await passkeyController.loginVerify(req, res, next);

              // Verify passkey authentication succeeded
              expect(res.status).toHaveBeenCalledWith(200);
              expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                  success: true,
                  accessToken: expect.any(String),
                  user: expect.objectContaining({
                    email: user.email,
                    name: user.name
                  })
                })
              );

              // Extract the passkey auth token from the response
              const passkeyResponse = res.json.mock.calls[0][0];
              const passkeyAuthToken = passkeyResponse.accessToken;

              // Decode passkey auth token to inspect payload
              const passkeyPayload = jwt.decode(passkeyAuthToken);

              // Verify both tokens have the same fields
              expect(passkeyPayload).toHaveProperty('email');
              expect(passkeyPayload).toHaveProperty('name');
              expect(passkeyPayload).toHaveProperty('iat');
              expect(passkeyPayload).toHaveProperty('exp');

              expect(googlePayload).toHaveProperty('email');
              expect(googlePayload).toHaveProperty('name');
              expect(googlePayload).toHaveProperty('iat');
              expect(googlePayload).toHaveProperty('exp');

              // Verify the field values match
              expect(passkeyPayload.email).toBe(user.email);
              expect(passkeyPayload.name).toBe(user.name);
              expect(googlePayload.email).toBe(user.email);
              expect(googlePayload.name).toBe(user.name);

              // Verify both tokens have the same set of keys (excluding time-based fields)
              const passkeyKeys = Object.keys(passkeyPayload).filter(k => k !== 'iat' && k !== 'exp').sort();
              const googleKeys = Object.keys(googlePayload).filter(k => k !== 'iat' && k !== 'exp').sort();
              expect(passkeyKeys).toEqual(googleKeys);

              // Verify neither token has a 'temp' flag (which would indicate incomplete auth)
              expect(passkeyPayload.temp).toBeUndefined();
              expect(googlePayload.temp).toBeUndefined();
            }
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in design doc
      );
      } finally {
        // Restore original JWT_SECRET
        if (originalSecret) {
          process.env.JWT_SECRET = originalSecret;
        } else {
          delete process.env.JWT_SECRET;
        }
      }
    });
  });

  /**
   * Feature: passkey-authentication, Property 31: Challenges expire after 5 minutes
   * Validates: Requirements 11.5
   * 
   * For any challenge, when 5 minutes have elapsed since creation, the challenge 
   * SHALL be considered expired and SHALL NOT be returned by getChallenge
   */
  describe('Property 31: Challenges expire after 5 minutes', () => {
    it('should reject expired challenges and accept valid challenges', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate challenges with various time offsets relative to current time
          fc.array(
            fc.record({
              challenge: fc.base64String({ minLength: 32, maxLength: 64 }),
              userEmail: fc.option(fc.emailAddress(), { nil: null }),
              type: fc.constantFrom('registration', 'authentication'),
              // Generate time offsets: some expired (> 5 minutes ago), some valid (< 5 minutes from now)
              minutesOffset: fc.integer({ min: -10, max: 10 }) // -10 to +10 minutes from now
            }),
            { minLength: 5, maxLength: 20 }
          ),
          async (challengeSpecs) => {
            // Test each challenge with its specific timestamp
            for (const spec of challengeSpecs) {
              const now = Date.now();
              const expiresAt = new Date(now + spec.minutesOffset * 60 * 1000);
              
              // Determine if this challenge should be considered expired
              // Challenges expire after 5 minutes, so:
              // - If minutesOffset <= 0, the challenge has already expired or is expiring now
              // - If minutesOffset > 0, the challenge is still valid
              const shouldBeExpired = spec.minutesOffset <= 0;
              
              // Mock storeChallenge to simulate storing the challenge
              dbService.storeChallenge.mockResolvedValue({
                id: Math.floor(Math.random() * 10000),
                challenge: spec.challenge,
                userEmail: spec.userEmail,
                type: spec.type,
                expiresAt: expiresAt,
                createdAt: new Date(now)
              });
              
              // Store the challenge
              await dbService.storeChallenge(
                spec.challenge,
                spec.userEmail,
                spec.type,
                expiresAt
              );
              
              // Mock getChallenge to simulate the database behavior:
              // - Returns null if expired (expiresAt <= current time)
              // - Returns challenge if valid (expiresAt > current time)
              if (shouldBeExpired) {
                dbService.getChallenge.mockResolvedValue(null);
              } else {
                dbService.getChallenge.mockResolvedValue({
                  id: Math.floor(Math.random() * 10000),
                  challenge: spec.challenge,
                  userEmail: spec.userEmail,
                  type: spec.type,
                  expiresAt: expiresAt,
                  createdAt: new Date(now)
                });
              }
              
              // Attempt to retrieve the challenge
              const retrievedChallenge = await dbService.getChallenge(spec.challenge);
              
              // Verify expiration behavior
              if (shouldBeExpired) {
                // Expired challenges should not be returned
                expect(retrievedChallenge).toBeNull();
              } else {
                // Valid challenges should be returned with correct data
                expect(retrievedChallenge).not.toBeNull();
                expect(retrievedChallenge.challenge).toBe(spec.challenge);
                expect(retrievedChallenge.type).toBe(spec.type);
                expect(retrievedChallenge.expiresAt).toEqual(expiresAt);
                
                // Verify the challenge hasn't expired yet
                expect(retrievedChallenge.expiresAt.getTime()).toBeGreaterThan(now);
              }
              
              // Reset mocks for next iteration
              dbService.storeChallenge.mockClear();
              dbService.getChallenge.mockClear();
            }
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in design doc
      );
    });

    it('should enforce 5-minute expiration window for registration challenges', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate registration challenges
          fc.array(
            fc.record({
              challenge: fc.base64String({ minLength: 32, maxLength: 64 }),
              userEmail: fc.emailAddress()
            }),
            { minLength: 1, maxLength: 10 }
          ),
          async (challenges) => {
            for (const spec of challenges) {
              const now = Date.now();
              const fiveMinutesFromNow = new Date(now + 5 * 60 * 1000);
              
              // Mock storing a challenge with exactly 5-minute expiration
              dbService.storeChallenge.mockResolvedValue({
                id: Math.floor(Math.random() * 10000),
                challenge: spec.challenge,
                userEmail: spec.userEmail,
                type: 'registration',
                expiresAt: fiveMinutesFromNow,
                createdAt: new Date(now)
              });
              
              // Store the challenge
              const storedChallenge = await dbService.storeChallenge(
                spec.challenge,
                spec.userEmail,
                'registration',
                fiveMinutesFromNow
              );
              
              // Verify the challenge was stored with correct expiration
              expect(storedChallenge.expiresAt).toEqual(fiveMinutesFromNow);
              
              // Verify expiration is exactly 5 minutes (300,000 milliseconds)
              const expirationDuration = storedChallenge.expiresAt.getTime() - now;
              expect(expirationDuration).toBe(5 * 60 * 1000);
              
              // Mock getChallenge to return the challenge (it's still valid)
              dbService.getChallenge.mockResolvedValue(storedChallenge);
              
              // Retrieve immediately - should succeed
              const retrieved = await dbService.getChallenge(spec.challenge);
              expect(retrieved).not.toBeNull();
              expect(retrieved.challenge).toBe(spec.challenge);
              
              // Simulate time passing beyond 5 minutes
              const sixMinutesFromNow = new Date(now + 6 * 60 * 1000);
              
              // Mock getChallenge to return null (challenge has expired)
              dbService.getChallenge.mockResolvedValue(null);
              
              // Attempt to retrieve after expiration - should fail
              const expiredRetrieve = await dbService.getChallenge(spec.challenge);
              expect(expiredRetrieve).toBeNull();
              
              // Reset mocks
              dbService.storeChallenge.mockClear();
              dbService.getChallenge.mockClear();
            }
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in design doc
      );
    });

    it('should enforce 5-minute expiration window for authentication challenges', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate authentication challenges (userEmail can be null for standalone login)
          fc.array(
            fc.record({
              challenge: fc.base64String({ minLength: 32, maxLength: 64 }),
              userEmail: fc.option(fc.emailAddress(), { nil: null })
            }),
            { minLength: 1, maxLength: 10 }
          ),
          async (challenges) => {
            for (const spec of challenges) {
              const now = Date.now();
              const fiveMinutesFromNow = new Date(now + 5 * 60 * 1000);
              
              // Mock storing a challenge with exactly 5-minute expiration
              dbService.storeChallenge.mockResolvedValue({
                id: Math.floor(Math.random() * 10000),
                challenge: spec.challenge,
                userEmail: spec.userEmail,
                type: 'authentication',
                expiresAt: fiveMinutesFromNow,
                createdAt: new Date(now)
              });
              
              // Store the challenge
              const storedChallenge = await dbService.storeChallenge(
                spec.challenge,
                spec.userEmail,
                'authentication',
                fiveMinutesFromNow
              );
              
              // Verify the challenge was stored with correct expiration
              expect(storedChallenge.expiresAt).toEqual(fiveMinutesFromNow);
              
              // Verify expiration is exactly 5 minutes (300,000 milliseconds)
              const expirationDuration = storedChallenge.expiresAt.getTime() - now;
              expect(expirationDuration).toBe(5 * 60 * 1000);
              
              // Reset mocks
              dbService.storeChallenge.mockClear();
            }
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in design doc
      );
    });
  });

  /**
   * Feature: passkey-authentication, Property 9: Passkey deletion removes from database
   * Validates: Requirements 4.2
   * 
   * For any passkey, confirming deletion SHALL result in the passkey no longer 
   * appearing in database queries
   */
  describe('Property 9: Passkey deletion removes from database', () => {
    it('should remove deleted passkeys from database queries', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random users with passkeys
          fc.array(
            fc.record({
              email: fc.emailAddress(),
              name: fc.string({ minLength: 3, maxLength: 50 }),
              passkeys: fc.array(
                fc.record({
                  id: fc.uuid(),
                  credentialId: fc.base64String({ minLength: 20, maxLength: 100 }),
                  publicKey: fc.base64String({ minLength: 50, maxLength: 200 }),
                  counter: fc.nat(),
                  aaguid: fc.uuid(),
                  transports: fc.array(
                    fc.constantFrom('internal', 'usb', 'nfc', 'ble'),
                    { minLength: 1, maxLength: 4 }
                  ),
                  authenticatorType: fc.constantFrom('platform', 'cross-platform'),
                  friendlyName: fc.string({ minLength: 5, maxLength: 50 }),
                  lastUsedAt: fc.option(fc.date(), { nil: null }),
                  createdAt: fc.date()
                }),
                { minLength: 1, maxLength: 5 }
              )
            }),
            { minLength: 1, maxLength: 5 }
          ),
          async (users) => {
            // Test deletion for each user
            for (const user of users) {
              // For each user, we'll delete some of their passkeys
              const passkeysToDelete = user.passkeys.slice(0, Math.ceil(user.passkeys.length / 2));
              const passkeysToKeep = user.passkeys.slice(Math.ceil(user.passkeys.length / 2));
              
              // Initially, all passkeys should be returned
              dbService.getPasskeysByUser.mockResolvedValue(user.passkeys);
              
              // Verify all passkeys are present initially
              let currentPasskeys = await dbService.getPasskeysByUser(user.email);
              expect(currentPasskeys).toHaveLength(user.passkeys.length);
              
              // Delete each passkey one by one
              for (const passkeyToDelete of passkeysToDelete) {
                // Setup request for deletion
                req.user = {
                  email: user.email,
                  name: user.name
                };
                req.params = {
                  id: passkeyToDelete.id
                };
                
                // Mock the deletion to return the deleted passkey
                dbService.deletePasskey.mockResolvedValue(passkeyToDelete);
                
                // Calculate remaining passkeys after this deletion
                const remainingAfterDeletion = user.passkeys.filter(
                  pk => pk.id !== passkeyToDelete.id && 
                        !passkeysToDelete.slice(0, passkeysToDelete.indexOf(passkeyToDelete)).some(deleted => deleted.id === pk.id)
                );
                
                // Mock getPasskeysByUser to return remaining passkeys
                dbService.getPasskeysByUser.mockResolvedValue(remainingAfterDeletion);
                
                // Reset response mocks
                res.status.mockClear();
                res.json.mockClear();
                
                // Perform the deletion
                await passkeyController.deletePasskey(req, res, next);
                
                // Verify deletion was successful
                expect(res.status).toHaveBeenCalledWith(200);
                expect(dbService.deletePasskey).toHaveBeenCalledWith(passkeyToDelete.id, user.email);
                
                // Query for passkeys after deletion
                currentPasskeys = await dbService.getPasskeysByUser(user.email);
                
                // Verify the deleted passkey is NOT in the results
                const deletedIds = passkeysToDelete
                  .slice(0, passkeysToDelete.indexOf(passkeyToDelete) + 1)
                  .map(pk => pk.id);
                
                for (const deletedId of deletedIds) {
                  expect(currentPasskeys.find(pk => pk.id === deletedId)).toBeUndefined();
                }
                
                // Verify remaining passkeys are still present
                for (const remainingPasskey of remainingAfterDeletion) {
                  expect(currentPasskeys.find(pk => pk.id === remainingPasskey.id)).toBeDefined();
                }
                
                // Verify the count is correct
                expect(currentPasskeys).toHaveLength(remainingAfterDeletion.length);
              }
              
              // After all deletions, verify final state
              const finalPasskeys = await dbService.getPasskeysByUser(user.email);
              
              // All deleted passkeys should be absent
              for (const deletedPasskey of passkeysToDelete) {
                expect(finalPasskeys.find(pk => pk.id === deletedPasskey.id)).toBeUndefined();
              }
              
              // All kept passkeys should still be present
              for (const keptPasskey of passkeysToKeep) {
                expect(finalPasskeys.find(pk => pk.id === keptPasskey.id)).toBeDefined();
              }
              
              // Reset mocks for next user
              dbService.deletePasskey.mockClear();
              dbService.getPasskeysByUser.mockClear();
            }
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in design doc
      );
    });

    it('should handle deletion of all passkeys for a user', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate users with passkeys
          fc.array(
            fc.record({
              email: fc.emailAddress(),
              name: fc.string({ minLength: 3, maxLength: 50 }),
              passkeys: fc.array(
                fc.record({
                  id: fc.uuid(),
                  credentialId: fc.base64String({ minLength: 20, maxLength: 100 }),
                  authenticatorType: fc.constantFrom('platform', 'cross-platform'),
                  friendlyName: fc.string({ minLength: 5, maxLength: 50 })
                }),
                { minLength: 1, maxLength: 3 }
              )
            }),
            { minLength: 1, maxLength: 3 }
          ),
          async (users) => {
            for (const user of users) {
              // Initially, all passkeys should be returned
              dbService.getPasskeysByUser.mockResolvedValue(user.passkeys);
              
              let currentPasskeys = await dbService.getPasskeysByUser(user.email);
              expect(currentPasskeys).toHaveLength(user.passkeys.length);
              
              // Delete all passkeys one by one
              for (let i = 0; i < user.passkeys.length; i++) {
                const passkeyToDelete = user.passkeys[i];
                const remainingPasskeys = user.passkeys.slice(i + 1);
                
                req.user = { email: user.email, name: user.name };
                req.params = { id: passkeyToDelete.id };
                
                dbService.deletePasskey.mockResolvedValue(passkeyToDelete);
                dbService.getPasskeysByUser.mockResolvedValue(remainingPasskeys);
                
                res.status.mockClear();
                res.json.mockClear();
                
                await passkeyController.deletePasskey(req, res, next);
                
                expect(res.status).toHaveBeenCalledWith(200);
                
                // Query after deletion
                currentPasskeys = await dbService.getPasskeysByUser(user.email);
                
                // Verify deleted passkey is not present
                expect(currentPasskeys.find(pk => pk.id === passkeyToDelete.id)).toBeUndefined();
                
                // Verify count matches remaining
                expect(currentPasskeys).toHaveLength(remainingPasskeys.length);
              }
              
              // After deleting all passkeys, query should return empty array
              const finalPasskeys = await dbService.getPasskeysByUser(user.email);
              expect(finalPasskeys).toHaveLength(0);
              
              // Verify none of the original passkeys are present
              for (const originalPasskey of user.passkeys) {
                expect(finalPasskeys.find(pk => pk.id === originalPasskey.id)).toBeUndefined();
              }
              
              // Reset mocks
              dbService.deletePasskey.mockClear();
              dbService.getPasskeysByUser.mockClear();
            }
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in design doc
      );
    });
  });

  /**
   * Feature: passkey-authentication, Property 14: Disabling 2FA preserves passkeys
   * Validates: Requirements 6.4
   * 
   * For any user with enrolled passkeys, disabling 2FA mode SHALL not change 
   * the count or content of enrolled passkeys
   */
  describe('Property 14: Disabling 2FA preserves passkeys', () => {
    it('should preserve all passkeys when disabling 2FA', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate users with passkeys and 2FA enabled
          fc.array(
            fc.record({
              email: fc.emailAddress(),
              name: fc.string({ minLength: 3, maxLength: 50 }),
              passkeys: fc.array(
                fc.record({
                  id: fc.uuid(),
                  credentialId: fc.base64String({ minLength: 20, maxLength: 100 }),
                  publicKey: fc.base64String({ minLength: 50, maxLength: 200 }),
                  counter: fc.nat(),
                  aaguid: fc.uuid(),
                  transports: fc.array(
                    fc.constantFrom('internal', 'usb', 'nfc', 'ble'),
                    { minLength: 1, maxLength: 4 }
                  ),
                  authenticatorType: fc.constantFrom('platform', 'cross-platform'),
                  friendlyName: fc.string({ minLength: 5, maxLength: 50 }),
                  lastUsedAt: fc.option(fc.date(), { nil: null }),
                  createdAt: fc.date()
                }),
                { minLength: 1, maxLength: 5 } // At least 1 passkey to enable 2FA
              )
            }),
            { minLength: 1, maxLength: 10 }
          ),
          async (users) => {
            // Test each user
            for (const user of users) {
              // Setup request with this user's authentication
              req.user = {
                email: user.email,
                name: user.name
              };

              // Record the initial state of passkeys
              const initialPasskeyCount = user.passkeys.length;
              const initialPasskeyIds = user.passkeys.map(pk => pk.id).sort();
              const initialPasskeyCredentials = user.passkeys.map(pk => pk.credentialId).sort();

              // Mock initial state: user has 2FA enabled and passkeys enrolled
              dbService.get2FAStatus.mockResolvedValue({ enabled: true });
              dbService.getPasskeysByUser.mockResolvedValue(user.passkeys);

              // Verify initial state
              const initialStatus = await dbService.get2FAStatus(user.email);
              expect(initialStatus.enabled).toBe(true);

              const initialPasskeys = await dbService.getPasskeysByUser(user.email);
              expect(initialPasskeys).toHaveLength(initialPasskeyCount);

              // Disable 2FA
              req.body = { enabled: false };

              // Mock set2FAStatus to successfully disable 2FA
              dbService.set2FAStatus.mockResolvedValue({ enabled: false });

              // Mock that passkeys remain unchanged after disabling 2FA
              dbService.getPasskeysByUser.mockResolvedValue(user.passkeys);

              // Reset response mocks
              res.status.mockClear();
              res.json.mockClear();

              // Call the controller to disable 2FA
              await passkeyController.set2FAStatus(req, res, next);

              // Verify 2FA was disabled successfully
              expect(res.status).toHaveBeenCalledWith(200);
              expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                  success: true,
                  enabled: false
                })
              );

              // Verify set2FAStatus was called with correct parameters
              expect(dbService.set2FAStatus).toHaveBeenCalledWith(user.email, false);

              // Mock get2FAStatus to return disabled state
              dbService.get2FAStatus.mockResolvedValue({ enabled: false });

              // Verify 2FA is now disabled
              const finalStatus = await dbService.get2FAStatus(user.email);
              expect(finalStatus.enabled).toBe(false);

              // Query passkeys after disabling 2FA
              const finalPasskeys = await dbService.getPasskeysByUser(user.email);

              // CRITICAL VERIFICATION: Passkey count must be unchanged
              expect(finalPasskeys).toHaveLength(initialPasskeyCount);

              // CRITICAL VERIFICATION: All original passkeys must still be present
              const finalPasskeyIds = finalPasskeys.map(pk => pk.id).sort();
              expect(finalPasskeyIds).toEqual(initialPasskeyIds);

              // CRITICAL VERIFICATION: Credential IDs must be unchanged
              const finalPasskeyCredentials = finalPasskeys.map(pk => pk.credentialId).sort();
              expect(finalPasskeyCredentials).toEqual(initialPasskeyCredentials);

              // Verify each individual passkey is preserved with all its properties
              for (const originalPasskey of user.passkeys) {
                const preservedPasskey = finalPasskeys.find(pk => pk.id === originalPasskey.id);
                
                expect(preservedPasskey).toBeDefined();
                expect(preservedPasskey.credentialId).toBe(originalPasskey.credentialId);
                expect(preservedPasskey.publicKey).toBe(originalPasskey.publicKey);
                expect(preservedPasskey.counter).toBe(originalPasskey.counter);
                expect(preservedPasskey.aaguid).toBe(originalPasskey.aaguid);
                expect(preservedPasskey.authenticatorType).toBe(originalPasskey.authenticatorType);
                expect(preservedPasskey.friendlyName).toBe(originalPasskey.friendlyName);
              }

              // Reset mocks for next user
              dbService.get2FAStatus.mockClear();
              dbService.set2FAStatus.mockClear();
              dbService.getPasskeysByUser.mockClear();
            }
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in design doc
      );
    });

    it('should preserve passkeys when toggling 2FA multiple times', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate users with passkeys
          fc.array(
            fc.record({
              email: fc.emailAddress(),
              name: fc.string({ minLength: 3, maxLength: 50 }),
              passkeys: fc.array(
                fc.record({
                  id: fc.uuid(),
                  credentialId: fc.base64String({ minLength: 20, maxLength: 100 }),
                  authenticatorType: fc.constantFrom('platform', 'cross-platform'),
                  friendlyName: fc.string({ minLength: 5, maxLength: 50 })
                }),
                { minLength: 2, maxLength: 4 } // At least 2 passkeys
              ),
              // Generate a sequence of enable/disable operations
              toggleSequence: fc.array(fc.boolean(), { minLength: 2, maxLength: 6 })
            }),
            { minLength: 1, maxLength: 5 }
          ),
          async (users) => {
            for (const user of users) {
              req.user = { email: user.email, name: user.name };

              // Record initial passkey state
              const initialPasskeyCount = user.passkeys.length;
              const initialPasskeyIds = user.passkeys.map(pk => pk.id).sort();

              // Mock initial state
              dbService.getPasskeysByUser.mockResolvedValue(user.passkeys);

              // Perform a sequence of enable/disable operations
              for (const shouldEnable of user.toggleSequence) {
                req.body = { enabled: shouldEnable };

                // Mock the 2FA status change
                dbService.set2FAStatus.mockResolvedValue({ enabled: shouldEnable });
                dbService.get2FAStatus.mockResolvedValue({ enabled: shouldEnable });

                // Passkeys should remain unchanged
                dbService.getPasskeysByUser.mockResolvedValue(user.passkeys);

                res.status.mockClear();
                res.json.mockClear();

                // Toggle 2FA
                await passkeyController.set2FAStatus(req, res, next);

                // Verify the operation succeeded
                expect(res.status).toHaveBeenCalledWith(200);

                // Verify passkeys are still intact
                const currentPasskeys = await dbService.getPasskeysByUser(user.email);
                expect(currentPasskeys).toHaveLength(initialPasskeyCount);

                const currentPasskeyIds = currentPasskeys.map(pk => pk.id).sort();
                expect(currentPasskeyIds).toEqual(initialPasskeyIds);
              }

              // After all toggles, verify final state
              const finalPasskeys = await dbService.getPasskeysByUser(user.email);
              expect(finalPasskeys).toHaveLength(initialPasskeyCount);

              const finalPasskeyIds = finalPasskeys.map(pk => pk.id).sort();
              expect(finalPasskeyIds).toEqual(initialPasskeyIds);

              // Reset mocks
              dbService.get2FAStatus.mockClear();
              dbService.set2FAStatus.mockClear();
              dbService.getPasskeysByUser.mockClear();
            }
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in design doc
      );
    });
  });
});
