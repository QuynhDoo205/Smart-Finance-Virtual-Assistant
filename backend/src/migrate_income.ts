  import pool from './db.js';

async function migrate() {
  try {
    console.log('🚀 Đang khởi tạo bảng nguon_thu...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS nguon_thu (
        id SERIAL PRIMARY KEY,
        nguoi_dung_id INTEGER REFERENCES nguoi_dung(id) ON DELETE CASCADE,
        ten_nguon VARCHAR(255) NOT NULL,
        loai_nguon VARCHAR(50) DEFAULT 'variable',
        loai_danh_muc VARCHAR(50) DEFAULT 'other',
        so_tien_du_kien NUMERIC(15, 2) DEFAULT 0,
        luong_theo_gio NUMERIC(15, 2) DEFAULT 0,
        lich_lam_viec INTEGER[] DEFAULT '{0,0,0,0,0,0,0}',
        ngay_tao TIMESTAMP DEFAULT NOW(),
        ngay_cap_nhat TIMESTAMP DEFAULT NOW()
      );
    `);
    
    console.log('✅ Bảng nguon_thu đã được tạo thành công!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi tạo bảng nguon_thu:', err);
    process.exit(1);
  }
}

migrate();
