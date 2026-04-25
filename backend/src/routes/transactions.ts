import { Router } from 'express';
import type { Response } from 'express';
import pool from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = Router();

// Tất cả routes yêu cầu authentication
router.use(authMiddleware);

// ============================================================
// POST /api/transactions – Lưu giao dịch mới (Tay/AI)
// ============================================================
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const userId = req.user?.id;
    const { title, amount, type, categoryId, note, date } = req.body;

    if (!title || !amount || !type) {
      res.status(400).json({ success: false, message: 'Thiếu thông tin giao dịch bắt buộc' });
      return;
    }

    await client.query('BEGIN');

    // 1. Chèn giao dịch
    const transResult = await client.query(
      `INSERT INTO giao_dich (nguoi_dung_id, danh_muc_id, tieu_de, so_tien, loai_giao_dich, ghi_chu, ngay_giao_dich)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, categoryId || null, title, amount, type, note || '', date || new Date()]
    );

    const transaction = transResult.rows[0];

    // 2. Nếu là khoản chi, cập nhật thực chi (da_chi_tieu) trong ngân sách tháng này
    if (type === 'chi_phi' && categoryId) {
      const transDate = new Date(date || new Date());
      const month = transDate.getMonth() + 1;
      const year = transDate.getFullYear();

      await client.query(
        `UPDATE ngan_sach 
         SET da_chi_tieu = da_chi_tieu + $1
         WHERE nguoi_dung_id = $2 AND danh_muc_id = $3 AND thang = $4 AND nam = $5`,
        [amount, userId, categoryId, month, year]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      data: { transaction }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create transaction error:', err);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi lưu giao dịch' });
  } finally {
    client.release();
  }
});

// ============================================================
// GET /api/transactions – Danh sách giao dịch của user
// ============================================================
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const limit = parseInt(req.query['limit'] as string) || 50;

    const result = await pool.query(
      `SELECT t.*, c.ten_danh_muc, c.bieu_tuong as category_icon, c.mau_sac as category_color
       FROM giao_dich t
       LEFT JOIN danh_muc c ON t.danh_muc_id = c.id
       WHERE t.nguoi_dung_id = $1
       ORDER BY t.ngay_giao_dich DESC
       LIMIT $2`,
      [userId, limit]
    );

    res.json({
      success: true,
      data: { transactions: result.rows }
    });
  } catch (err) {
    console.error('Get transactions error:', err);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
});

// ============================================================
// DELETE /api/transactions/:id – Xóa giao dịch
// ============================================================
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    await client.query('BEGIN');

    // Lấy thông tin giao dịch trước khi xóa để hoàn phí cho ngân sách
    const checkRes = await client.query(
      'SELECT so_tien, loai_giao_dich, danh_muc_id, ngay_giao_dich FROM giao_dich WHERE id = $1 AND nguoi_dung_id = $2',
      [id, userId]
    );

    if (checkRes.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Giao dịch không tồn tại' });
      return;
    }

    const { so_tien, loai_giao_dich, danh_muc_id, ngay_giao_dich } = checkRes.rows[0];

    // Xóa giao dịch
    await client.query('DELETE FROM giao_dich WHERE id = $1 AND nguoi_dung_id = $2', [id, userId]);

    // Hoàn lại tiền vào ngân sách tương ứng
    if (loai_giao_dich === 'chi_phi' && danh_muc_id) {
      const transDate = new Date(ngay_giao_dich);
      const month = transDate.getMonth() + 1;
      const year = transDate.getFullYear();

      await client.query(
        `UPDATE ngan_sach 
         SET da_chi_tieu = GREATEST(0, da_chi_tieu - $1)
         WHERE nguoi_dung_id = $2 AND danh_muc_id = $3 AND thang = $4 AND nam = $5`,
        [so_tien, userId, danh_muc_id, month, year]
      );
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'Đã xóa giao dịch' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Delete transaction error:', err);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  } finally {
    client.release();
  }
});

export default router;
