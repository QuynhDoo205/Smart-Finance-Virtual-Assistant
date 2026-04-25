import { Router } from 'express';
import type { Response } from 'express';
import pool from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

/**
 * Logic dự báo lương (phỏng theo utils/salaryCalculator.ts)
 */
function calculateForecast(schedule: number[], hourlyRate: number): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let totalHours = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const dayOfWeek = new Date(year, month, day).getDay();
    const scheduleIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    totalHours += schedule[scheduleIndex] ?? 0;
  }
  return totalHours * hourlyRate;
}

// ============================================================
// GET /api/income/sources – Danh sách nguồn thu
// ============================================================
router.get('/sources', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const result = await pool.query(
      'SELECT * FROM nguon_thu WHERE nguoi_dung_id = $1 ORDER BY ngay_tao DESC',
      [userId]
    );

    // Tính toán dự báo cho các nguồn theo lịch trình ngay tại đây
    const sources = result.rows.map(s => {
      if (s.loai_nguon === 'scheduled' && s.lich_lam_viec && s.luong_theo_gio) {
        return {
          ...s,
          so_tien_du_kien: calculateForecast(s.lich_lam_viec, parseFloat(s.luong_theo_gio))
        };
      }
      return s;
    });

    res.json({ success: true, data: { sources } });
  } catch (err) {
    console.error('Get income sources error:', err);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
});

// ============================================================
// POST /api/income/sources – Thêm nguồn thu mới
// ============================================================
router.post('/sources', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { name, type, category, expectedAmount, hourlyRate, schedule } = req.body;

    const result = await pool.query(
      `INSERT INTO nguon_thu (nguoi_dung_id, ten_nguon, loai_nguon, loai_danh_muc, so_tien_du_kien, luong_theo_gio, lich_lam_viec)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, name, type, category, expectedAmount || null, hourlyRate || null, schedule || null]
    );

    res.status(201).json({ success: true, data: { source: result.rows[0] } });
  } catch (err) {
    console.error('Create income source error:', err);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
});

// ============================================================
// DELETE /api/income/sources/:id – Xóa nguồn thu
// ============================================================
router.delete('/sources/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    await pool.query('DELETE FROM nguon_thu WHERE id = $1 AND nguoi_dung_id = $2', [id, userId]);
    res.json({ success: true, message: 'Đã xóa nguồn thu' });
  } catch (err) {
    console.error('Delete income source error:', err);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
});

export default router;
