import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../db.js';

export interface AuthRequest extends Request {
  user?: { id: number; email: string };
}

// Khởi tạo Database nếu chưa có
pool.query(`
  CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`).catch(err => console.error("Database Init Error:", err));

export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token xác thực không tồn tại' });
  }

  try {
    const secret = process.env['JWT_SECRET'] || 'fallback_secret';
    const decoded = jwt.verify(token, secret) as { id: number; email: string };
    (req as AuthRequest).user = decoded;
    
    // Cập nhật thời gian hoạt động cuối cùng (Chạy ngầm)
    pool.query('UPDATE nguoi_dung SET last_active = CURRENT_TIMESTAMP WHERE id = $1', [decoded.id])
      .catch((err: any) => console.error('Lỗi cập nhật last_active:', err));

    next();
  } catch {
    return res.status(403).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};
