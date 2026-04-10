import { Router } from 'express';
import type { Response } from 'express';
import pool from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = Router();

// Tất cả routes yêu cầu authentication
router.use(authMiddleware);

// ============================================================
// PUT /api/user/onboarding – Cập nhật dữ liệu khảo sát ban đầu
// ============================================================
router.put('/onboarding', async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const userId = req.user?.id;
    const { monthlyIncome, expenses } = req.body;

    await client.query('BEGIN');

    // 1. Cập nhật thu nhập và trạng thái onboarding cho user
    await client.query(
      'UPDATE nguoi_dung SET thu_nhap_hang_thang = $1, hoan_thanh_khao_sat = true, ngay_cap_nhat = NOW() WHERE id = $2',
      [monthlyIncome, userId]
    );

    // 2. Tạo ngân sách (Budgets) cho các mục chi phí cố định
    // expenses: [{ categoryName: string, amount: number }]
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    for (const exp of expenses) {
      // Tìm category ID theo tên (hoặc map cứng nếu cần)
      const catRes = await client.query('SELECT id FROM danh_muc WHERE ten_danh_muc = $1', [exp.categoryName]);
      if (catRes.rows.length > 0) {
        const categoryId = catRes.rows[0].id;
        
        // Upsert budget
        await client.query(
          `INSERT INTO ngan_sach (nguoi_dung_id, danh_muc_id, gioi_han_chi_tieu, da_chi_tieu, thang, nam)
           VALUES ($1, $2, $3, 0, $4, $5)
           ON CONFLICT (nguoi_dung_id, danh_muc_id, thang, nam)
           DO UPDATE SET gioi_han_chi_tieu = EXCLUDED.gioi_han_chi_tieu`,
          [userId, categoryId, exp.amount, month, year]
        );
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Onboarding completed successfully',
      user: { ...req.user, onboarding_completed: true }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Onboarding error:', err);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi lưu dữ liệu onboarding' });
  } finally {
    client.release();
  }
});

// ============================================================
// GET /api/user/profile – Lấy thông tin chi tiết user
// ============================================================
router.get('/profile', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const result = await pool.query(
      'SELECT id, ho_ten AS full_name, email, hinh_anh AS avatar_url, thu_nhap_hang_thang AS monthly_income, hoan_thanh_khao_sat AS onboarding_completed, ngay_tao AS created_at FROM nguoi_dung WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
      return;
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
});

export default router;
