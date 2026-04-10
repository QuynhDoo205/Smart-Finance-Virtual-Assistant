import { Router } from 'express';
import type { Response } from 'express';
import pool from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = Router();

// Tất cả routes dashboard yêu cầu authentication
router.use(authMiddleware);

// ============================================================
// GET /api/dashboard/summary – Tổng quan tài chính tháng hiện tại
// ============================================================
router.get('/summary', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Thu nhập tháng này
    const incomeResult = await pool.query(
      `SELECT COALESCE(SUM(so_tien), 0) as total
       FROM giao_dich 
       WHERE nguoi_dung_id = $1 AND loai_giao_dich = 'thu_nhap' 
       AND EXTRACT(MONTH FROM ngay_giao_dich) = $2 
       AND EXTRACT(YEAR FROM ngay_giao_dich) = $3`,
      [userId, month, year]
    );

    // Chi tiêu tháng này
    const expenseResult = await pool.query(
      `SELECT COALESCE(SUM(so_tien), 0) as total
       FROM giao_dich 
       WHERE nguoi_dung_id = $1 AND loai_giao_dich = 'chi_phi' 
       AND EXTRACT(MONTH FROM ngay_giao_dich) = $2 
       AND EXTRACT(YEAR FROM ngay_giao_dich) = $3`,
      [userId, month, year]
    );

    // Thu nhập tháng trước (để tính % thay đổi)
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevIncomeResult = await pool.query(
      `SELECT COALESCE(SUM(so_tien), 0) as total
       FROM giao_dich 
       WHERE nguoi_dung_id = $1 AND loai_giao_dich = 'thu_nhap' 
       AND EXTRACT(MONTH FROM ngay_giao_dich) = $2 
       AND EXTRACT(YEAR FROM ngay_giao_dich) = $3`,
      [userId, prevMonth, prevYear]
    );

    // Tổng số dư = tất cả thu nhập - tất cả chi tiêu
    const balanceResult = await pool.query(
      `SELECT 
         COALESCE(SUM(CASE WHEN loai_giao_dich = 'thu_nhap' THEN so_tien ELSE -so_tien END), 0) as balance
       FROM giao_dich 
       WHERE nguoi_dung_id = $1`,
      [userId]
    );

    const totalIncome = parseFloat(incomeResult.rows[0]?.total ?? '0');
    const totalExpense = parseFloat(expenseResult.rows[0]?.total ?? '0');
    const totalBalance = parseFloat(balanceResult.rows[0]?.balance ?? '0');
    const prevIncome = parseFloat(prevIncomeResult.rows[0]?.total ?? '0');

    const incomeChange = prevIncome > 0 
      ? Math.round(((totalIncome - prevIncome) / prevIncome) * 100) 
      : 0;

    res.json({
      success: true,
      data: {
        totalBalance,
        totalIncome,
        totalExpense,
        netSavings: totalIncome - totalExpense,
        incomeChangePercent: incomeChange,
        month,
        year,
      }
    });
  } catch (err) {
    console.error('Dashboard summary error:', err);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
});

// ============================================================
// GET /api/dashboard/transactions – Giao dịch gần đây
// ============================================================
router.get('/transactions', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const limit = parseInt(req.query['limit'] as string) || 10;

    const result = await pool.query(
      `SELECT t.id, t.tieu_de AS title, t.so_tien AS amount, 
              CASE WHEN t.loai_giao_dich = 'thu_nhap' THEN 'income' ELSE 'expense' END AS type, 
              t.ghi_chu AS note, t.ngay_giao_dich AS transaction_date,
              c.ten_danh_muc as category_name, c.bieu_tuong as category_icon, c.mau_sac as category_color
       FROM giao_dich t
       LEFT JOIN danh_muc c ON t.danh_muc_id = c.id
       WHERE t.nguoi_dung_id = $1
       ORDER BY t.ngay_giao_dich DESC
       LIMIT $2`,
      [userId, limit]
    );

    res.json({ success: true, data: { transactions: result.rows } });
  } catch (err) {
    console.error('Transactions error:', err);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
});

// ============================================================
// GET /api/dashboard/budget – Phân bổ ngân sách tháng hiện tại
// ============================================================
router.get('/budget', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const result = await pool.query(
      `SELECT b.id, b.gioi_han_chi_tieu AS limit_amount, b.da_chi_tieu AS spent_amount,
              c.ten_danh_muc as category_name, c.bieu_tuong as category_icon, c.mau_sac as category_color,
              ROUND((b.da_chi_tieu / NULLIF(b.gioi_han_chi_tieu, 0) * 100)::numeric, 1) as usage_percent
       FROM ngan_sach b
       LEFT JOIN danh_muc c ON b.danh_muc_id = c.id
       WHERE b.nguoi_dung_id = $1 AND b.thang = $2 AND b.nam = $3
       ORDER BY b.da_chi_tieu DESC`,
      [userId, month, year]
    );

    res.json({ success: true, data: { budgets: result.rows } });
  } catch (err) {
    console.error('Budget error:', err);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
});

// ============================================================
// GET /api/dashboard/savings-goals – Mục tiêu tiết kiệm
// ============================================================
router.get('/savings-goals', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    const result = await pool.query(
      `SELECT id, ten_muc_tieu AS name, so_tien_muc_tieu AS target_amount, so_tien_hien_tai AS current_amount, 
              ngay_het_han AS deadline, bieu_tuong AS icon, mau_sac AS color, trang_thai AS status,
              ROUND((so_tien_hien_tai / NULLIF(so_tien_muc_tieu, 0) * 100)::numeric, 1) as progress_percent
       FROM muc_tieu_tiet_kiem
       WHERE nguoi_dung_id = $1
       ORDER BY ngay_tao DESC`,
      [userId]
    );

    res.json({ success: true, data: { goals: result.rows } });
  } catch (err) {
    console.error('Savings goals error:', err);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
});

// ============================================================
// GET /api/dashboard/chart-data – Dữ liệu biểu đồ 6 tháng gần nhất
// ============================================================
router.get('/chart-data', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    const result = await pool.query(
      `SELECT 
         EXTRACT(MONTH FROM ngay_giao_dich)::int as month,
         EXTRACT(YEAR FROM ngay_giao_dich)::int as year,
         CASE WHEN loai_giao_dich = 'thu_nhap' THEN 'income' ELSE 'expense' END AS type,
         SUM(so_tien) as total
       FROM giao_dich
       WHERE nguoi_dung_id = $1 
         AND ngay_giao_dich >= NOW() - INTERVAL '6 months'
       GROUP BY EXTRACT(MONTH FROM ngay_giao_dich), EXTRACT(YEAR FROM ngay_giao_dich), loai_giao_dich
       ORDER BY year, month`,
      [userId]
    );

    res.json({ success: true, data: { chartData: result.rows } });
  } catch (err) {
    console.error('Chart data error:', err);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
});

export default router;
