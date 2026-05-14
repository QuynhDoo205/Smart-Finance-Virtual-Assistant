import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/smart_finance',
});

async function check() {
  const res = await pool.query("SELECT id, ho_ten, email, is_admin FROM nguoi_dung WHERE email = 'levanteolvt12@gmail.com'");
  console.log(JSON.stringify(res.rows, null, 2));
  process.exit(0);
}
check();
