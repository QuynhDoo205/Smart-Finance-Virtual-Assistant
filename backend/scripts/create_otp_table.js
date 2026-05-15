import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS otp_xac_thuc (
        email VARCHAR(150) PRIMARY KEY,
        ho_ten VARCHAR(100) NOT NULL,
        mat_khau_hash VARCHAR(255) NOT NULL,
        otp_code VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        ngay_tao TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Tạo bảng otp_xac_thuc thành công!');
  } catch (err) {
    console.error('Lỗi tạo bảng:', err);
  } finally {
    await pool.end();
  }
}
run();
