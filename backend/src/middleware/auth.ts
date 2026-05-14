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
    
    // Kiểm tra Chế độ bảo trì
    const settingsRes = await pool.query("SELECT * FROM system_settings WHERE key = 'app_settings'");
    if (settingsRes.rows.length > 0) {
      const settings = JSON.parse(settingsRes.rows[0].value);
      if (settings.maintenanceMode) {
        // Kiểm tra xem đã hết thời gian bảo trì chưa
        const now = new Date();
        const until = settings.maintenanceUntil ? new Date(settings.maintenanceUntil) : null;
        
        if (until && now > until) {
          // Đã hết hạn bảo trì, cho phép truy cập
          return next();
        }

        // Kiểm tra xem user có phải Admin không
        const userRes = await pool.query("SELECT is_admin FROM nguoi_dung WHERE id = $1", [decoded.id]);
        const isSuperAdmin = decoded.email.toLowerCase() === 'levanteolvt12@gmail.com';
        if (!userRes.rows[0]?.is_admin && !isSuperAdmin) {
          return res.status(503).json({ 
            success: false, 
            message: settings.maintenanceMessage || 'Hệ thống đang bảo trì để nâng cấp. Vui lòng quay lại sau.',
            maintenance: true,
            until: settings.maintenanceUntil
          });
        }
      }
    }

    // Cập nhật thời gian hoạt động cuối cùng (Chạy ngầm)
    pool.query('UPDATE nguoi_dung SET last_active = CURRENT_TIMESTAMP WHERE id = $1', [decoded.id])
      .catch((err: any) => console.error('Lỗi cập nhật last_active:', err));

    next();
  } catch {
    return res.status(403).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};
