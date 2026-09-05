import knex from 'knex';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env is loaded
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const knexConfig = {
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'odoo_db',
    charset: 'utf8mb4',
    dateStrings: true,
  },
  pool: { min: 0, max: 10 },
};

export const db = knex(knexConfig);

/**
 * Test database connectivity
 */
export const testConnection = async () => {
  try {
    await db.raw('SELECT 1 + 1 AS result');
    console.log('✅ MySQL Database connected successfully!');
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to MySQL database:', error.message);
    return false;
  }
};

export default db;
