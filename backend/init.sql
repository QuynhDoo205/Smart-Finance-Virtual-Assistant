-- ============================================================
-- Smart Finance Virtual Assistant - Database Schema (Vietnamese)
-- ============================================================

-- Xóa bảng cũ nếu tồn tại
DROP TABLE IF EXISTS muc_tieu_tiet_kiem CASCADE;
DROP TABLE IF EXISTS ngan_sach CASCADE;
DROP TABLE IF EXISTS giao_dich CASCADE;
DROP TABLE IF EXISTS danh_muc CASCADE;
DROP TABLE IF EXISTS nguoi_dung CASCADE;

-- (Optional) Drop old english tables to clean up db for the user
DROP TABLE IF EXISTS savings_goals CASCADE;
DROP TABLE IF EXISTS budgets CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================
-- BẢNG NGƯỜI DÙNG
-- ============================================================
CREATE TABLE nguoi_dung (
  id SERIAL PRIMARY KEY,
  ho_ten VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  mat_khau VARCHAR(255) NOT NULL,
  hinh_anh TEXT,
  thu_nhap_hang_thang DECIMAL(15,2) DEFAULT 0,
  tien_te VARCHAR(10) DEFAULT 'VND',
  hoan_thanh_khao_sat BOOLEAN DEFAULT FALSE,
  ngay_tao TIMESTAMP DEFAULT NOW(),
  ngay_cap_nhat TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- BẢNG DANH MỤC (Thu/Chi)
-- ============================================================
CREATE TABLE danh_muc (
  id SERIAL PRIMARY KEY,
  ten_danh_muc VARCHAR(100) NOT NULL,
  bieu_tuong VARCHAR(50),
  mau_sac VARCHAR(20),
  loai_danh_muc VARCHAR(10) CHECK (loai_danh_muc IN ('thu_nhap', 'chi_phi')) NOT NULL,
  la_mac_dinh BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- BẢNG GIAO DỊCH
-- ============================================================
CREATE TABLE giao_dich (
  id SERIAL PRIMARY KEY,
  nguoi_dung_id INTEGER REFERENCES nguoi_dung(id) ON DELETE CASCADE,
  danh_muc_id INTEGER REFERENCES danh_muc(id) ON DELETE SET NULL,
  tieu_de VARCHAR(255) NOT NULL,
  so_tien DECIMAL(15,2) NOT NULL,
  loai_giao_dich VARCHAR(10) CHECK (loai_giao_dich IN ('thu_nhap', 'chi_phi')) NOT NULL,
  ghi_chu TEXT,
  ngay_giao_dich TIMESTAMP DEFAULT NOW(),
  ngay_tao TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- BẢNG NGÂN SÁCH (Hàng tháng)
-- ============================================================
CREATE TABLE ngan_sach (
  id SERIAL PRIMARY KEY,
  nguoi_dung_id INTEGER REFERENCES nguoi_dung(id) ON DELETE CASCADE,
  danh_muc_id INTEGER REFERENCES danh_muc(id) ON DELETE CASCADE,
  gioi_han_chi_tieu DECIMAL(15,2) NOT NULL,
  da_chi_tieu DECIMAL(15,2) DEFAULT 0,
  thang INTEGER NOT NULL,
  nam INTEGER NOT NULL,
  ngay_tao TIMESTAMP DEFAULT NOW(),
  UNIQUE(nguoi_dung_id, danh_muc_id, thang, nam)
);

-- ============================================================
-- BẢNG MỤC TIÊU TIẾT KIỆM
-- ============================================================
CREATE TABLE muc_tieu_tiet_kiem (
  id SERIAL PRIMARY KEY,
  nguoi_dung_id INTEGER REFERENCES nguoi_dung(id) ON DELETE CASCADE,
  ten_muc_tieu VARCHAR(255) NOT NULL,
  so_tien_muc_tieu DECIMAL(15,2) NOT NULL,
  so_tien_hien_tai DECIMAL(15,2) DEFAULT 0,
  ngay_het_han DATE,
  bieu_tuong VARCHAR(50),
  mau_sac VARCHAR(20),
  trang_thai VARCHAR(20) DEFAULT 'hoat_dong' CHECK (trang_thai IN ('hoat_dong', 'hoan_thanh', 'da_huy')),
  ngay_tao TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- DỮ LIỆU MẪU (SEED DATA)
-- ============================================================

-- 1. Thêm các danh mục cơ bản
INSERT INTO danh_muc (ten_danh_muc, bieu_tuong, mau_sac, loai_danh_muc) VALUES
  ('Lương', 'wallet', '#10B981', 'thu_nhap'),
  ('Thưởng', 'gift', '#F59E0B', 'thu_nhap'),
  ('Đầu tư', 'trending-up', '#6366F1', 'thu_nhap'),
  ('Ăn uống', 'utensils', '#F97316', 'chi_phi'),
  ('Di chuyển', 'car', '#3B82F6', 'chi_phi'),
  ('Mua sắm', 'shopping-bag', '#EC4899', 'chi_phi'),
  ('Giải trí', 'play', '#8B5CF6', 'chi_phi'),
  ('Sức khỏe', 'heart', '#EF4444', 'chi_phi'),
  ('Giáo dục', 'book', '#14B8A6', 'chi_phi'),
  ('Điện & Nước', 'zap', '#F59E0B', 'chi_phi'),
  ('Internet & 4G', 'wifi', '#6366F1', 'chi_phi'),
  ('Nhà ở', 'home', '#0EA5E9', 'chi_phi'),
  ('Khác', 'more-horizontal', '#64748B', 'chi_phi');

-- 2. Thêm người dùng đồ án (Email: 11a6thaianhtai@gmail.com / Pass: 123456)
INSERT INTO nguoi_dung (ho_ten, email, mat_khau, thu_nhap_hang_thang, hoan_thanh_khao_sat) VALUES
  ('Thái Anh Tài', '11a6thaianhtai@gmail.com', '$2a$10$NHrDqCyyTanUlj7Bh20CuOnWnf/uGmq.RkLnIDUuWrv/KdoNxFO0G', 15000000, true);

-- 3. Mock Data chi tiết cho tài khoản
DO $$
DECLARE
    user_id_val INT := (SELECT id FROM nguoi_dung WHERE email = '11a6thaianhtai@gmail.com' LIMIT 1);
    cat_luong INT := (SELECT id FROM danh_muc WHERE ten_danh_muc = 'Lương');
    cat_anuong INT := (SELECT id FROM danh_muc WHERE ten_danh_muc = 'Ăn uống');
    cat_nhao INT := (SELECT id FROM danh_muc WHERE ten_danh_muc = 'Nhà ở');
    cat_dien_nuoc INT := (SELECT id FROM danh_muc WHERE ten_danh_muc = 'Điện & Nước');
    cat_internet INT := (SELECT id FROM danh_muc WHERE ten_danh_muc = 'Internet & 4G');
    cat_muasam INT := (SELECT id FROM danh_muc WHERE ten_danh_muc = 'Mua sắm');
    cat_giaitri INT := (SELECT id FROM danh_muc WHERE ten_danh_muc = 'Giải trí');
BEGIN
    -- Giao dịch thu nhập
    INSERT INTO giao_dich (nguoi_dung_id, danh_muc_id, tieu_de, so_tien, loai_giao_dich, ngay_giao_dich) VALUES
      (user_id_val, cat_luong, 'Lương Cty Tháng 3', 15000000, 'thu_nhap', NOW() - INTERVAL '35 days'),
      (user_id_val, cat_luong, 'Lương Cty Tháng 4', 15000000, 'thu_nhap', NOW() - INTERVAL '5 days');

    -- Chi tiêu cố định (Tháng hiện tại)
    INSERT INTO giao_dich (nguoi_dung_id, danh_muc_id, tieu_de, so_tien, loai_giao_dich, ngay_giao_dich) VALUES
      (user_id_val, cat_nhao, 'Đóng tiền trọ tháng 4', 3500000, 'chi_phi', NOW() - INTERVAL '4 days'),
      (user_id_val, cat_dien_nuoc, 'Tiền điện nước tháng 4', 850000, 'chi_phi', NOW() - INTERVAL '2 days'),
      (user_id_val, cat_internet, 'Gói cước mạng FPT', 250000, 'chi_phi', NOW() - INTERVAL '5 days');

    -- Chi tiêu linh hoạt (Ăn uống, mua sắm)
    INSERT INTO giao_dich (nguoi_dung_id, danh_muc_id, tieu_de, so_tien, loai_giao_dich, ngay_giao_dich) VALUES
      (user_id_val, cat_anuong, 'Ăn sáng phở gà', 45000, 'chi_phi', NOW() - INTERVAL '3 days'),
      (user_id_val, cat_anuong, 'Cà phê The Coffee House', 65000, 'chi_phi', NOW() - INTERVAL '2 days'),
      (user_id_val, cat_anuong, 'Đi siêu thị Bách Hóa Xanh', 450000, 'chi_phi', NOW() - INTERVAL '1 days'),
      (user_id_val, cat_muasam, 'Mua áo thun Shopee', 250000, 'chi_phi', NOW()),
      (user_id_val, cat_giaitri, 'Xem phim CGV', 120000, 'chi_phi', NOW() + INTERVAL '12 hours');

    -- Ngân sách Tháng hiện tại
    INSERT INTO ngan_sach (nguoi_dung_id, danh_muc_id, gioi_han_chi_tieu, da_chi_tieu, thang, nam) VALUES
      (user_id_val, cat_nhao, 3500000, 3500000, EXTRACT(MONTH FROM NOW()), EXTRACT(YEAR FROM NOW())),
      (user_id_val, cat_dien_nuoc, 1000000, 850000, EXTRACT(MONTH FROM NOW()), EXTRACT(YEAR FROM NOW())),
      (user_id_val, cat_anuong, 4000000, 560000, EXTRACT(MONTH FROM NOW()), EXTRACT(YEAR FROM NOW())),
      (user_id_val, cat_muasam, 2000000, 250000, EXTRACT(MONTH FROM NOW()), EXTRACT(YEAR FROM NOW())),
      (user_id_val, cat_giaitri, 1500000, 120000, EXTRACT(MONTH FROM NOW()), EXTRACT(YEAR FROM NOW()));

    -- Mục tiêu tiết kiệm
    INSERT INTO muc_tieu_tiet_kiem (nguoi_dung_id, ten_muc_tieu, so_tien_muc_tieu, so_tien_hien_tai, bieu_tuong, mau_sac) VALUES
      (user_id_val, 'Mua MacBook Pro M3', 45000000, 12000000, 'laptop', '#0EA5E9'),
      (user_id_val, 'Du lịch Đà Lạt', 5000000, 3500000, 'plane', '#F59E0B');
END $$;

-- Tổng kết hiển thị trên console (Tiếng Việt)
SELECT 'Khởi tạo Cơ sở dữ liệu thành công!' as thong_bao;
SELECT count(*) || ' Người dùng' from nguoi_dung;
SELECT count(*) || ' Danh mục' from danh_muc;
SELECT count(*) || ' Giao dịch' from giao_dich;
SELECT count(*) || ' Ngân sách' from ngan_sach;
SELECT count(*) || ' Mục tiêu' from muc_tieu_tiet_kiem;
