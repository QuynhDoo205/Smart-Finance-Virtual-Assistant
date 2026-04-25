import { Router } from 'express';
import type { Response } from 'express';
import pool from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Cấu hình multer để lưu file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/avatars';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req: AuthRequest, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `avatar-${req.user?.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Chỉ cho phép định dạng ảnh (jpg, jpeg, png, webp)'));
  }
});

// Tất cả routes yêu cầu authentication
router.use(authMiddleware);

// ============================================================
// POST /api/user/avatar – Tải ảnh đại diện
// ============================================================
router.post('/avatar', upload.single('avatar'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'Không có file nào được tải lên' });
      return;
    }

    const userId = req.user?.id;
    // URL để truy cập ảnh (đã cấu hình express.static trong index.ts)
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    // Cập nhật đường dẫn ảnh vào database
    await pool.query(
      'UPDATE nguoi_dung SET hinh_anh = $1, ngay_cap_nhat = NOW() WHERE id = $2',
      [avatarUrl, userId]
    );

    res.json({
      success: true,
      message: 'Tải ảnh đại diện thành công',
      avatarUrl
    });
  } catch (err) {
    console.error('Avatar upload error:', err);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi tải ảnh' });
  }
});

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
