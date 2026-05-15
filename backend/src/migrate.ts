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
    
    // Cập nhật bảng người dùng để thêm XP và Level
    await pool.query(`
      ALTER TABLE nguoi_dung 
      ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
    `);

    // Tạo bảng danh hiệu (Badge Library)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS danh_hieu (
        id SERIAL PRIMARY KEY,
        ma_danh_hieu VARCHAR(50) UNIQUE NOT NULL,
        ten_danh_hieu VARCHAR(100) NOT NULL,
        mo_ta TEXT,
        icon VARCHAR(50),
        loai VARCHAR(20), -- 'epic', 'legendary', 'mythic', 'common'
        dieu_kien_xp INTEGER DEFAULT 0
      );
    `);

    // Tạo bảng sở hữu danh hiệu
    await pool.query(`
      CREATE TABLE IF NOT EXISTS nguoi_dung_danh_hieu (
        id SERIAL PRIMARY KEY,
        nguoi_dung_id INTEGER REFERENCES nguoi_dung(id) ON DELETE CASCADE,
        danh_hieu_id INTEGER REFERENCES danh_hieu(id) ON DELETE CASCADE,
        ngay_dat_duoc TIMESTAMP DEFAULT NOW(),
        UNIQUE(nguoi_dung_id, danh_hieu_id)
      );
    `);

    // Insert một số danh hiệu mẫu nếu chưa có
    await pool.query(`
      INSERT INTO danh_hieu (ma_danh_hieu, ten_danh_hieu, mo_ta, icon, loai)
      VALUES 
        ('FIRST_BUDGET', 'Kẻ Chinh Phục', 'Hoàn thành thiết lập ngân sách đầu tiên.', 'map', 'common'),
        ('SAVER_PRO', 'Lá Chắn Thuế', 'Giữ chi tiêu dưới mức ngân sách 1 tháng.', 'shield', 'common'),
        ('AI_MASTER', 'Bậc Thầy AI', 'Đã thực hiện ít nhất 5 giao dịch hoặc tương tác AI.', 'zap', 'epic'),
        ('RICH_KID', 'Tự Do Tài Chính', 'Đạt số dư tài khoản trên 100M VNĐ.', 'lock', 'legendary'),
        ('BUG_HUNTER', 'Người Bắt Bugs', 'Đã tham gia khảo sát và đóng góp ý kiến.', 'code', 'mythic')
      ON CONFLICT (ma_danh_hieu) DO NOTHING;
    `);
    
    console.log('✅ Hệ thống Gamification đã được cập nhật vào DB!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi cập nhật cơ sở dữ liệu:', err);
    process.exit(1);
  }
}

migrate();
