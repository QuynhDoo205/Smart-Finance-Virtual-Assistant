import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Basic Route
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to NovaFinance Virtual Assistant API v2 (PostgreSQL Enabled)' });
});

// Health check endpoint
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    const dbStat = await pool.query('SELECT NOW()');
    res.json({ status: 'OK', database: 'Connected', time: dbStat.rows[0].now });
  } catch (err) {
    res.status(500).json({ status: 'ERROR', database: 'Disconnected' });
  }
});

// Example route for future expansion
app.get('/api/test', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      items: [
        { id: 1, name: 'Sample Item' },
        { id: 2, name: 'Another Item' }
      ]
    }
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// PostgreSQL Database Connection Config
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/smart_finance';

const pool = new Pool({
  connectionString: DATABASE_URL,
});

if (process.env.NODE_ENV !== 'test') {
  pool.connect()
    .then((client) => {
      console.log('✅ Connected to PostgreSQL');
      client.release();
    })
    .catch((err) => console.warn('⚠️ PostgreSQL connection warning:', err.message));
}

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
