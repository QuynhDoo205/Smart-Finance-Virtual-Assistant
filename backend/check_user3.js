import pkg from 'pg';
const { Pool } = pkg;
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@127.0.0.1:5435/smart_finance' });
async function check() {
  const res = await pool.query(`
    SELECT b.id, b.tieu_de, b.gioi_han_chi_tieu, c.ten_danh_muc, b.thang, b.nam
    FROM ngan_sach b 
    JOIN danh_muc c ON b.danh_muc_id = c.id 
    WHERE b.nguoi_dung_id = 3
    ORDER BY b.nam DESC, b.thang DESC
  `);
  console.log(JSON.stringify(res.rows, null, 2));
  await pool.end();
}
check();
