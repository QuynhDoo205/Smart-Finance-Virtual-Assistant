import pkg from 'pg';
const { Pool } = pkg;
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@127.0.0.1:5435/smart_finance' });

async function check() {
  const res = await pool.query('SELECT id, tieu_de, so_tien, danh_muc_id FROM giao_dich WHERE nguoi_dung_id = 11 ORDER BY id DESC LIMIT 5');
  console.log(JSON.stringify(res.rows, null, 2));
  await pool.end();
}
check();
