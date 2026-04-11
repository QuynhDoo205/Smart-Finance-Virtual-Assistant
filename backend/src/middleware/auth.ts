import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: { id: number; email: string };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ success: false, message: 'Token xác thực không tồn tại' });
    return;
  }

  try {
    const secret = process.env['JWT_SECRET'] || 'fallback_secret';
    const decoded = jwt.verify(token, secret) as { id: number; email: string };
    req.user = decoded;
    next();
  } catch {
    res.status(403).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};
