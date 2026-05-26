# HustFood

Ứng dụng bán đồ ăn nhanh xây dựng bằng Next.js với cấu trúc `app/` hiện đại.

## Các chức năng hiện tại

- Đặt món online với giỏ hàng và thanh toán.
- Trang sản phẩm chính hiển thị thực đơn từ `src/data/products.json`.
- Giỏ hàng lưu trong `localStorage` cho khách hàng.
- Trang `checkout` chỉ mở cho vai trò `customer`.
- Trang `seller` dành cho vai trò `seller`/Nguoi ban, gồm:
  - Dashboard Nguoi ban.
  - Khởi tạo và cập nhật hồ sơ cửa hàng.
  - Theo dõi đơn hàng và cập nhật trạng thái.
  - Báo cáo doanh thu cơ bản.
- Trang `shipper` dành cho vai trò `shipper`/Nguoi giao hang, gồm:
  - Dashboard Nguoi giao hang được bảo vệ bằng RBAC.
  - Khung luồng giao hàng để gắn module điều phối đơn ở update tiếp theo.
- Trang `admin` dành cho vai trò `admin`, gồm:
  - Dashboard tổng quan đơn hàng.
  - Quản lý đơn hàng.
  - Quản lý thực đơn (thêm/xóa món).
- API nội bộ với các route:
  - `/api/orders`
  - `/api/products`
  - `/api/merchant-profile`
  - `/api/upload`
- Hệ thống phân quyền đơn giản theo vai trò:
  - `customer`, `seller`, `shipper`, `admin`.
  - Nhãn hiển thị lần lượt là `Khach hang`, `Nguoi ban`, `Nguoi giao hang`, `Quan tri vien`.
  - Người dùng đăng nhập hoặc tạo tài khoản tại `/login`.
- Xác thực demo qua cơ sở dữ liệu:
  - Đăng nhập bằng username/Gmail và mật khẩu.
  - Tạo tài khoản mới bằng Gmail cho vai trò `Khach hang`, `Nguoi ban` hoặc `Nguoi giao hang`.
  - Đăng nhập social mô phỏng qua Google, Facebook, Instagram.
  - Mật khẩu được lưu bằng hash `scrypt` và salt riêng, không lưu plaintext.
  - Tài khoản test `Quan tri vien`: `huyhoangdao` / `1`.

## Khởi động dự án (Dành cho người dùng phổ thông)

Yêu cầu hệ thống:
- Node.js (Khuyên dùng bản LTS)
- MySQL Server

Các bước triển khai:

1. Tải mã nguồn về máy:
```bash
git clone <URL_CUA_REPO>
cd HustFood
```

2. Cài đặt các thư viện yêu cầu:
```bash
npm install
```

3. Cấu hình biến môi trường:
Tạo file cấu hình để kết nối với cơ sở dữ liệu MySQL của bạn.
```bash
cp .env.example .env
```
(Lưu ý: Bạn hãy mở file `.env` vừa tạo và sửa lại dòng `DATABASE_URL` sao cho khớp với tên đăng nhập, mật khẩu, host, port và tên database của bạn trên MySQL. Nếu dùng Aiven hoặc managed MySQL, giữ tham số `ssl-mode=REQUIRED`.)

4. Khởi tạo Database với Prisma:
Chạy lệnh sau để tự động tạo các bảng dữ liệu cần thiết vào MySQL:
```bash
npx prisma db push
```

Seed dữ liệu mẫu và tài khoản test:
```bash
npm run seed
```

5. Khởi động Server:
Chạy ở chế độ phát triển (Development):
```bash
npm run dev
```

Hoặc build và chạy ở chế độ thực tế (Production):
```bash
npm run build
npm start
```

Mở trình duyệt tại: `http://localhost:3000`

## Cấu trúc chính

- `src/app/page.js` - trang chủ.
- `src/app/seller/page.js` - trang seller.
- `src/app/shipper/page.js` - trang shipper.
- `src/app/admin/page.js` - trang admin dashboard.
- `src/app/admin/menu/page.js` - quản lý thực đơn.
- `src/app/admin/orders/page.js` - quản lý đơn hàng.
- `src/app/checkout/page.js` - trang thanh toán.
- `src/app/login/page.js` - trang chọn vai trò.
- `src/app/api/auth/login/route.js` - API đăng nhập bằng username/Gmail.
- `src/app/api/auth/register/route.js` - API tạo tài khoản Gmail.
- `src/app/api/auth/social/route.js` - API đăng nhập social mô phỏng.
- `src/app/api/merchant-profile/route.js` - API hồ sơ cửa hàng Nguoi ban.
- `src/context/AuthContext.js` - quản lý quyền truy cập.
- `src/context/CartContext.js` - quản lý giỏ hàng.

## Hướng dẫn đóng góp

Nếu bạn muốn đóng góp:

1. Tạo branch mới từ `main` hoặc branch chính hiện tại:

```bash
git checkout main
git pull
```

2. Chọn tên branch phù hợp:

- `features/ten-tinh-nang` cho phát triển tính năng mới.
- `hotfix/ten-sua-chua` cho sửa lỗi khẩn cấp.

Ví dụ:

```bash
git checkout -b features/seller-dashboard
```

hoặc:

```bash
git checkout -b hotfix/fix-checkout-bug
```

3. Thực hiện thay đổi và commit rõ ràng:

```bash
git add .
git commit -m "feat: thêm tính năng ..."    # với feature
# hoặc
git commit -m "fix: sửa lỗi ..."              # với hotfix
```

4. Đẩy branch lên remote:

```bash
git push origin features/ten-tinh-nang
```

hoặc:

```bash
git push origin hotfix/ten-sua-chua
```

5. Tạo Pull Request mô tả rõ mục đích, thay đổi chính và cách test.

6. Với hotfix, ưu tiên:

- tạo branch từ `main`
- sửa nhanh, review nhanh
- merge về `main` sau khi kiểm tra

## Ghi chú

- Dự án hiện dùng Next.js `16.x`, React `19.x`.
- Các dữ liệu mẫu được lưu trong `src/data/` (và sử dụng Prisma với MySQL cho dữ liệu thật).
- Phiên đăng nhập demo vẫn được lưu ở `localStorage`; quyền và mật khẩu được kiểm soát bằng bảng `User` trong database.
