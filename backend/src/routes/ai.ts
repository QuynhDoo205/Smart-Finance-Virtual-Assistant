import { Router } from 'express';
import type { Response, RequestHandler } from 'express';
import multer from 'multer';
import pool from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';
import { analyzeReceiptImage, analyzeChatMessage } from '../services/aiService.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Yêu cầu đăng nhập cho mọi yêu cầu AI
router.use(authMiddleware);

// ============================================================
// SESSIONS ROUTES (Gemini Style)
// ============================================================

// Lấy danh sách phiên chat
router.get('/sessions', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const result = await pool.query(
      'SELECT * FROM phien_chat WHERE nguoi_dung_id = $1 ORDER BY ngay_cap_nhat DESC',
      [userId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi lấy danh sách phiên chat' });
  }
});

// Tạo phiên chat mới
router.post('/sessions', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { title } = req.body;
    const result = await pool.query(
      'INSERT INTO phien_chat (nguoi_dung_id, tieu_de) VALUES ($1, $2) RETURNING *',
      [userId, title || 'Cuộc trò chuyện mới']
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi tạo phiên chat' });
  }
});

// Xóa phiên chat
router.delete('/sessions/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    await pool.query('DELETE FROM phien_chat WHERE id = $1 AND nguoi_dung_id = $2', [id, userId]);
    res.json({ success: true, message: 'Đã xóa phiên chat' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi xóa phiên chat' });
  }
});

// ============================================================
// POST /api/ai/scan – Xử lý ảnh hóa đơn bằng Gemini
// ============================================================
router.post('/scan', upload.single('image'), (async (req: any, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'Vui lòng tải lên một ảnh hóa đơn' });
      return;
    }

    const { buffer, mimetype } = req.file;
    const result = await analyzeReceiptImage(buffer, mimetype);

    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    console.error('AI Scan Error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'AI không thể phân tích hóa đơn này. Vui lòng thử lại hoặc nhập thủ công.',
      error: (err as Error).message
    });
  }
}) as any);

// ============================================================
// GET /api/ai/history/:sessionId – Lấy lịch sử chat của 1 phiên
// ============================================================
router.get('/history/:sessionId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { sessionId } = req.params;
    const result = await pool.query(
      'SELECT vai_tro as role, noi_dung as content, loai_tin_nhan as type, du_lieu_json as data, ngay_tao as timestamp FROM tin_nhan WHERE nguoi_dung_id = $1 AND phien_chat_id = $2 ORDER BY ngay_tao ASC',
      [userId, sessionId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('AI History Error:', err);
    res.status(500).json({ success: false, message: 'Lỗi lấy lịch sử chat' });
  }
});

// ============================================================
// POST /api/ai/chat – Xử lý tin nhắn chi tiêu bằng Gemini
// ============================================================
router.post('/chat', async (req: AuthRequest, res: Response): Promise<void> => {
  let client;
  try {
    const { message, sessionId } = req.body;
    const userId = req.user?.id;

    if (!message) {
      res.status(400).json({ success: false, message: 'Tin nhắn không được để trống' });
      return;
    }

    // Kết nối DB chỉ khi cần thiết và trong try-catch
    client = await pool.connect();

    // Nếu không có sessionId, tạo mới một phiên
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      // Tạo tiêu đề ngắn gọn từ tin nhắn đầu tiên (giới hạn 30 ký tự)
      const smartTitle = message.length > 30 ? message.substring(0, 27) + '...' : message;
      const sessionRes = await client.query(
        'INSERT INTO phien_chat (nguoi_dung_id, tieu_de) VALUES ($1, $2) RETURNING id',
        [userId, smartTitle]
      );
      currentSessionId = sessionRes.rows[0].id;
    }

    // 1. Xây dựng CONTEXT tài chính thực tế (Nén dữ liệu)
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const summaryRes = await client.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN loai_giao_dich = 'chi_phi' THEN so_tien ELSE 0 END), 0) as total_spent,
        COALESCE(SUM(CASE WHEN loai_giao_dich = 'thu_nhap' THEN so_tien ELSE 0 END), 0) as total_income
      FROM giao_dich 
      WHERE nguoi_dung_id = $1 AND EXTRACT(MONTH FROM ngay_giao_dich) = $2 AND EXTRACT(YEAR FROM ngay_giao_dich) = $3
    `, [userId, month, year]);

    const topCategoriesRes = await client.query(`
      SELECT c.ten_danh_muc, SUM(t.so_tien) as total
      FROM giao_dich t
      JOIN danh_muc c ON t.danh_muc_id = c.id
      WHERE t.nguoi_dung_id = $1 AND t.loai_giao_dich = 'chi_phi'
      AND EXTRACT(MONTH FROM t.ngay_giao_dich) = $2 AND EXTRACT(YEAR FROM t.ngay_giao_dich) = $3
      GROUP BY c.ten_danh_muc
      ORDER BY total DESC LIMIT 3
    `, [userId, month, year]);

    const budgetRes = await client.query(`
      SELECT tieu_de, gioi_han_chi_tieu, da_chi_tieu 
      FROM ngan_sach 
      WHERE nguoi_dung_id = $1 AND thang = $2 AND nam = $3
    `, [userId, month, year]);

    const context = `
- Tháng ${month}/${year}: Chi ${summaryRes.rows[0].total_spent.toLocaleString()}đ, Thu ${summaryRes.rows[0].total_income.toLocaleString()}đ.
- Top 3 chi tiêu: ${topCategoriesRes.rows.map(r => `${r.ten_danh_muc} (${r.total.toLocaleString()}đ)`).join(', ')}.
- Ngân sách: ${budgetRes.rows.map(r => `${r.tieu_de}: ${r.da_chi_tieu.toLocaleString()}/${r.gioi_han_chi_tieu.toLocaleString()}đ`).join('; ')}.
    `.trim();

    // 2. SEMANTIC CACHING (Đỡ tốn token nhất)
    // Nếu người dùng hỏi đúng câu cũ trong cùng 1 phiên chat và dữ liệu chưa đổi (dựa trên total_spent), trả về kết quả cũ
    const lastReplyRes = await client.query(`
      SELECT noi_dung, du_lieu_json FROM tin_nhan 
      WHERE nguoi_dung_id = $1 AND phien_chat_id = $2 AND vai_tro = 'assistant'
      AND id IN (SELECT MAX(id) FROM tin_nhan WHERE phien_chat_id = $3 AND vai_tro = 'user' AND noi_dung = $4)
      LIMIT 1
    `, [userId, currentSessionId, currentSessionId, message]);

    if (lastReplyRes.rows.length > 0) {
      // Giả sử dữ liệu không đổi nhiều, có thể trả về cache
      const cached = lastReplyRes.rows[0];
      res.json({
        success: true,
        reply: cached.noi_dung,
        data: cached.du_lieu_json,
        sessionId: currentSessionId,
        isCached: true
      });
      return;
    }

    // 3. Gọi AI với context thực tế
    const result = await analyzeChatMessage(message, context);

    // Lưu phản hồi của AI
    await client.query(
      'INSERT INTO tin_nhan (nguoi_dung_id, phien_chat_id, vai_tro, noi_dung, du_lieu_json) VALUES ($1, $2, $3, $4, $5)',
      [userId, currentSessionId, 'assistant', result.reply, result.data ? JSON.stringify(result.data) : null]
    );

    // Cập nhật thời gian cho phiên chat
    await client.query('UPDATE phien_chat SET ngay_cap_nhat = NOW() WHERE id = $1', [currentSessionId]);

    // Nếu AI bóc tách được chi tiêu, tiến hành lưu luôn (Auto-save)
    if (result.data) {
      const { amount, category, description, date, time, store } = result.data;
      
      const catMap: Record<string, string> = {
        'food': 'Ăn uống',
        'transport': 'Di chuyển',
        'shopping': 'Mua sắm',
        'entertainment': 'Giải trí',
        'health': 'Sức khỏe',
        'education': 'Giáo dục',
        'other': 'Khác'
      };

      // Chỉ kết nối DB khi thực sự có dữ liệu cần lưu
      client = await pool.connect();
      
      try {
        await client.query('BEGIN');

        const catResult = await client.query(
          'SELECT id FROM danh_muc WHERE ten_danh_muc = $1 LIMIT 1',
          [catMap[category] || 'Khác']
        );
        const categoryId = catResult.rows[0]?.id;

        // Kết hợp ngày và giờ nếu có
        const transactionDateTime = time ? `${date} ${time}` : (date || new Date());

        await client.query(
          `INSERT INTO giao_dich (nguoi_dung_id, danh_muc_id, tieu_de, so_tien, loai_giao_dich, ghi_chu, ngay_giao_dich)
           VALUES ($1, $2, $3, $4, 'chi_phi', $5, $6)
           RETURNING *`,
          [userId, categoryId, description || (store ? `Mua tại ${store}` : 'Chi tiêu AI'), amount, `Ghi nhận tự động từ Nova AI: ${message}`, transactionDateTime]
        );

        const transDate = new Date(transactionDateTime);
        const month = transDate.getMonth() + 1;
        const year = transDate.getFullYear();

        await client.query(
          `UPDATE ngan_sach 
           SET da_chi_tieu = da_chi_tieu + $1
           WHERE nguoi_dung_id = $2 AND danh_muc_id = $3 AND thang = $4 AND nam = $5`,
          [amount, userId, categoryId, month, year]
        );

        await client.query('COMMIT');
      } catch (dbErr) {
        await client.query('ROLLBACK');
        throw dbErr; // Để catch bên ngoài xử lý
      }
    }

    res.json({
      success: true,
      reply: result.reply,
      data: result.data,
      sessionId: currentSessionId
    });
  } catch (err) {
    console.error('AI Chat Error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'AI gặp sự cố khi xử lý hoặc lưu trữ dữ liệu.',
      error: (err as Error).message
    });
  } finally {
    if (client) client.release();
  }
});

export default router;
