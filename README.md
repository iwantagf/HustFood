# HustFood

Ứng dụng bán đồ ăn nhanh xây dựng bằng Next.js với cấu trúc `app/` hiện đại.

## Các chức năng hiện tại

- Đặt món online với giỏ hàng và thanh toán.
- Trang sản phẩm chính hiển thị thực đơn từ `src/data/products.json`.
- Giỏ hàng lưu trong `localStorage` cho khách hàng.
- Trang `checkout` chỉ mở cho vai trò `customer`.
- Trang `seller` dành cho vai trò `seller`, gồm:
  - Dashboard seller.
  - Theo dõi đơn hàng và cập nhật trạng thái.
  - Báo cáo doanh thu cơ bản.
- Trang `admin` dành cho vai trò `admin`, gồm:
  - Dashboard tổng quan đơn hàng.
  - Quản lý đơn hàng.
  - Quản lý thực đơn (thêm/xóa món).
- API nội bộ với các route:
  - `/api/orders`
  - `/api/products`
  - `/api/upload`
- Hệ thống phân quyền đơn giản theo vai trò:
  - `customer`, `seller`, `admin`.
  - Người dùng chọn vai trò tại `/login`.

## Khởi động dự án

```bash
npm install
npm run dev
```

Mở trình duyệt tại: `http://localhost:3000`

## Cấu trúc chính

- `src/app/page.js` - trang chủ.
- `src/app/seller/page.js` - trang seller.
- `src/app/admin/page.js` - trang admin dashboard.
- `src/app/admin/menu/page.js` - quản lý thực đơn.
- `src/app/admin/orders/page.js` - quản lý đơn hàng.
- `src/app/checkout/page.js` - trang thanh toán.
- `src/app/login/page.js` - trang chọn vai trò.
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
- Các dữ liệu mẫu được lưu trong `src/data/`.
- Trang admin và seller hiện đang dùng xác thực client-side đơn giản, phù hợp với demo nội bộ.
