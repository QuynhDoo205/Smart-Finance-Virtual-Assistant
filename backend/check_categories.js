import pkg from 'pg';
const { Pool } = pkg;
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@127.0.0.1:5435/smart_finance' });

async function check() {
  const res = await pool.query('SELECT id, ten_danh_muc FROM danh_muc ORDER BY id');
  console.log(JSON.stringify(res.rows, null, 2));
  await pool.end();
}
check();
