import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/smart_finance',
});

async function migrate() {
  try {
    console.log('Starting migration...');
    await pool.query("ALTER TABLE nguoi_dung ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;");
    await pool.query("UPDATE nguoi_dung SET is_admin = true WHERE email = 'levanteolvt12@gmail.com';");
    console.log('Migration successful: is_admin column added and user elevated.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
