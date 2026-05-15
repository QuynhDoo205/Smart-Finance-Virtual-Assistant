import pkg from 'pg';
const { Pool } = pkg;
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@127.0.0.1:5435/smart_finance' });
async function migrate() {
  try {
    // 1. Update existing nulls to empty string
    await pool.query("UPDATE ngan_sach SET tieu_de = '' WHERE tieu_de IS NULL");
    
    // 2. Set default and not null
    await pool.query("ALTER TABLE ngan_sach ALTER COLUMN tieu_de SET DEFAULT ''");
    await pool.query("ALTER TABLE ngan_sach ALTER COLUMN tieu_de SET NOT NULL");
    
    console.log("Migration successful: tieu_de is now NOT NULL with default ''");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await pool.end();
  }
}
migrate();
