import pg from 'pg';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const { Client } = pg;

async function setup() {
  const config = {
    user: 'postgres',
    host: '127.0.0.1',
    password: 'postgres',
    port: 5435,
  };

  const client = new Client({ ...config, database: 'postgres' });

  try {
    await client.connect();
    console.log('Connected to default postgres DB');

    // Create database if not exists
    const res = await client.query("SELECT 1 FROM pg_database WHERE datname = 'smart_finance'");
    if (res.rowCount === 0) {
      console.log('Creating database smart_finance...');
      await client.query('CREATE DATABASE smart_finance');
      console.log('Database smart_finance created!');
    } else {
      console.log('Database smart_finance already exists');
    }
  } catch (err) {
    console.error('Error creating database:', err);
  } finally {
    await client.end();
  }

  // Connect to the new database and seed
  const financeClient = new Client({ ...config, database: 'smart_finance' });
  try {
    await financeClient.connect();
    console.log('Connected to smart_finance DB');

    const sqlPath = path.join(process.cwd(), 'init.sql');
    console.log('Reading init.sql from:', sqlPath);
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing seed data...');
    await financeClient.query(sql);
    console.log('✅ Database initialization SUCCESSFUL!');
  } catch (err) {
    console.error('Error seeding database:', err);
  } finally {
    await financeClient.end();
  }
}

setup();
