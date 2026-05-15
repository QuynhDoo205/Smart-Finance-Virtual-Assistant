import pkg from 'pg';
const { Pool } = pkg;
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@127.0.0.1:5435/smart_finance' });
async function check() {
  const user = await pool.query("SELECT id, ho_ten, email, thu_nhap_hang_thang FROM nguoi_dung WHERE id = 3");
  const budgets = await pool.query(`
    SELECT b.id, b.tieu_de, b.gioi_han_chi_tieu, c.ten_danh_muc, b.thang, b.nam
    FROM ngan_sach b 
    JOIN danh_muc c ON b.danh_muc_id = c.id 
    WHERE b.nguoi_dung_id = 3 AND b.thang = 5 AND b.nam = 2026
  `);
  console.log({ user: user.rows[0], budgets: budgets.rows });
  await pool.end();
}
check();
