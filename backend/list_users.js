import pkg from 'pg';
const { Pool } = pkg;
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@127.0.0.1:5435/smart_finance' });
async function check() {
  const res = await pool.query("SELECT id, ho_ten, email FROM nguoi_dung");
  console.log(res.rows);
  await pool.end();
}
check();
