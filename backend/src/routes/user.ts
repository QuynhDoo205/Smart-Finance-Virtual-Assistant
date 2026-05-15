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

    // 2. Tạo/Cập nhật ngân sách (Budgets) cho các mục chi phí cố định
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Lấy tất cả danh mục có sẵn để fallback
    const allCategoriesRes = await client.query('SELECT id, ten_danh_muc FROM danh_muc ORDER BY id');
    const allCategories: { id: number; ten_danh_muc: string }[] = allCategoriesRes.rows;
    
    // Tìm danh mục "Khác" để dùng làm fallback
    const khaCategory = allCategories.find(c => 
      c.ten_danh_muc.toLowerCase().includes('khác') || 
      c.ten_danh_muc.toLowerCase().includes('khac') ||
      c.ten_danh_muc.toLowerCase().includes('other')
    );
    const fallbackCategoryId = khaCategory?.id || allCategories[0]?.id;

    // Xóa các ngân sách cố định cũ để cập nhật mới hoàn toàn
    // Giữ lại: các bản ghi có tiêu đề TRỐNG và thuộc 5 ID lọ chuẩn
    const jarIds = [4, 3, 9, 7, 8]; 
    await client.query(
      `DELETE FROM ngan_sach 
       WHERE nguoi_dung_id = $1 AND thang = $2 AND nam = $3
       AND (
         danh_muc_id NOT IN (SELECT unnest($4::int[]))
         OR (tieu_de IS NOT NULL AND tieu_de <> '')
       )`,
      [userId, month, year, jarIds]
    );

    for (const exp of expenses) {
      // Sử dụng category (Nhà ở, Tiện ích...) để tìm đúng danh_muc
      const categoryAliasMap: Record<string, string[]> = {
        'Nhà ở':    ['nhà ở', 'nhà ở', 'housing', 'nhà'],
        'Tiện ích':  ['tiện ích', 'utilities', 'công ích', 'điện', 'nước'],
        'Giải trí': ['giải trí', 'entertainment'],
        'Học tập':  ['học tập', 'giáo dục', 'education'],
        'Bảo hiểm': ['bảo hiểm', 'insurance'],
        'Khác':     ['khác', 'other'],
      };

      const searchTerms = [
        exp.category,
        exp.categoryName,
        ...(categoryAliasMap[exp.category] || []),
      ].filter(Boolean);

      let categoryId = fallbackCategoryId;
      for (const term of searchTerms) {
        const catRes = await client.query(
          'SELECT id FROM danh_muc WHERE LOWER(ten_danh_muc) LIKE LOWER($1) LIMIT 1',
          [`%${term}%`]
        );
        if (catRes.rows.length > 0) {
          categoryId = catRes.rows[0].id;
          break;
        }
      }
      
      if (!categoryId) continue;

      // Upsert budget – Sử dụng tieu_de để phân biệt các khoản trong cùng 1 danh mục
      await client.query(
        `INSERT INTO ngan_sach (nguoi_dung_id, danh_muc_id, tieu_de, gioi_han_chi_tieu, da_chi_tieu, thang, nam)
         VALUES ($1, $2, $3, $4, 0, $5, $6)
         ON CONFLICT (nguoi_dung_id, danh_muc_id, thang, nam, tieu_de)
         DO UPDATE SET gioi_han_chi_tieu = EXCLUDED.gioi_han_chi_tieu`,
        [userId, categoryId, exp.categoryName || '', exp.amount, month, year]
      );
    }

    await client.query('COMMIT');

    // Tặng 200 XP và huy hiệu cho lần đầu thiết lập
    await addXP(userId as number, 200);
    await unlockBadge(userId as number, 'FIRST_BUDGET');

    // Fetch updated user to return
    const updatedUserRes = await client.query(
      'SELECT id, ho_ten AS full_name, email, thu_nhap_hang_thang AS monthly_income, hoan_thanh_khao_sat AS onboarding_completed FROM nguoi_dung WHERE id = $1',
      [userId]
    );

    res.json({
      success: true,
      message: 'Onboarding completed successfully',
      user: updatedUserRes.rows[0]
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
      'SELECT id, ho_ten AS full_name, email, hinh_anh AS avatar_url, thu_nhap_hang_thang AS monthly_income, hoan_thanh_khao_sat AS onboarding_completed, xp, level, ngay_tao AS created_at FROM nguoi_dung WHERE id = $1',
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

// ============================================================
// GET /api/user/badges – Lấy danh hiệu và tiến trình
// ============================================================
router.get('/badges', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    
    // 1. Lấy thông tin XP, Level của User
    const userRes = await pool.query('SELECT xp, level FROM nguoi_dung WHERE id = $1', [userId]);
    const { xp, level } = userRes.rows[0];

    // 2. Lấy toàn bộ thư viện danh hiệu
    const allBadgesRes = await pool.query('SELECT * FROM danh_hieu ORDER BY id');
    
    // 3. Lấy danh sách danh hiệu người dùng đã đạt được
    const userBadgesRes = await pool.query(
      'SELECT danh_hieu_id FROM nguoi_dung_danh_hieu WHERE nguoi_dung_id = $1',
      [userId]
    );
    const achievedIds = userBadgesRes.rows.map(r => r.danh_hieu_id);

    // 4. Map dữ liệu để trả về
    const badges = allBadgesRes.rows.map(b => ({
      ...b,
      isUnlocked: achievedIds.includes(b.id)
    }));

    res.json({
      success: true,
      data: {
        xp,
        level,
        nextLevelXp: level * 1000, // Công thức đơn giản: mỗi level cần level * 1000 XP
        badges
      }
    });
  } catch (err) {
    console.error('Badges error:', err);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi lấy danh hiệu' });
  }
});

/**
 * Hàm tiện ích để cộng XP cho người dùng
 */
export async function addXP(userId: number, amount: number) {
  try {
    const res = await pool.query(
      'UPDATE nguoi_dung SET xp = xp + $1 WHERE id = $2 RETURNING xp, level',
      [amount, userId]
    );
    
    const { xp, level } = res.rows[0];
    const nextLevelThreshold = level * 1000;

    if (xp >= nextLevelThreshold) {
      await pool.query(
        'UPDATE nguoi_dung SET level = level + 1, xp = xp - $1 WHERE id = $2',
        [nextLevelThreshold, userId]
      );
      return { levelUp: true, newLevel: level + 1 };
    }
    return { levelUp: false };
  } catch (err) {
    console.error('Add XP error:', err);
    return null;
  }
}

/**
 * Hàm tiện ích để trao danh hiệu cho người dùng
 */
export async function unlockBadge(userId: number, badgeCode: string) {
  try {
    const badgeRes = await pool.query('SELECT id FROM danh_hieu WHERE ma_danh_hieu = $1', [badgeCode]);
    if (badgeRes.rows.length === 0) return false;
    
    const badgeId = badgeRes.rows[0].id;
    await pool.query(
      'INSERT INTO nguoi_dung_danh_hieu (nguoi_dung_id, danh_hieu_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [userId, badgeId]
    );
    return true;
  } catch (err) {
    console.error('Unlock badge error:', err);
    return false;
  }
}

export default router;
