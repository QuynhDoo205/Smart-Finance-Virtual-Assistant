import pool from '../src/db';

async function migrate() {
  try {
    await pool.query("ALTER TABLE nguoi_dung ADD COLUMN IF NOT EXISTS last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP;");
    console.log("Migration successful: added last_active column");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

migrate();
