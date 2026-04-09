const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'sportsuser',
  password: process.env.DB_PASSWORD || 'sportspass',
  database: process.env.DB_NAME || 'sportsodds',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected pool error:', err.message);
});

const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DB] query executed in ${duration}ms, rows: ${res.rowCount}`);
    }
    return res;
  } catch (err) {
    console.error('[DB] Query error:', err.message, '\nQuery:', text);
    throw err;
  }
};

const testConnection = async () => {
  try {
    await pool.query('SELECT NOW()');
    console.log('[DB] PostgreSQL connected successfully');
  } catch (err) {
    console.error('[DB] Connection failed:', err.message);
    throw err;
  }
};

module.exports = { pool, query, testConnection };
