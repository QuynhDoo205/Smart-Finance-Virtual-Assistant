import pkg from 'pg';
const { Pool } = pkg;
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@127.0.0.1:5435/smart_finance' });

async function fix() {
  // 1. Chuyển tất cả giao dịch 'WEB DEV' của Teo Le sang danh_muc_id = 1 (Lương)
  const res = await pool.query(`
    UPDATE giao_dich 
    SET danh_muc_id = 1 
    WHERE nguoi_dung_id = 11 
    AND tieu_de = 'WEB DEV'
  `);
  console.log(`Đã cập nhật ${res.rowCount} giao dịch WEB DEV thành Lương.`);
  
  // 2. Cập nhật luôn Nguồn tiền (Source) nếu nó đang là 'other'
  const resSource = await pool.query(`
    UPDATE nguon_thu 
    SET loai_danh_muc = 'salary' 
    WHERE nguoi_dung_id = 11 
    AND ten_nguon = 'WEB DEV'
  `);
  console.log(`Đã cập nhật Nguồn tiền WEB DEV thành loại Lương.`);

  await pool.end();
}
fix();
