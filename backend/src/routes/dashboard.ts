import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Response } from 'express';
import { Router } from 'express';
import pool from '../db.js';
import type { AuthRequest } from '../middleware/auth.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const genAI = new GoogleGenerativeAI((process.env.GOOGLE_AI_KEY || "").trim());

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

    // Thu nhập tháng này (CHỈ TÍNH TIỀN THỰC TẾ, KHÔNG TÍNH ĐIỀU CHUYỂN NỘI BỘ)
    const incomeResult = await pool.query(
      `SELECT COALESCE(SUM(so_tien), 0) as total
       FROM giao_dich 
       WHERE nguoi_dung_id = $1 
       AND loai_giao_dich IN ('thu_nhap', 'income') 
       AND (ghi_chu IS NULL OR ghi_chu NOT LIKE 'INTERNAL_TRANSFER%')
       AND EXTRACT(MONTH FROM ngay_giao_dich) = $2 
       AND EXTRACT(YEAR FROM ngay_giao_dich) = $3`,
      [userId, month, year]
    );

    // Chi tiêu tháng này
    const expenseResult = await pool.query(
      `SELECT COALESCE(SUM(so_tien), 0) as total
       FROM giao_dich 
       WHERE nguoi_dung_id = $1 
       AND loai_giao_dich IN ('chi_phi', 'expense') 
       AND (ghi_chu IS NULL OR ghi_chu NOT LIKE 'INTERNAL_TRANSFER%')
       AND EXTRACT(MONTH FROM ngay_giao_dich) = $2 
       AND EXTRACT(YEAR FROM ngay_giao_dich) = $3`,
      [userId, month, year]
    );

    // Tổng số dư thực tế (Cũng phải loại bỏ điều chuyển để không bị x2 số tiền khi tính balance)
    const balanceResult = await pool.query(
      `SELECT 
         COALESCE(SUM(CASE WHEN loai_giao_dich IN ('thu_nhap', 'income') THEN so_tien ELSE -so_tien END), 0) as balance
       FROM giao_dich 
       WHERE nguoi_dung_id = $1 
       AND (ghi_chu IS NULL OR ghi_chu NOT LIKE 'INTERNAL_TRANSFER%')`,
      [userId]
    );

    const totalIncome = parseFloat(incomeResult.rows[0]?.total ?? '0');
    const totalExpense = parseFloat(expenseResult.rows[0]?.total ?? '0');
    const totalBalance = parseFloat(balanceResult.rows[0]?.balance ?? '0');

    // Thu nhập tháng trước (để tính % thay đổi)
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevIncomeResult = await pool.query(
      `SELECT COALESCE(SUM(so_tien), 0) as total
       FROM giao_dich 
       WHERE nguoi_dung_id = $1 
       AND loai_giao_dich IN ('thu_nhap', 'income') 
       AND (ghi_chu IS NULL OR ghi_chu NOT LIKE 'INTERNAL_TRANSFER%')
       AND EXTRACT(MONTH FROM ngay_giao_dich) = $2 
       AND EXTRACT(YEAR FROM ngay_giao_dich) = $3`,
      [userId, prevMonth, prevYear]
    );
    const prevIncome = parseFloat(prevIncomeResult.rows[0]?.total ?? '0');

    const incomeChange = prevIncome > 0 
      ? Math.round(((totalIncome - prevIncome) / prevIncome) * 100) 
      : 0;

    // Chế độ sinh tồn: Nếu chi tiêu > 90% thu nhập
    const isSurvivalMode = totalIncome > 0 && (totalExpense / totalIncome) > 0.9;

    // Phân bổ chi tiêu theo danh mục tháng này (Dành cho biểu đồ)
    const categoryDistResult = await pool.query(
      `SELECT c.ten_danh_muc as name, SUM(t.so_tien) as value, c.mau_sac as color
       FROM giao_dich t
       JOIN danh_muc c ON t.danh_muc_id = c.id
       WHERE t.nguoi_dung_id = $1 AND t.loai_giao_dich IN ('chi_phi', 'expense')
       AND EXTRACT(MONTH FROM t.ngay_giao_dich) = $2
       AND EXTRACT(YEAR FROM t.ngay_giao_dich) = $3
       GROUP BY c.ten_danh_muc, c.mau_sac
       ORDER BY value DESC`,
      [userId, month, year]
    );

    // 5. Quỹ dự phòng thực tế (10% TỔNG thu nhập từ trước đến nay - tiền đã rút khẩn cấp)
    const allTimeIncomeRes = await pool.query(
      `SELECT COALESCE(SUM(so_tien), 0) as total
       FROM giao_dich 
       WHERE nguoi_dung_id = $1 
       AND loai_giao_dich IN ('thu_nhap', 'income') 
       AND (ghi_chu IS NULL OR ghi_chu NOT LIKE 'INTERNAL_TRANSFER%')`,
      [userId]
    );
    const cumulativeIncome = parseFloat(allTimeIncomeRes.rows[0]?.total ?? '0');
    const emergencyLimit = cumulativeIncome * 0.1;

    const emergencyTransResult = await pool.query(
      `SELECT COALESCE(SUM(so_tien), 0) as total
       FROM giao_dich 
       WHERE nguoi_dung_id = $1 
       AND ghi_chu LIKE 'INTERNAL_TRANSFER%'`,
      [userId]
    );
    const totalWithdrawn = parseFloat(emergencyTransResult.rows[0]?.total ?? '0');
    const remainingEmergency = Math.max(0, emergencyLimit - totalWithdrawn);

    res.json({
      success: true,
      data: {
        totalBalance,
        totalIncome,
        totalExpense,
        remainingEmergency,
        emergencyLimit,
        netSavings: totalIncome - totalExpense,
        incomeChangePercent: incomeChange,
        isSurvivalMode,
        categoryDistribution: categoryDistResult.rows,
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
               CASE WHEN t.loai_giao_dich IN ('thu_nhap', 'income') THEN 'income' ELSE 'expense' END AS type, 
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
    const month = parseInt(req.query['month'] as string) || now.getMonth() + 1;
    const year = parseInt(req.query['year'] as string) || now.getFullYear();

    const result = await pool.query(
      `WITH actual_spending AS (
          SELECT danh_muc_id, SUM(so_tien) as total_spent
          FROM giao_dich
          WHERE nguoi_dung_id = $1 AND loai_giao_dich IN ('chi_phi', 'expense')
          AND EXTRACT(MONTH FROM ngay_giao_dich) = $2
          AND EXTRACT(YEAR FROM ngay_giao_dich) = $3
          GROUP BY danh_muc_id
        )
        SELECT 
          COALESCE(b.id, 0) as id,
          COALESCE(b.gioi_han_chi_tieu, 0) as limit_amount,
          COALESCE(s.total_spent, b.da_chi_tieu, 0) as spent_amount,
          c.ten_danh_muc as category_name,
          b.tieu_de as budget_title,
          c.bieu_tuong as category_icon,
          c.mau_sac as category_color,
          CASE 
            WHEN COALESCE(b.gioi_han_chi_tieu, 0) > 0 
            THEN ROUND((COALESCE(s.total_spent, b.da_chi_tieu, 0) / b.gioi_han_chi_tieu * 100)::numeric, 1)
            ELSE 0 
          END as usage_percent,
          c.id as category_id
        FROM ngan_sach b
        JOIN danh_muc c ON b.danh_muc_id = c.id
        LEFT JOIN actual_spending s ON c.id = s.danh_muc_id
        WHERE b.nguoi_dung_id = $1 AND b.thang = $2 AND b.nam = $3
        ORDER BY spent_amount DESC`,
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
// POST /api/dashboard/savings-goals – Thêm Mục tiêu tiết kiệm
// ============================================================
router.post('/savings-goals', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { name, targetAmount, deadline, icon, color } = req.body;

    if (!name || !targetAmount || !deadline) {
      res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO muc_tieu_tiet_kiem (nguoi_dung_id, ten_muc_tieu, so_tien_muc_tieu, so_tien_hien_tai, ngay_het_han, bieu_tuong, mau_sac, trang_thai)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'hoat_dong')
       RETURNING id, ten_muc_tieu AS name, so_tien_muc_tieu AS target_amount, so_tien_hien_tai AS current_amount, ngay_het_han AS deadline, bieu_tuong AS icon, mau_sac AS color, trang_thai AS status`,
      [userId, name, targetAmount, 0, deadline, icon || '🎯', color || '#818cf8']
    );

    res.json({ success: true, data: { goal: result.rows[0] } });
  } catch (err) {
    console.error('Create savings goal error:', err);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
});

// ============================================================
// POST /api/dashboard/savings-goals/:id/fund – Nạp tiền vào mục tiêu
// ============================================================
router.post('/savings-goals/:id/fund', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const goalId = req.params.id;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      res.status(400).json({ success: false, message: 'Số tiền không hợp lệ' });
      return;
    }

    const result = await pool.query(
      `UPDATE muc_tieu_tiet_kiem 
       SET so_tien_hien_tai = so_tien_hien_tai + $1,
           trang_thai = CASE WHEN so_tien_hien_tai + $1 >= so_tien_muc_tieu THEN 'hoan_thanh' ELSE trang_thai END
       WHERE id = $2 AND nguoi_dung_id = $3
       RETURNING id, ten_muc_tieu, so_tien_hien_tai`,
      [amount, goalId, userId]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ success: false, message: 'Không tìm thấy mục tiêu' });
      return;
    }
    
    // Ghi nhận dòng tiền này là một khoản chi (đưa vào lợn đất) để trừ khỏi Tổng số dư khả dụng
    await pool.query(
      `INSERT INTO giao_dich (nguoi_dung_id, tieu_de, so_tien, loai_giao_dich, ghi_chu)
       VALUES ($1, $2, $3, 'chi_phi', 'Chuyển tiền vào quỹ mục tiêu')`,
      [userId, `Nạp heo đất: ${result.rows[0].ten_muc_tieu}`, amount]
    );

    res.json({ success: true, message: 'Nạp tiền thành công', data: result.rows[0] });
  } catch (err) {
    console.error('Fund savings goal error:', err);
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
         CASE WHEN loai_giao_dich IN ('thu_nhap', 'income') THEN 'income' ELSE 'expense' END AS type,
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

// ============================================================
// GET /api/dashboard/suggest-jars – AI gợi ý chia lọ
// ============================================================
router.get('/suggest-jars', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    
    // Lấy thông tin thu nhập và chi tiêu gần đây để AI phân tích
    const profileRes = await pool.query('SELECT thu_nhap_hang_thang FROM nguoi_dung WHERE id = $1', [userId]);
    const income = profileRes.rows[0]?.thu_nhap_hang_thang || 0;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `Dựa trên thu nhập ${income} VNĐ/tháng của một sinh viên, hãy gợi ý tỷ lệ chia 5 lọ tài chính (Thiết yếu, Tiết kiệm, Phát triển, Hưởng thụ, Đầu tư). Trả về JSON: {"jars": [{"name": string, "percentage": number}]}. Tổng percentage phải bằng 100.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    res.json({ 
      success: true, 
      data: jsonMatch ? JSON.parse(jsonMatch[0]) : { jars: [
        { name: 'Thiết yếu', percentage: 50 },
        { name: 'Tiết kiệm', percentage: 20 },
        { name: 'Phát triển', percentage: 10 },
        { name: 'Hưởng thụ', percentage: 10 },
        { name: 'Đầu tư', percentage: 10 }
      ]}
    });
  } catch (err) {
    console.error('AI Suggest Jars error:', err);
    res.status(500).json({ success: false, message: 'Lỗi AI gợi ý' });
  }
});

// ============================================================
// POST /api/dashboard/setup-budget – Thiết lập ngân sách hàng loạt
// ============================================================
router.post('/setup-budget', async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const userId = req.user?.id;
    const { budgets } = req.body; // Array of { categoryId, limit }
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    await client.query('BEGIN');

    for (const b of budgets) {
      await client.query(
        `INSERT INTO ngan_sach (nguoi_dung_id, danh_muc_id, tieu_de, gioi_han_chi_tieu, thang, nam)
         VALUES ($1, $2, '', $3, $4, $5)
         ON CONFLICT (nguoi_dung_id, danh_muc_id, thang, nam, tieu_de) 
         DO UPDATE SET gioi_han_chi_tieu = EXCLUDED.gioi_han_chi_tieu`,
        [userId, b.categoryId, b.limit, month, year]
      );
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'Đã thiết lập ngân sách thành công' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Setup budget error:', err);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  } finally {
    client.release();
  }
});

export default router;
