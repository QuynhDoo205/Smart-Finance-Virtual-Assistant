import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Thêm cột emergency_fund_rate (%) vào nguoi_dung nếu chưa có
    await client.query(`
      ALTER TABLE nguoi_dung
      ADD COLUMN IF NOT EXISTS emergency_fund_rate DECIMAL(5,2) DEFAULT 10.00;
    `);
    console.log('✅ Added emergency_fund_rate column to nguoi_dung');

    // 2. Thêm cột is_admin nếu chưa có (cần thiết cho AdminSettings)
    await client.query(`
      ALTER TABLE nguoi_dung
      ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
    `);
    console.log('✅ Added is_admin column if missing');

    await client.query('COMMIT');
    console.log('✅ Migration hoàn tất!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration thất bại:', err.message);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
