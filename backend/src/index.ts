import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import pool from './db.js';
import authRouter from './routes/auth.js';
import dashboardRouter from './routes/dashboard.js';
import userRouter from './routes/user.js';
import transactionsRouter from './routes/transactions.js';
import aiRouter from './routes/ai.js';
import incomeRouter from './routes/income.js';

const app = express();
const PORT = process.env.PORT || 5001; // Force 5001 as primary fallback

// ============================================================
// Middleware
// ============================================================
app.use(cors({
  origin: true, // Allow all origins for local development (reflects request origin)
  credentials: true,
}));

// Fix Google Auth popup cross-origin issues
app.use((_req, res, next) => {
  res.header('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  // res.header('Cross-Origin-Embedder-Policy', 'require-corp'); // Only if needed, can break some CDN images
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// ============================================================
// Routes
// ============================================================
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: '🚀 Smart Finance Virtual Assistant API v2',
    version: '2.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/*',
      dashboard: '/api/dashboard/*',
    }
  });
});

app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    const dbResult = await pool.query('SELECT NOW() as time, version() as db_version');
    res.json({
      status: 'OK',
      database: 'Connected',
      time: dbResult.rows[0]?.time,
      db_version: (dbResult.rows[0]?.db_version as string)?.split(' ').slice(0, 2).join(' '),
    });
  } catch (err) {
    res.status(500).json({ status: 'ERROR', database: 'Disconnected', error: String(err) });
  }
});

// Mount routers
app.use('/api/auth', authRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/user', userRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/income', incomeRouter);

// ============================================================
// 404 Handler
// ============================================================
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Route không tồn tại' });
});

// ============================================================
// Error Handler
// ============================================================
app.use((err: Error, _req: Request, res: Response) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
});

// ============================================================
// Start Server
// ============================================================
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📦 Environment: ${process.env['NODE_ENV'] || 'development'}`);
  
  // Test DB connection on startup
  pool.query('SELECT NOW()')
    .then(() => console.log('✅ PostgreSQL connected successfully'))
    .catch((err) => console.warn('⚠️  PostgreSQL connection failed:', (err as Error).message));
});

export default app;
