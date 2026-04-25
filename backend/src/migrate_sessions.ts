import pool from './db.js';

async function migrate() {
  try {
    console.log('🚀 Bắt đầu cập nhật cơ sở dữ liệu (Gemini Style)...');
    
    // Tạo bảng phiên chat
    await pool.query(`
      CREATE TABLE IF NOT EXISTS phien_chat (
        id SERIAL PRIMARY KEY,
        nguoi_dung_id INTEGER REFERENCES nguoi_dung(id) ON DELETE CASCADE,
        tieu_de VARCHAR(255) DEFAULT 'Cuộc trò chuyện mới',
        ngay_tao TIMESTAMP DEFAULT NOW(),
        ngay_cap_nhat TIMESTAMP DEFAULT NOW()
      );
    `);

    // Thêm cột phien_chat_id vào bảng tin_nhan nếu chưa có
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM medical_columns WHERE table_name = 'tin_nhan' AND column_name = 'phien_chat_id') THEN
          ALTER TABLE tin_nhan ADD COLUMN phien_chat_id INTEGER REFERENCES phien_chat(id) ON DELETE CASCADE;
        END IF;
      END $$;
    `).catch(() => {
        // Fallback for systems where metadata check fails
        return pool.query(`ALTER TABLE tin_nhan ADD COLUMN IF NOT EXISTS phien_chat_id INTEGER REFERENCES phien_chat(id) ON DELETE CASCADE;`);
    });
    
    console.log('✅ Bảng phien_chat đã sẵn sàng!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi cập nhật cơ sở dữ liệu:', err);
    process.exit(1);
  }
}

migrate();
