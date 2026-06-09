# Failure Test Checklist

Checklist này dùng để kiểm tra các trạng thái lỗi chính của HustFood khi demo hoặc trước khi deploy.

## 1. Mất mạng ở client

- Tắt network trong DevTools.
- Mở `/orders` bằng tài khoản khách hàng.
- Kỳ vọng: trang không crash, hiển thị thông báo không tải được đơn hàng hoặc giữ dữ liệu cũ.
- Mở `/orders/[id]`.
- Kỳ vọng: SSE lỗi thì fallback sang polling; nếu polling cũng lỗi thì hiển thị message lỗi.
- Mở `/seller` và `/shipper`.
- Kỳ vọng: bảng giữ layout, hiển thị trạng thái đang tải hoặc thông báo không tải được dữ liệu.

## 2. Database fail

- Đổi tạm `DATABASE_URL` sang host sai hoặc dừng MySQL local.
- Chạy `npm run dev`.
- Gọi các API chính: `/api/products`, `/api/orders`, `/api/reviews`, `/api/merchant-profile`.
- Kỳ vọng: API trả JSON `{ "error": "..." }` với status 5xx hoặc 4xx phù hợp, không trả stack trace.
- Khôi phục `DATABASE_URL`, chạy `npx prisma db push`, thử lại luồng checkout.

## 3. Form loading/error

- `/login`: sai mật khẩu, thiếu field, Google OAuth thiếu biến môi trường.
- `/checkout`: số điện thoại sai, payment checksum sai, network fail khi đặt đơn.
- `/orders/[id]`: gửi review khi đơn chưa hoàn thành, upload ảnh quá 5MB, comment quá 1000 ký tự, comment có ngôn từ vi phạm.
- `/seller`: lưu hồ sơ thiếu field, tạo danh mục trống, upload ảnh lỗi, xóa món đang nằm trong đơn xử lý.
- `/shipper`: nhận đơn đã có shipper, hoàn thành COD trước khi thu tiền, cập nhật GPS sai tọa độ.
- `/admin`: khóa tài khoản chính mình, cập nhật cửa hàng không tồn tại, đánh dấu hoàn tiền đơn không tồn tại.

## 4. Backup database

- Thiết lập `DATABASE_URL` thật trong `.env`.
- Cài `mariadb-dump` hoặc `mysqldump`.
- Chạy `npm run backup:db`.
- Kỳ vọng: file `.sql` mới xuất hiện trong thư mục `backups/`.
- Trên GitHub Actions, cấu hình secret `DATABASE_URL` để workflow `Database Backup` chạy hằng ngày.
