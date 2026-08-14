/**
 * Database connection pool (PostgreSQL localhost)
 * Supports both DATABASE_URL and individual DB_* variables.
 */
const { Pool } = require('pg')

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : new Pool({
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'kinora_development',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    })

module.exports = { pool }
