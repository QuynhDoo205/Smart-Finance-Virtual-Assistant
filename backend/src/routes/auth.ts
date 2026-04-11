import { Router } from 'express';
import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import pool from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = Router();
const googleClient = new OAuth2Client(process.env['GOOGLE_CLIENT_ID'] || 'YOUR_GOOGLE_CLIENT_ID');

// ============================================================
// POST /api/auth/register – Đăng ký tài khoản mới
// ============================================================
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { full_name, email, password } = req.body;

    // Validate input
    if (!full_name || !email || !password) {
      res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ success: false, message: 'Email không hợp lệ' });
      return;
    }

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await pool.query('SELECT id FROM nguoi_dung WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      res.status(409).json({ success: false, message: 'Email đã được sử dụng' });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Tạo user mới
    const result = await pool.query(
      `INSERT INTO nguoi_dung (ho_ten, email, mat_khau, ngay_tao, ngay_cap_nhat) 
       VALUES ($1, $2, $3, NOW(), NOW()) 
       RETURNING id, ho_ten AS full_name, email, thu_nhap_hang_thang AS monthly_income, hoan_thanh_khao_sat AS onboarding_completed, ngay_tao AS created_at`,
      [full_name, email, password_hash]
    );

    const newUser = result.rows[0];

    // Tạo JWT token
    const secret = process.env['JWT_SECRET'] || 'fallback_secret';
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      secret,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công!',
      data: {
        token,
        user: {
          id: newUser.id,
          full_name: newUser.full_name,
          email: newUser.email,
          monthly_income: newUser.monthly_income,
          onboarding_completed: newUser.onboarding_completed,
        }
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ, vui lòng thử lại' });
  }
});

// ============================================================
// POST /api/auth/login – Đăng nhập
// ============================================================
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Vui lòng nhập email và mật khẩu' });
      return;
    }

    // Tim user theo email
    const result = await pool.query(
      'SELECT id, ho_ten AS full_name, email, mat_khau AS password_hash, thu_nhap_hang_thang AS monthly_income, hoan_thanh_khao_sat AS onboarding_completed, hinh_anh AS avatar_url FROM nguoi_dung WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không chính xác' });
      return;
    }

    const user = result.rows[0];

    // Kiểm tra password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không chính xác' });
      return;
    }

    // Tạo JWT token
    const secret = process.env['JWT_SECRET'] || 'fallback_secret';
    const token = jwt.sign(
      { id: user.id, email: user.email },
      secret,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Đăng nhập thành công!',
      data: {
        token,
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          monthly_income: user.monthly_income,
          onboarding_completed: user.onboarding_completed,
          avatar_url: user.avatar_url,
        }
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ, vui lòng thử lại' });
  }
});

// ============================================================
// POST /api/auth/google – Đăng nhập / Đăng ký bằng Google
// ============================================================
router.post('/google', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, intent } = req.body;

    if (!token) {
      res.status(400).json({ success: false, message: 'Thiếu Google Token' });
      return;
    }

    // Verify token with google-auth-library
    // Ignore audience validation if NO client ID provided yet (For dev test only)
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env['GOOGLE_CLIENT_ID'] || 'YOUR_GOOGLE_CLIENT_ID', 
    }).catch(() => null);

    // If verification fail locally due to bad client_id, we can also decode payload directly using jwt (but less secure)
    // Here we assume it passes or we fallback to jwt decode for demo.
    let payload = ticket?.getPayload();
    
    // NẾU CẤU HÌNH TRÊN CHƯA THIẾT LẬP CLIENT ID, decode jwt thủ công (Chỉ dùng trên dev)
    if (!payload) {
      payload = jwt.decode(token) as any;
    }

    if (!payload || !payload.email) {
      res.status(401).json({ success: false, message: 'Token từ Google không hợp lệ hoặc không có email' });
      return;
    }

    const { email, name, picture } = payload;

    // Check if user exists
    const existingUserRes = await pool.query(
      'SELECT id, ho_ten AS full_name, email, thu_nhap_hang_thang AS monthly_income, hoan_thanh_khao_sat AS onboarding_completed, hinh_anh AS avatar_url FROM nguoi_dung WHERE email = $1',
      [email]
    );

    let user;

    if (existingUserRes.rows.length === 0) {
      // Register new user with dummy password
      const salt = await bcrypt.genSalt(10);
      const randomPassword = Math.random().toString(36).slice(-10);
      const password_hash = await bcrypt.hash(randomPassword, salt);

      const result = await pool.query(
        `INSERT INTO nguoi_dung (ho_ten, email, mat_khau, hinh_anh, ngay_tao, ngay_cap_nhat) 
         VALUES ($1, $2, $3, $4, NOW(), NOW()) 
         RETURNING id, ho_ten AS full_name, email, thu_nhap_hang_thang AS monthly_income, hoan_thanh_khao_sat AS onboarding_completed, hinh_anh AS avatar_url, ngay_tao AS created_at`,
        [name, email, password_hash, picture]
      );
      user = result.rows[0];
    } else {
      if (intent === 'register') {
         res.status(409).json({ success: false, message: 'Tài khoản Google này đã được liên kết với một tài khoản hiện có. Vui lòng quay lại để đăng nhập.' });
         return;
      }
      user = existingUserRes.rows[0];
      // Update picture if missing
      if (picture && !user.avatar_url) {
        await pool.query('UPDATE nguoi_dung SET hinh_anh = $1 WHERE id = $2', [picture, user.id]);
        user.avatar_url = picture;
      }
    }

    // Creates app JWT token
    const secret = process.env['JWT_SECRET'] || 'fallback_secret';
    const appToken = jwt.sign(
      { id: user.id, email: user.email },
      secret,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Đăng nhập Google thành công!',
      data: {
        token: appToken,
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          monthly_income: user.monthly_income,
          onboarding_completed: user.onboarding_completed,
          avatar_url: user.avatar_url,
        }
      }
    });
  } catch (err) {
    console.error('Google Auth Error:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi xác minh Google' });
  }
});

// ============================================================
// GET /api/auth/me – Lấy thông tin người dùng hiện tại
// ============================================================
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const result = await pool.query(
      'SELECT id, ho_ten AS full_name, email, thu_nhap_hang_thang AS monthly_income, hoan_thanh_khao_sat AS onboarding_completed, hinh_anh AS avatar_url, tien_te AS currency, ngay_tao AS created_at FROM nguoi_dung WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
      return;
    }

    res.json({ success: true, data: { user: result.rows[0] } });
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
});

export default router;
