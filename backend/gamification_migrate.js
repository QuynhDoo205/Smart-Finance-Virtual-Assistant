import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Đọc trực tiếp .env
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const value = parts.slice(1).join('=').trim().replace(/"/g, '');
    env[key] = value;
  }
});

const { Pool } = pg;

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

async function migrate() {
  try {
    console.log('🚀 Bắt đầu cập nhật cơ sở dữ liệu Gamification...');
    
    // 1. Cập nhật bảng người dùng
    await pool.query(`
      ALTER TABLE nguoi_dung 
      ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
    `);
    console.log('✅ Đã thêm cột XP và Level.');

    // 2. Tạo bảng danh hiệu
    await pool.query(`
      CREATE TABLE IF NOT EXISTS danh_hieu (
        id SERIAL PRIMARY KEY,
        ma_danh_hieu VARCHAR(50) UNIQUE NOT NULL,
        ten_danh_hieu VARCHAR(100) NOT NULL,
        mo_ta TEXT,
        icon VARCHAR(50),
        loai VARCHAR(20),
        dieu_kien_xp INTEGER DEFAULT 0
      );
    `);
    console.log('✅ Đã tạo bảng danh_hieu.');

    // 3. Tạo bảng sở hữu danh hiệu
    await pool.query(`
      CREATE TABLE IF NOT EXISTS nguoi_dung_danh_hieu (
        id SERIAL PRIMARY KEY,
        nguoi_dung_id INTEGER REFERENCES nguoi_dung(id) ON DELETE CASCADE,
        danh_hieu_id INTEGER REFERENCES danh_hieu(id) ON DELETE CASCADE,
        ngay_dat_duoc TIMESTAMP DEFAULT NOW(),
        UNIQUE(nguoi_dung_id, danh_hieu_id)
      );
    `);
    console.log('✅ Đã tạo bảng nguoi_dung_danh_hieu.');

    // 4. Insert danh hiệu mẫu
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
    console.log('✅ Đã thêm các danh hiệu mẫu.');
    
    console.log('✨ HOÀN THÀNH CẬP NHẬT GAMIFICATION! ✨');
    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi:', err);
    process.exit(1);
  }
}

migrate();
