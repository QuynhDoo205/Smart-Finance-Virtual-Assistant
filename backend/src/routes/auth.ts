import { Router } from 'express';
import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import nodemailer from 'nodemailer';
import pool from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = Router();
const googleClient = new OAuth2Client(process.env['GOOGLE_CLIENT_ID'] || 'YOUR_GOOGLE_CLIENT_ID');

// Cấu hình Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env['GMAIL_USER'],
    pass: process.env['GMAIL_APP_PASSWORD'],
  },
});

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

    let payload: any;

    try {
      // Verify token with google-auth-library (ID Token flow)
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: process.env['GOOGLE_CLIENT_ID'] || 'YOUR_GOOGLE_CLIENT_ID',
      });
      payload = ticket.getPayload();
    } catch (err) {
      // If verification fails, it might be an access token from custom login button
      try {
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          payload = await response.json();
        } else {
          console.error('Google userinfo fetch failed:', await response.text());
        }
      } catch (fetchErr) {
        console.error('Failed to fetch userinfo with access token:', fetchErr);
      }
    }

    if (!payload || !payload.email) {
      res.status(401).json({ success: false, message: 'Xác thực Google thất bại hoặc không có email' });
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

// ============================================================
// POST /api/auth/forgot-password – Quên mật khẩu
// ============================================================
router.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ success: false, message: 'Vui lòng cung cấp email' });
      return;
    }

    // Kiểm tra user tồn tại
    const result = await pool.query('SELECT id, ho_ten FROM nguoi_dung WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Email này không tồn tại trong hệ thống' });
      return;
    }

    const user = result.rows[0];

    // Tạo mật khẩu mới ngẫu nhiên
    const newPassword = Math.random().toString(36).slice(-8);
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    // Cập nhật mật khẩu trong DB
    await pool.query('UPDATE nguoi_dung SET mat_khau = $1, ngay_cap_nhat = NOW() WHERE id = $2', [password_hash, user.id]);

    // Gửi email
    const mailOptions = {
      from: `"NovaFinance Assistant" <${process.env['GMAIL_USER']}>`,
      to: email,
      subject: 'Khôi phục mật khẩu - NovaFinance',
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #0ea5e9;">Khôi phục mật khẩu</h2>
          <p>Chào <b>${user.ho_ten}</b>,</p>
          <p>Chúng tôi đã nhận được yêu cầu khôi phục mật khẩu của bạn.</p>
          <p>Mật khẩu mới của bạn là: <b style="font-size: 1.2rem; color: #e11d48; padding: 5px 10px; background: #f1f5f9; border-radius: 4px;">${newPassword}</b></p>
          <p>Vui lòng đăng nhập bằng mật khẩu này và đổi lại mật khẩu mới trong phần cài đặt sau khi truy cập thành công.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 0.8rem; color: #999;">Đây là email tự động, vui lòng không trả lời.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: 'Mật khẩu mới đã được gửi về Gmail của bạn' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi gửi email khôi phục' });
  }
});

// ============================================================
// POST /api/auth/change-password – Đổi mật khẩu
// ============================================================
router.post('/change-password', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
      return;
    }

    // Lấy thông tin user
    const result = await pool.query('SELECT mat_khau FROM nguoi_dung WHERE id = $1', [userId]);
    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
      return;
    }

    const user = result.rows[0];

    // Kiểm tra mật khẩu hiện tại
    const isMatch = await bcrypt.compare(currentPassword, user.mat_khau);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Mật khẩu hiện tại không chính xác' });
      return;
    }

    // Hash mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    // Cập nhật
    await pool.query('UPDATE nguoi_dung SET mat_khau = $1, ngay_cap_nhat = NOW() WHERE id = $2', [password_hash, userId]);

    res.json({ success: true, message: 'Đổi mật khẩu thành công!' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
});

export default router;
