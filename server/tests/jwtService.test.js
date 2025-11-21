const { generateAccessToken, generateTempToken, verifyToken } = require('../services/jwtService');
const jwt = require('jsonwebtoken');

// Set up test environment
const TEST_SECRET = 'test-secret-key-minimum-32-characters-long';
process.env.JWT_SECRET = TEST_SECRET;

describe('JWT Service', () => {
  describe('generateAccessToken', () => {
    test('should generate token with correct payload structure', () => {
      const payload = {
        email: 'test@example.com',
        name: 'Test User'
      };

      const token = generateAccessToken(payload);

      // Verify token is a string
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);

      // Decode token without verification to check structure
      const decoded = jwt.decode(token);
      expect(decoded).toHaveProperty('email', payload.email);
      expect(decoded).toHaveProperty('name', payload.name);
      expect(decoded).toHaveProperty('iat');
      expect(decoded).toHaveProperty('exp');
    });

    test('should throw error if JWT_SECRET is not configured', () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      const payload = {
        email: 'test@example.com',
        name: 'Test User'
      };

      expect(() => generateAccessToken(payload)).toThrow('JWT_SECRET is not configured');

      // Restore secret
      process.env.JWT_SECRET = originalSecret;
    });
  });

  describe('verifyToken', () => {
    test('should verify valid token and return decoded payload', () => {
      const payload = {
        email: 'test@example.com',
        name: 'Test User'
      };

      const token = generateAccessToken(payload);
      const decoded = verifyToken(token);

      expect(decoded).toHaveProperty('email', payload.email);
      expect(decoded).toHaveProperty('name', payload.name);
      expect(decoded).toHaveProperty('iat');
      expect(decoded).toHaveProperty('exp');
    });

    test('should reject expired token', () => {
      const payload = {
        email: 'test@example.com',
        name: 'Test User'
      };

      // Create token that expires immediately
      const expiredToken = jwt.sign(
        payload,
        TEST_SECRET,
        { algorithm: 'HS256', expiresIn: '0s' }
      );

      // Wait a moment to ensure token is expired
      return new Promise(resolve => setTimeout(resolve, 100)).then(() => {
        expect(() => verifyToken(expiredToken)).toThrow('Token has expired');
      });
    });

    test('should reject invalid token', () => {
      const invalidToken = 'invalid.token.string';

      expect(() => verifyToken(invalidToken)).toThrow('Invalid token');
    });

    test('should reject token with wrong signature', () => {
      const payload = {
        email: 'test@example.com',
        name: 'Test User'
      };

      // Create token with different secret
      const tokenWithWrongSecret = jwt.sign(
        payload,
        'wrong-secret-key',
        { algorithm: 'HS256', expiresIn: '1h' }
      );

      expect(() => verifyToken(tokenWithWrongSecret)).toThrow('Invalid token');
    });

    test('should throw error if JWT_SECRET is not configured', () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      const token = 'some.token.string';

      expect(() => verifyToken(token)).toThrow('JWT_SECRET is not configured');

      // Restore secret
      process.env.JWT_SECRET = originalSecret;
    });
  });

  describe('token expiration', () => {
    test('should set token expiration to 1 hour', () => {
      const payload = {
        email: 'test@example.com',
        name: 'Test User'
      };

      const token = generateAccessToken(payload);
      const decoded = jwt.decode(token);

      // Calculate expected expiration (1 hour from now)
      const expectedExp = decoded.iat + 3600; // 3600 seconds = 1 hour

      expect(decoded.exp).toBe(expectedExp);
    });
  });

  describe('generateTempToken', () => {
    test('should generate temp token with correct payload structure', () => {
      const payload = {
        email: 'test@example.com',
        name: 'Test User'
      };

      const token = generateTempToken(payload);

      // Verify token is a string
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);

      // Decode token without verification to check structure
      const decoded = jwt.decode(token);
      expect(decoded).toHaveProperty('email', payload.email);
      expect(decoded).toHaveProperty('name', payload.name);
      expect(decoded).toHaveProperty('temp', true);
      expect(decoded).toHaveProperty('iat');
      expect(decoded).toHaveProperty('exp');
    });

    test('should set temp token expiration to 5 minutes', () => {
      const payload = {
        email: 'test@example.com',
        name: 'Test User'
      };

      const token = generateTempToken(payload);
      const decoded = jwt.decode(token);

      // Calculate expected expiration (5 minutes from now)
      const expectedExp = decoded.iat + 300; // 300 seconds = 5 minutes

      expect(decoded.exp).toBe(expectedExp);
    });

    test('should include temp flag in payload', () => {
      const payload = {
        email: 'test@example.com',
        name: 'Test User'
      };

      const token = generateTempToken(payload);
      const decoded = verifyToken(token);

      expect(decoded.temp).toBe(true);
    });

    test('should throw error if JWT_SECRET is not configured', () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      const payload = {
        email: 'test@example.com',
        name: 'Test User'
      };

      expect(() => generateTempToken(payload)).toThrow('JWT_SECRET is not configured');

      // Restore secret
      process.env.JWT_SECRET = originalSecret;
    });
  });
});
