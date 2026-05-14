import { Router } from 'express';
import type { Request, Response } from 'express';
import pool from '../db.js';

const router = Router();

// GET /api/status – Kiểm tra trạng thái bảo trì hệ thống (Công khai)
router.get('/', (async (req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT value FROM system_settings WHERE key = 'app_settings'");
    if (result.rows.length === 0) {
      return res.json({ maintenance: false });
    }
    
    const settings = JSON.parse(result.rows[0].value);
    const now = new Date();
    const until = settings.maintenanceUntil ? new Date(settings.maintenanceUntil) : null;
    
    // Nếu chế độ bảo trì đang tắt HOẶC đã quá thời gian bảo trì
    const isMaintenance = settings.maintenanceMode && (!until || now < until);
    
    res.json({ 
      maintenance: isMaintenance,
      message: settings.maintenanceMessage,
      until: settings.maintenanceUntil,
      defaultTheme: settings.defaultTheme
    });
  } catch (err) {
    res.status(500).json({ maintenance: false });
  }
}) as any);

export default router;
