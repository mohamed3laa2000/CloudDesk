const { Pool } = require('pg');

// Database service - manages PostgreSQL database operations
let pool = null;

/**
 * Connect to PostgreSQL database with retry logic
 * Implements exponential backoff with 3 retry attempts
 */
const connect = async () => {
  const maxRetries = 3;
  const baseDelay = 1000; // 1 second
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Create connection pool if it doesn't exist
      if (!pool) {
        pool = new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: {
            rejectUnauthorized: false // Required for Supabase
          }
        });

        // Test the connection
        const client = await pool.connect();
        console.log('Successfully connected to PostgreSQL database');
        client.release();
      }
      
      return pool;
    } catch (error) {
      console.error(`Database connection attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw new Error(`Failed to connect to database after ${maxRetries} attempts: ${error.message}`);
      }
      
      // Exponential backoff: wait 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

/**
 * Check if an email is approved in the database
 * @param {string} email - User email to check
 * @returns {Promise<boolean>} - True if email is approved
 */
const isEmailApproved = async (email) => {
  try {
    if (!pool) {
      throw new Error('Database connection not established. Call connect() first.');
    }

    const query = 'SELECT email FROM approved_users WHERE email = $1';
    const result = await pool.query(query, [email]);
    
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking if email is approved:', error.message);
    throw new Error(`Database query failed: ${error.message}`);
  }
};

/**
 * Update the last login timestamp for a user
 * @param {string} email - User email
 * @returns {Promise<object>} - Updated user record
 */
const updateLastLogin = async (email) => {
  try {
    if (!pool) {
      throw new Error('Database connection not established. Call connect() first.');
    }

    const query = `
      UPDATE approved_users 
      SET last_login = CURRENT_TIMESTAMP 
      WHERE email = $1 
      RETURNING id, email, name, last_login
    `;
    const result = await pool.query(query, [email]);
    
    if (result.rows.length === 0) {
      throw new Error(`User with email ${email} not found in approved_users table`);
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Error updating last login:', error.message);
    throw new Error(`Database query failed: ${error.message}`);
  }
};

/**
 * Disconnect from the database and close the connection pool
 */
const disconnect = async () => {
  if (pool) {
    try {
      await pool.end();
      pool = null;
      console.log('Database connection pool closed');
    } catch (error) {
      console.error('Error closing database connection:', error.message);
      throw error;
    }
  }
};

module.exports = {
  connect,
  isEmailApproved,
  updateLastLogin,
  disconnect
};
