import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env['DATABASE_URL'] || 'postgresql://postgres:postgres@localhost:5432/smart_finance',
  ssl: process.env['NODE_ENV'] === 'production' ? { rejectUnauthorized: false } : undefined,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export default pool;
