import pkg from 'pg';
const { Pool } = pkg;
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@127.0.0.1:5435/smart_finance' });

async function fix() {
  console.log('--- STARTING DEEP CLEAN ---');
  
  // 1. Tìm ID của Teo Le
  const userRes = await pool.query("SELECT id, ho_ten FROM nguoi_dung WHERE ho_ten = 'Teo Le' OR email LIKE 'levteo01%'");
  if (userRes.rows.length === 0) {
    console.log('Không tìm thấy Teo Le');
    await pool.end();
    return;
  }
  const userId = userRes.rows[0].id;
  console.log(`User ID: ${userId} (${userRes.rows[0].ho_ten})`);

  // 2. Tìm các giao dịch Chi phí hiện có trong tháng 5/2026
  const txRes = await pool.query(`
    SELECT t.id, t.tieu_de, t.so_tien, t.ngay_giao_dich, c.ten_danh_muc 
    FROM giao_dich t
    LEFT JOIN danh_muc c ON t.danh_muc_id = c.id
    WHERE t.nguoi_dung_id = $1 
    AND t.loai_giao_dich IN ('chi_phi', 'expense')
    AND EXTRACT(MONTH FROM t.ngay_giao_dich) = 5
    AND EXTRACT(YEAR FROM t.ngay_giao_dich) = 2026
  `, [userId]);
  
  console.log('Giao dịch chi phí hiện tại:', JSON.stringify(txRes.rows, null, 2));

  // 3. XÓA các giao dịch không hợp lệ (những cái không phải là 100k mà người dùng vừa nhập)
  // Người dùng nói họ "chưa chi tiêu đâu", ngoại trừ cái 100k "Ăn" họ vừa thử.
  const deleteRes = await pool.query(`
    DELETE FROM giao_dich 
    WHERE nguoi_dung_id = $1 
    AND loai_giao_dich IN ('chi_phi', 'expense')
    AND so_tien != 100000
    AND EXTRACT(MONTH FROM ngay_giao_dich) = 5
  `, [userId]);

  console.log(`Đã xóa ${deleteRes.rowCount} giao dịch "ma".`);

  // 4. Reset luôn cột da_chi_tieu trong bảng ngan_sach cho chắc
  await pool.query("UPDATE ngan_sach SET da_chi_tieu = 0 WHERE nguoi_dung_id = $1", [userId]);
  console.log('Đã reset cột da_chi_tieu về 0.');

  await pool.end();
  console.log('--- CLEANUP FINISHED ---');
}

fix();
