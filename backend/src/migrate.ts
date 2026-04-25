import pool from './db.js';

async function migrate() {
  try {
    console.log('🚀 Bắt đầu cập nhật cơ sở dữ liệu...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tin_nhan (
        id SERIAL PRIMARY KEY,
        nguoi_dung_id INTEGER REFERENCES nguoi_dung(id) ON DELETE CASCADE,
        vai_tro VARCHAR(20) CHECK (vai_tro IN ('user', 'assistant')) NOT NULL,
        noi_dung TEXT NOT NULL,
        loai_tin_nhan VARCHAR(20) DEFAULT 'text',
        du_lieu_json JSONB,
        ngay_tao TIMESTAMP DEFAULT NOW()
      );
    `);
    
    console.log('✅ Bảng tin_nhan đã sẵn sàng!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi cập nhật cơ sở dữ liệu:', err);
    process.exit(1);
  }
}

migrate();
