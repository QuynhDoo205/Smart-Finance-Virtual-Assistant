# Smart Finance (NovaFinance) - Virtual Assistant

Dự án **Smart Finance Virtual Assistant (NovaFinance)** là một ứng dụng Web hiện đại hỗ trợ người dùng quản lý tài chính cá nhân, theo dõi thu chi, phân bổ ngân sách, và thiết lập các mục tiêu tiết kiệm. Dự án được xây dựng với kiến trúc Full-Stack mạnh mẽ, giao diện UI/UX trực quan theo chuẩn Dark Mode chuyên nghiệp.

---

## 🛠 Công Nghệ (Tech Stack)

### Frontend (Giao diện Người dùng)
- **Framework**: `React.js` kết hợp với `Vite` giúp khởi động và rebuild siêu tốc.
- **Ngôn ngữ**: `TypeScript` đảm bảo tính chặt chẽ của mã nguồn.
- **Styling UI/UX**: `Tailwind CSS` kết hợp với `Framer Motion` mang lại hiệu ứng chuyển động mượt mà, cảm giác "Premium", Glassmorphism thời thượng.
- **Biểu đồ**: `Recharts` cho phép trực quan hóa dữ liệu thống kê một cách linh hoạt.
- **Quản lý State**: `Zustand` gọn nhẹ và tối ưu cho Global State, kết hợp `Axios` để gọi API.

### Backend (Xử lý Nghiệp vụ & API)
- **Framework**: `Node.js` + `Express` cung cấp API RESTful.
- **Cơ sở dữ liệu**: `PostgreSQL` xử lý truy vấn mạnh mẽ, an toàn và toàn vẹn dữ liệu. Thư viện `pg` thực hiện kết nối.
- **Xác thực**:
  - `JWT (JSON Web Token)`: Cơ chế authentication bảo mật, stateless.
  - `Bcrypt.js`: Mã hóa mật khẩu tuyệt đối.
  - `Google OAuth 2.0`: Tích hợp tính năng Đăng nhập bằng Google qua `@react-oauth/google`.

---

## ✨ Những Tính Năng Đang Có (Features)

1. **Đăng nhập & Đăng ký**:
   - Hệ thống xác thực bằng Email/Mật khẩu hoặc Đăng nhập nhanh bằng **Tài khoản Google**.
   - Bảo vệ các Route thông qua `ProtectedRoute`.

2. **Khảo sát ban đầu (Onboarding)**:
   - Khi tài khoản vừ đăng nhập thành công, hệ thống điều hướng vào luồng khảo sát (Onboarding) để nắm bắt thu nhập và dự kiến chi phí cơ bản. Dữ liệu này ngay lập tức được cấp phát làm "Ngân sách tháng".

3. **Dashboard Hiện Đại**:
   - Giao diện Dashboard (Bảng điều khiển) tự động cập nhật Tổng số dư, Tổng thu, Tổng chi.
   - Thống kê tỷ lệ Thay đổi thu nhập so với tháng trước.
   - Trực quan hóa Giao dịch qua Danh sách cuộn động và Biểu đồ Tròn.

4. **Biểu Đồ Tài Chính (Chart)**:
   - Cung cấp cái nhìn trực quan về dòng tiền 6 tháng gần nhất.

5. **Trang Cá Nhân (Profile)**:
   - Hiển thị thông tin danh tính động, sửa tên, cập nhật thu nhập hàng tháng. Thay đổi các tùy chọn bảo mật.

---

## 🗄 Cấu trúc Database (Chi tiết Cơ sở dữ liệu)

Database được thiết kế bằng ngôn ngữ Tiếng Việt toàn bộ theo chuẩn quy mô đồ án. Các kết nối Khóa Ngoại (Foreign Key) được xác lập chặt chẽ (`ON DELETE CASCADE`).

Dưới đây là 5 bảng (Table) cốt lõi của hệ thống:

**1. Bảng `nguoi_dung`**
- _Ý nghĩa_: Lưu trữ thông tin tài khoản và danh tính của người dùng trên hệ thống.
- _Cột quan trọng_: `id`, `ho_ten`, `email` (UNIQUE), `mat_khau` (Mã hóa Hash), `thu_nhap_hang_thang` (Thu nhập thiết lập lúc Onboarding), `hoan_thanh_khao_sat`.

**2. Bảng `danh_muc`**
- _Ý nghĩa_: Phân loại các giao dịch (Ví dụ: "Lương", "Nhà ở", "Ăn uống").
- _Cột quan trọng_: `ten_danh_muc`, `loai_danh_muc` (Bắt buộc phải là `thu_nhap` hoặc `chi_phi`), `bieu_tuong`, `mau_sac`.

**3. Bảng `giao_dich`**
- _Ý nghĩa_: Lưu trữ mọi biên nhận chi tiêu hoặc thu nhập phát sinh hàng ngày.
- _Cột quan trọng_: `nguoi_dung_id` (Khóa ngoại), `danh_muc_id` (Khóa ngoại), `tieu_de`, `so_tien`, `loai_giao_dich`, `ngay_giao_dich`.

**4. Bảng `ngan_sach`**
- _Ý nghĩa_: Bảng ngân sách tháng dùng để giới hạn chiêu tiêu. Mỗi danh mục trong một tháng của một người dùng chỉ có 1 ngân sách duy nhất (`UNIQUE`).
- _Cột quan trọng_: `gioi_han_chi_tieu`, `da_chi_tieu`, `thang`, `nam`.

**5. Bảng `muc_tieu_tiet_kiem`**
- _Ý nghĩa_: Cho phép người dùng theo dõi tiến độ gom tiền cho một mục tiêu lớn (Mua xe, Du lịch...).
- _Cột quan trọng_: `ten_muc_tieu`, `so_tien_muc_tieu`, `so_tien_hien_tai`, `trang_thai`.

> **📦 Tài Khoản Được Cấp Sẵn Dữ Liệu (Seed Data):**
> Trong file `init.sql`, hệ thống đã cấp sẵn một môi trường giả lập hoàn chỉnh (Đầy đủ Thu nhập, Tiền nhà, Tiền ăn uống...) cho tài khoản sau:
> - **Email**: `11a6thaianhtai@gmail.com`
> - **Mật khẩu**: `123456`

#### 📊 Chi tiết công thức tính toán dữ liệu mẫu:
Hệ thống sử dụng các phép tính sau để hiển thị Dashboard cho tài khoản trên:

**1. Giao dịch Thu nhập (Income):**
- Lương Tháng 3: 15,000,000đ
- Lương Tháng 4: 15,000,000đ
- **Tổng Thu nhập tích lũy**: **30,000,000đ**

**2. Giao dịch Chi phí (Expenses - Tháng 4):**
- Tiền trọ: 3,500,000đ
- Điện nước: 850,000đ
- Internet: 250,000đ
- Ăn uống (Phở, Café, Siêu thị): 560,000đ
- Mua sắm (Shopee): 250,000đ
- Giải trí (Xem phim CGV): 120,000đ
- **Tổng Chi tiêu tháng này**: **5,530,000đ**

**3. Kết quả hiển thị Dashboard:**
- **Tổng số dư**: `30,000,000 - 5,530,000` = **24,470,000đ**
- **Tổng Thu (Tháng)**: **15,000,000đ**
- **Tổng Chi (Tháng)**: **5,530,000đ**
- **Tiết kiệm dự kiến**: **9,470,000đ** (Thu - Chi tháng này)

**4. Thiết lập Ngân sách (Budgets):**
- Mục tiêu Nhà ở: 3,500,000đ (Đã dùng 100%)
- Mục tiêu Ăn uống: 4.000,000đ (Đã dùng 14%)
- Mục tiêu Giải trí: 1,500,000đ (Đã dùng 8%)

---

## ⚙️ Logic Kỹ Thuật & Luồng Dữ Liệu (Technical Logic)

Nếu giảng viên hỏi: **"Sửa số ở đâu?"** hoặc **"Tính toán thế nào?"**, bạn hãy sử dụng thông tin dưới đây:

### 1. Nơi xử lý tính toán (Backend Logic)
Toàn bộ logic "cộng trừ nhân chia" nằm tại file:
- 📂 `backend/src/routes/dashboard.ts`

### 2. Chi tiết truy vấn Database (SQL Query)

| Chỉ số Dashboard | Bảng dữ liệu | Logic tính toán (SQL) |
| :--- | :--- | :--- |
| **Tổng Số Dư** | `giao_dich` | `SUM(CASE WHEN loai_giao_dich = 'thu_nhap' THEN so_tien ELSE -so_tien END)` |
| **Tổng Thu (Tháng)** | `giao_dich` | `SUM(so_tien) WHERE loai_giao_dich = 'thu_nhap' AND thang = hiện tại` |
| **Tổng Chi (Tháng)** | `giao_dich` | `SUM(so_tien) WHERE loai_giao_dich = 'chi_phi' AND thang = hiện tại` |
| **% Tăng trưởng** | `giao_dich` | Tính tổng thu tháng này vs tháng trước, sau đó tính % trong code Node.js |
| **Tiến độ Ngân sách** | `ngan_sach` | `(da_chi_tieu / gioi_han_chi_tieu) * 100` |

### 3. Quy trình cập nhật dữ liệu tự động
Mỗi khi một giao dịch mới được thêm vào bảng `giao_dich`, Dashboard sẽ tự động cập nhật vì:
1. Frontend gọi API `/api/dashboard/summary`.
2. Backend thực hiện lệnh `SUM` trực tiếp trên SQL để lấy con số mới nhất.
3. Hệ thống không lưu con số "Tổng" cố định, mà luôn tính toán lại từ các giao dịch nhỏ để đảm bảo **tính chính xác tuyệt đối**.

---

## 🚨 Khắc Phục Sự Cố (Troubleshooting)

### ⚠️ Lỗi "Chết Port" khi chạy Backend (EADDRINUSE: address already in use :::5000)

**Nguyên nhân**: Khi bạn chạy lệnh `npm run dev` ở Backend nhưng lỡ tắt Terminal không đúng cách, hoặc một phiên bản Node.js cũ chưa tắt hẳn đang chiếm giữ Cổng mạng (`Port 5000`). Điều này khiến Server hiện tại không thể khởi động vì không có chỗ.

**Cách khắc phục cực nhanh (Chỉ 2 dòng lệnh):**

Nếu bạn dùng hệ điều hành **Windows**, hãy mở **PowerShell** hoặc **Command Prompt (CMD)** lên và chạy lần lượt 2 lệnh sau:

**Bước 1: Tìm ra thủ phạm (Process ID) đang chiếm cổng 5000**
```bash
netstat -ano | findstr :5000
```
> Kết quả sổ ra sẽ có 1 dãy số ở tận cùng bên phải, đó là số **PID** (Ví dụ: `1924` hoặc `14322`).

**Bước 2: Tiêu diệt tiến trình đó (Thay `<PID>` bằng con số ở bước 1)**
```bash
taskkill /F /PID <PID>
```
> VD nếu số là 1924, bạn gõ: `taskkill /F /PID 1924`
> Hệ thống báo chữ "SUCCESS: The process with PID... has been terminated" là thành công!

Sau khi diệt xong, bạn quay lại Terminal gõ `npm run dev` để chạy Server bình thường.

---

## 🚀 Hướng dẫn Cài đặt cho người mới (Setup Guide)

Nếu bạn vừa Clone dự án này về, hãy thực hiện các bước sau để chạy được App:

### 1. Cài đặt Phụ thuộc (Dependencies)
```bash
# Cài cho Backend
cd backend
npm install

# Cài cho Frontend
cd ..
cd frontend
npm install
```

### 2. Cấu hình Môi trường (.env)
- Vào thư mục `backend`, copy file `.env.example` thành file `.env`.
- Mở file `.env` ra và điền thông tin Database PostgreSQL của máy bạn (User, Password...).

### 3. Khởi tạo Database
- Mở công cụ quản lý Database (pgAdmin hoặc terminal).
- Chạy toàn bộ mã SQL trong file `backend/init.sql` để tạo bảng và nạp dữ liệu mẫu (Tài khoản: `11a6thaianhtai@gmail.com`).

### 4. Chạy dự án
- **Backend**: `npm run dev` (tại /backend)
- **Frontend**: `npm run dev` (tại /frontend)

---
*Dự án hoàn thành - Chúc bạn bảo vệ Đồ án (Sprint) đạt kết quả Cao nhất!* 🚀
