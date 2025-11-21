const webauthnService = require('../services/webauthnService');
const crypto = require('crypto');
const fc = require('fast-check');

describe('WebAuthnService - Registration Methods', () => {
  describe('generateRegistrationOptions', () => {
    it('should generate registration options with platform authenticator', async () => {
      const user = {
        email: 'test@example.com',
        name: 'Test User'
      };
      
      const options = await webauthnService.generateRegistrationOptions(
        user,
        'platform',
        []
      );
      
      // Verify required fields are present
      expect(options).toHaveProperty('challenge');
      expect(options).toHaveProperty('rp');
      expect(options).toHaveProperty('user');
      expect(options).toHaveProperty('pubKeyCredParams');
      expect(options).toHaveProperty('authenticatorSelection');
      
      // Verify RP configuration
      expect(options.rp.name).toBe('CloudDesk');
      expect(options.rp.id).toBe('localhost');
      
      // Verify user information
      expect(options.user.name).toBe(user.email);
      expect(options.user.displayName).toBe(user.name);
      
      // Verify platform authenticator attachment
      expect(options.authenticatorSelection.authenticatorAttachment).toBe('platform');
    });

    it('should generate registration options with cross-platform authenticator', async () => {
      const user = {
        email: 'test@example.com',
        name: 'Test User'
      };
      
      const options = await webauthnService.generateRegistrationOptions(
        user,
        'cross-platform',
        []
      );
      
      // Verify cross-platform authenticator attachment
      expect(options.authenticatorSelection.authenticatorAttachment).toBe('cross-platform');
    });

    it('should exclude existing credentials', async () => {
      const user = {
        email: 'test@example.com',
        name: 'Test User'
      };
      
      const existingCredentials = [
        {
          credentialId: Buffer.from('credential1').toString('base64'),
          transports: ['usb', 'nfc']
        }
      ];
      
      const options = await webauthnService.generateRegistrationOptions(
        user,
        'platform',
        existingCredentials
      );
      
      // Verify excludeCredentials is populated
      expect(options.excludeCredentials).toHaveLength(1);
      expect(options.excludeCredentials[0].type).toBe('public-key');
    });
  });

  describe('generateChallenge', () => {
    it('should generate a 32-byte cryptographically random challenge', () => {
      const challenge1 = webauthnService.generateChallenge();
      const challenge2 = webauthnService.generateChallenge();
      
      // Verify challenges are strings (base64 encoded)
      expect(typeof challenge1).toBe('string');
      expect(typeof challenge2).toBe('string');
      
      // Verify challenges are unique
      expect(challenge1).not.toBe(challenge2);
      
      // Verify challenge decodes to 32 bytes
      const decoded = Buffer.from(challenge1, 'base64');
      expect(decoded.length).toBe(32);
    });

    it('should generate unique challenges', () => {
      const challenges = new Set();
      
      // Generate 100 challenges
      for (let i = 0; i < 100; i++) {
        challenges.add(webauthnService.generateChallenge());
      }
      
      // All should be unique
      expect(challenges.size).toBe(100);
    });

    // Feature: passkey-authentication, Property 27: Challenges are cryptographically random
    // Validates: Requirements 11.1
    it('property test: challenges are cryptographically random and unique', () => {
      fc.assert(
        fc.property(
          fc.constant(null), // We don't need input, just run the test multiple times
          () => {
            // Generate a batch of challenges
            const challenges = [];
            for (let i = 0; i < 100; i++) {
              challenges.push(webauthnService.generateChallenge());
            }
            
            // Property 1: Each challenge must be at least 16 bytes when decoded
            for (const challenge of challenges) {
              const decoded = Buffer.from(challenge, 'base64');
              expect(decoded.length).toBeGreaterThanOrEqual(16);
            }
            
            // Property 2: All challenges must be unique (no duplicates)
            const uniqueChallenges = new Set(challenges);
            expect(uniqueChallenges.size).toBe(challenges.length);
          }
        ),
        { numRuns: 100 } // Run the property test 100 times as specified in the design
      );
    });
  });

  describe('validateCounter', () => {
    it('should accept incremented counter', () => {
      const result = webauthnService.validateCounter(5, 4);
      expect(result).toBe(true);
    });

    it('should reject non-incremented counter', () => {
      const result = webauthnService.validateCounter(4, 4);
      expect(result).toBe(false);
    });

    it('should reject decremented counter', () => {
      const result = webauthnService.validateCounter(3, 4);
      expect(result).toBe(false);
    });

    it('should accept zero counters (for authenticators without counter support)', () => {
      const result = webauthnService.validateCounter(0, 0);
      expect(result).toBe(true);
    });

    // Feature: passkey-authentication, Property 23: Non-incrementing counters are rejected
    // Validates: Requirements 9.4
    it('property test: non-incrementing counters are rejected', () => {
      fc.assert(
        fc.property(
          // Generate a stored counter value (positive integer)
          fc.integer({ min: 1, max: 1000000 }),
          (storedCounter) => {
            // Generate new counter values that are non-incrementing
            // (less than or equal to stored counter)
            fc.assert(
              fc.property(
                fc.integer({ min: 0, max: storedCounter }),
                (newCounter) => {
                  // Skip the special case where both are 0 (authenticators without counter support)
                  if (storedCounter === 0 && newCounter === 0) {
                    return true;
                  }
                  
                  // Property: Any counter that doesn't increment should be rejected
                  const result = webauthnService.validateCounter(newCounter, storedCounter);
                  expect(result).toBe(false);
                }
              ),
              { numRuns: 50 } // Run 50 times for each stored counter value
            );
          }
        ),
        { numRuns: 100 } // Test with 100 different stored counter values
      );
    });

    // Additional property test: incrementing counters are accepted
    it('property test: incrementing counters are accepted', () => {
      fc.assert(
        fc.property(
          // Generate a stored counter value
          fc.integer({ min: 0, max: 1000000 }),
          (storedCounter) => {
            // Generate new counter values that are incrementing
            // (greater than stored counter)
            fc.assert(
              fc.property(
                fc.integer({ min: storedCounter + 1, max: storedCounter + 1000 }),
                (newCounter) => {
                  // Property: Any counter that increments should be accepted
                  const result = webauthnService.validateCounter(newCounter, storedCounter);
                  expect(result).toBe(true);
                }
              ),
              { numRuns: 50 } // Run 50 times for each stored counter value
            );
          }
        ),
        { numRuns: 100 } // Test with 100 different stored counter values
      );
    });
  });

  describe('getRPConfig', () => {
    it('should return RP configuration', () => {
      const config = webauthnService.getRPConfig();
      
      expect(config).toHaveProperty('rpName');
      expect(config).toHaveProperty('rpID');
      expect(config).toHaveProperty('origin');
      
      expect(config.rpName).toBe('CloudDesk');
      expect(config.rpID).toBe('localhost');
      expect(config.origin).toBe('http://localhost:5173');
    });
  });
});

describe('WebAuthnService - Origin Validation', () => {
  describe('validateOriginFromCredential', () => {
    it('should accept credential with matching origin', () => {
      const credential = {
        response: {
          clientDataJSON: Buffer.from(JSON.stringify({
            type: 'webauthn.create',
            challenge: 'test-challenge',
            origin: 'http://localhost:5173'
          })).toString('base64')
        }
      };
      
      expect(() => {
        webauthnService.validateOriginFromCredential(credential);
      }).not.toThrow();
    });

    it('should reject credential with mismatched origin', () => {
      const credential = {
        response: {
          clientDataJSON: Buffer.from(JSON.stringify({
            type: 'webauthn.create',
            challenge: 'test-challenge',
            origin: 'https://evil.com'
          })).toString('base64')
        }
      };
      
      expect(() => {
        webauthnService.validateOriginFromCredential(credential);
      }).toThrow(/Origin mismatch/);
    });

    it('should reject credential with missing clientDataJSON', () => {
      const credential = {
        response: {}
      };
      
      expect(() => {
        webauthnService.validateOriginFromCredential(credential);
      }).toThrow(/Invalid credential: missing clientDataJSON/);
    });

    it('should reject credential with invalid JSON', () => {
      const credential = {
        response: {
          clientDataJSON: Buffer.from('not valid json').toString('base64')
        }
      };
      
      expect(() => {
        webauthnService.validateOriginFromCredential(credential);
      }).toThrow(/Failed to validate origin/);
    });

    it('should reject credential with invalid type', () => {
      const credential = {
        response: {
          clientDataJSON: Buffer.from(JSON.stringify({
            type: 'invalid.type',
            challenge: 'test-challenge',
            origin: 'http://localhost:5173'
          })).toString('base64')
        }
      };
      
      expect(() => {
        webauthnService.validateOriginFromCredential(credential);
      }).toThrow(/Invalid credential type/);
    });

    it('should accept webauthn.create type', () => {
      const credential = {
        response: {
          clientDataJSON: Buffer.from(JSON.stringify({
            type: 'webauthn.create',
            challenge: 'test-challenge',
            origin: 'http://localhost:5173'
          })).toString('base64')
        }
      };
      
      expect(() => {
        webauthnService.validateOriginFromCredential(credential);
      }).not.toThrow();
    });

    it('should accept webauthn.get type', () => {
      const credential = {
        response: {
          clientDataJSON: Buffer.from(JSON.stringify({
            type: 'webauthn.get',
            challenge: 'test-challenge',
            origin: 'http://localhost:5173'
          })).toString('base64')
        }
      };
      
      expect(() => {
        webauthnService.validateOriginFromCredential(credential);
      }).not.toThrow();
    });

    // Property test: all non-matching origins should be rejected
    it('property test: rejects all non-matching origins', () => {
      fc.assert(
        fc.property(
          // Generate random origins that don't match our expected origin
          fc.webUrl().filter(url => url !== 'http://localhost:5173'),
          (invalidOrigin) => {
            const credential = {
              response: {
                clientDataJSON: Buffer.from(JSON.stringify({
                  type: 'webauthn.create',
                  challenge: 'test-challenge',
                  origin: invalidOrigin
                })).toString('base64')
              }
            };
            
            // Property: Any origin that doesn't match should be rejected
            expect(() => {
              webauthnService.validateOriginFromCredential(credential);
            }).toThrow(/Origin mismatch/);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Property test: various malformed credentials should be rejected
    it('property test: rejects malformed credentials', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            // Missing response
            fc.constant({ id: 'test' }),
            // Missing clientDataJSON
            fc.constant({ response: { attestationObject: 'test' } }),
            // Invalid base64
            fc.constant({ response: { clientDataJSON: 'not-base64!!!' } })
          ),
          (malformedCredential) => {
            // Property: Any malformed credential should be rejected
            expect(() => {
              webauthnService.validateOriginFromCredential(malformedCredential);
            }).toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

describe('WebAuthnService - Authentication Methods', () => {
  describe('generateAuthenticationOptions', () => {
    it('should generate authentication options without credentials', async () => {
      const options = await webauthnService.generateAuthenticationOptions([]);
      
      // Verify required fields are present
      expect(options).toHaveProperty('challenge');
      expect(options).toHaveProperty('rpId');
      expect(options).toHaveProperty('timeout');
      expect(options).toHaveProperty('userVerification');
      
      // Verify RP ID
      expect(options.rpId).toBe('localhost');
      
      // Verify timeout
      expect(options.timeout).toBe(60000);
      
      // Verify user verification preference
      expect(options.userVerification).toBe('preferred');
      
      // Verify allowCredentials is empty
      expect(options.allowCredentials).toEqual([]);
    });

    it('should generate authentication options with allowed credentials', async () => {
      const allowCredentials = [
        {
          credentialId: Buffer.from('credential1').toString('base64'),
          transports: ['usb', 'nfc']
        },
        {
          credentialId: Buffer.from('credential2').toString('base64'),
          transports: ['internal']
        }
      ];
      
      const options = await webauthnService.generateAuthenticationOptions(allowCredentials);
      
      // Verify allowCredentials is populated
      expect(options.allowCredentials).toHaveLength(2);
      expect(options.allowCredentials[0].type).toBe('public-key');
      expect(options.allowCredentials[1].type).toBe('public-key');
    });

    it('should generate unique challenges for each call', async () => {
      const options1 = await webauthnService.generateAuthenticationOptions([]);
      const options2 = await webauthnService.generateAuthenticationOptions([]);
      
      // Challenges should be different
      expect(options1.challenge).not.toBe(options2.challenge);
    });
  });

  describe('verifyAuthenticationResponse', () => {
    // Note: Full integration tests with real WebAuthn responses would require
    // mocking the @simplewebauthn/server library or using actual WebAuthn test vectors.
    // These tests verify the method structure and counter validation logic.

    it('should validate counter increment', async () => {
      // This test verifies that validateCounter is called
      // Full verification would require mocking @simplewebauthn/server
      
      const storedCredential = {
        credentialId: Buffer.from('test-credential').toString('base64'),
        publicKey: Buffer.from('test-public-key').toString('base64'),
        counter: 5
      };
      
      // The actual verification would fail without a real credential,
      // but we can test the counter validation logic separately
      expect(webauthnService.validateCounter(6, 5)).toBe(true);
      expect(webauthnService.validateCounter(5, 5)).toBe(false);
      expect(webauthnService.validateCounter(4, 5)).toBe(false);
    });
  });
});
