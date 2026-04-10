# 🚀 Smart Finance Virtual Assistant - Hướng dẫn Chạy Dự Án

## Yêu cầu
- **Node.js** v18+ 
- **PostgreSQL** 14+ (xem cài đặt bên dưới)

---

## Bước 1: Cài PostgreSQL (nếu chưa có)

Tải và cài từ: https://www.postgresql.org/download/windows/

> Trong quá trình cài, nhớ ghi nhớ password cho user **postgres**

---

## Bước 2: Tạo Database

### Cách 1: Chạy script tự động
```bat
setup-db.bat
```

### Cách 2: Chạy thủ công
Mở **pgAdmin** hoặc **psql** và chạy:
```sql
CREATE DATABASE smart_finance;
```
Sau đó chạy file `backend/init.sql` vào database `smart_finance`.

---

## Bước 3: Cấu hình Backend

File `backend/.env` đã được tạo sẵn:
```
DATABASE_URL=postgresql://novafinance:securepassword123@localhost:5432/smart_finance
JWT_SECRET=nova_finance_super_secret_jwt_key_2026
PORT=5000
```

> Nếu PostgreSQL của bạn dùng user/password khác, hãy chỉnh sửa `DATABASE_URL` trong `backend/.env`

---

## Bước 4: Chạy Backend

```bash
cd backend
npm install
npm run dev
```

Kết quả khi thành công:
```
🚀 Server running on http://localhost:5000
✅ PostgreSQL connected successfully
```

---

## Bước 5: Chạy Frontend

```bash
cd frontend
npm install
npm run dev
```

Mở trình duyệt: **http://localhost:5173**

---

## Tài khoản Test

| Email | Mật khẩu | Vai trò |
|-------|----------|---------|
| test@test.com | password | Demo user |
| an.nguyen@example.com | password | User tháng 3 months data |
| binh.tran@example.com | password | User basic |
| chau.le@example.com | password | User thu nhập cao |

---

## Cấu trúc Database

```
users          - Tài khoản người dùng (10 users)
categories     - Danh mục thu/chi (15 categories)
transactions   - Giao dịch (40+ records)
budgets        - Ngân sách theo tháng (14 records)
savings_goals  - Mục tiêu tiết kiệm (10 records)
```

---

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|---------|-------|
| POST | /api/auth/register | Đăng ký |
| POST | /api/auth/login | Đăng nhập |
| GET | /api/auth/me | Thông tin user (JWT required) |
| GET | /api/dashboard/summary | Tổng quan tài chính |
| GET | /api/dashboard/transactions | Giao dịch gần đây |
| GET | /api/dashboard/budget | Ngân sách tháng |
| GET | /api/dashboard/savings-goals | Mục tiêu tiết kiệm |
| GET | /api/dashboard/chart-data | Dữ liệu biểu đồ |

---

## Lỗi thường gặp

### Lỗi "PostgreSQL connection failed"
→ Kiểm tra PostgreSQL đã chạy chưa
→ Kiểm tra `DATABASE_URL` trong `backend/.env`

### Frontend không kết nối được backend
→ Đảm bảo backend đang chạy tại `http://localhost:5000`
→ Kiểm tra CORS settings

### TypeScript errors
→ Chạy `npm install` trong thư mục tương ứng
→ Đảm bảo Node.js version >= 18
