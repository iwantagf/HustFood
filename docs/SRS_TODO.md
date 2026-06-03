# Danh sách TODO theo SRS HustFood

## 1. Nguồn đối chiếu

### 1.1 Tài liệu SRS

- File đối chiếu: `/home/hoang/Downloads/Nhóm 8.pdf`.
- Tên dự án trong SRS: Hệ thống Đặt và Giao đồ ăn trực tuyến HustFood.
- Ngày biên soạn SRS: 06/05/2026.
- SRS chia hệ thống thành 4 vai trò: `Khách hàng`, `Người bán`, `Người giao hàng`, `Quản trị viên`.
- SRS liệt kê 12 yêu cầu chức năng: FR-01 đến FR-12.

### 1.2 Trạng thái code hiện tại

- Branch đang làm: `feature-srs-missing-modules`.
- Các module đã có code chính:
  - Trang chủ, thực đơn, giỏ hàng, checkout, success.
  - Login/register demo qua database.
  - Phân quyền client-side theo role.
  - Dashboard `Người bán`, `Người giao hàng`, `Quản trị viên`.
  - API sản phẩm, đơn hàng, thông báo, đề xuất món, upload, hồ sơ cửa hàng, auth.
  - Prisma schema cho `User`, `MerchantProfile`, `Product`, `Order`, `Proposal`, `Notification`.

## 2. Chú thích trạng thái

### 2.1 Ký hiệu

- `[x]` Đã làm.
- `[~]` Đã làm một phần, cần bổ sung.
- `[ ]` Chưa làm.

### 2.2 Mục ưu tiên

- `P0`: cần có để demo đúng luồng SRS cơ bản.
- `P1`: cần có để khớp SRS đầy đủ.
- `P2`: cải tiến sau demo.

## 3. Tổng quan theo module SRS

### 3.1 FR-01: Đăng nhập và phân quyền RBAC

#### 3.1.1 Đã làm

- [x] Thêm bảng `User` trong Prisma.
- [x] Đổi tên role hiển thị:
  - `customer` -> `Khách hàng`
  - `seller` -> `Người bán`
  - `shipper` -> `Người giao hàng`
  - `admin` -> `Quản trị viên`
- [x] Thêm API đăng nhập bằng username/Gmail và mật khẩu: `/api/auth/login`.
- [x] Thêm API tạo tài khoản Gmail: `/api/auth/register`.
- [x] Thêm API social login demo: `/api/auth/social`.
- [x] Hash mật khẩu bằng `scrypt` + salt riêng.
- [x] Thêm seed tài khoản `Quản trị viên` qua biến môi trường.
- [x] Guard route client-side cho `/checkout`, `/seller`, `/shipper`, `/admin`.

#### 3.1.2 Chưa làm

- [ ] P0: Chạy `npx prisma db push` và `npm run seed` trên DB thật khi host Aiven resolve được.
- [x] P1: Đổi session từ `localStorage` sang cookie/JWT server-side theo đúng SRS.
- [x] P1: Khóa tài khoản và thông báo "liên hệ hỗ trợ" khi account bị block.
- [x] P1: Bảo vệ API theo role, không chỉ bảo vệ UI.
- [ ] P2: OAuth thật cho Google/Facebook/Instagram thay vì social login mô phỏng.

### 3.2 FR-02: Khởi tạo và thiết lập hồ sơ cửa hàng

#### 3.2.1 Đã làm

- [x] Thêm model `MerchantProfile`.
- [x] Thêm API `/api/merchant-profile` với `GET` và `PUT`.
- [x] Thêm form hồ sơ cửa hàng trong dashboard `Người bán`.
- [x] Hồ sơ có tên quán, địa chỉ, tọa độ bản đồ, giờ mở/đóng cửa, số điện thoại, ảnh đại diện, trạng thái.
- [x] Validate số điện thoại Việt Nam ở API.

#### 3.2.2 Chưa làm

- [ ] P0: Push schema lên DB thật để tạo bảng `MerchantProfile`.
- [x] P1: Gắn hồ sơ cửa hàng theo user `Người bán` thật, không dùng singleton `ownerRole = seller`.
- [x] P1: Upload ảnh đại diện bằng file thật thay vì nhập URL.
- [x] P1: Hiển thị cửa hàng trên trang tìm kiếm/duyệt của `Khách hàng`.
- [x] P2: Duyệt/khóa cửa hàng từ `Quản trị viên`.

### 3.3 FR-03: Biên soạn, cập nhật thực đơn và tùy chọn món

#### 3.3.1 Đã làm

- [x] Có model `Product`.
- [x] Có API `/api/products` để lấy, tạo, xóa món.
- [x] Có trang `Quản trị viên` quản lý thực đơn.
- [x] `Người bán` có form đề xuất món mới, `Quản trị viên` duyệt để tạo sản phẩm.

#### 3.3.2 Hoàn thiện quản lý thực đơn theo cửa hàng

- [x] `Người bán` quản lý thực đơn của chính cửa hàng.
- [x] Sửa món, không chỉ thêm/xóa.
- [x] Thêm danh mục món `MenuCategory`.
- [x] Thêm tùy chọn món: topping, kích cỡ, cay/ngọt, ghi chú riêng.
- [x] Thêm trạng thái `Còn hàng` / `Hết hàng`.
- [x] Chặn xóa món đang nằm trong đơn đang xử lý, chỉ cho ẩn hoặc hết hàng.
- [x] Upload ảnh món bằng file thật qua `/api/upload`.

### 3.4 FR-04: Tìm kiếm quán ăn và lọc kết quả

#### 3.4.1 Đã làm

- [x] Trang chủ hiển thị danh sách món từ database.
- [x] Có CTA tới khu vực menu.
- [x] Có thanh tìm kiếm món/quán.
- [x] Lọc theo giá.
- [x] Lọc theo khoảng cách GPS demo từ tọa độ cửa hàng.
- [x] Lọc theo điểm đánh giá.
- [x] Trang chi tiết cửa hàng và menu theo cửa hàng.
- [x] Gợi ý món thịnh hành khi không có kết quả.

#### 3.4.2 Chưa làm

- Không còn mục thiếu trong phạm vi FR-04 demo hiện tại.

### 3.5 FR-05: Giỏ hàng, tính tiền tự động và khuyến mãi

#### 3.5.1 Đã làm

- [x] Có `CartContext`.
- [x] Giỏ hàng lưu bằng `localStorage`.
- [x] Thêm/xóa/cập nhật số lượng món.
- [x] Tính tổng số lượng và tổng tiền món.

#### 3.5.2 Chưa làm

- [x] Thêm phí giao hàng theo km hoặc rule demo.
- [x] Thêm voucher/mã giảm giá.
- [x] Validate điều kiện voucher: giá trị tối thiểu, hạn sử dụng, số lần dùng.
- [x] Tách đơn khi thêm món từ 2 cửa hàng khác nhau.
- [x] Topping/tùy chọn món và ghi chú theo từng item.
- [x] Lưu giỏ hàng server-side cho user đã đăng nhập.

### 3.6 FR-06: Thanh toán đa hình thức và chốt đơn

#### 3.6.1 Đã làm

- [x] Có trang checkout cho `Khách hàng`.
- [x] Validate số điện thoại.
- [x] Có hình thức COD, MoMo demo, thẻ/card demo.
- [x] Có modal QR mô phỏng cho thanh toán online.
- [x] Có API tạo đơn `/api/orders`.
- [x] Có trang success sau khi đặt đơn.

#### 3.6.2 Chưa làm

- [ ] P0: Lưu `paymentMethod`, `paymentStatus`, `deliveryFee`, `discount`, `finalTotal` vào DB.
- [ ] P1: Tích hợp cổng thanh toán thật hoặc mock có trạng thái rõ ràng.
- [ ] P1: Checksum/signature verification cho kết quả thanh toán.
- [ ] P1: Trạng thái `Chờ thanh toán lại` khi thanh toán fail.
- [ ] P1: Tạo notification realtime cho `Người bán` khi có đơn mới.

### 3.7 FR-07: Người bán tiếp nhận và chuyển trạng thái đơn

#### 3.7.1 Đã làm

- [x] Dashboard `Người bán` đọc danh sách đơn.
- [x] Cập nhật trạng thái `pending` -> `processing` -> `completed`.
- [x] Có polling 5 giây để làm mới dữ liệu.
- [x] Có thông báo đề xuất món mới.

#### 3.7.2 Chưa làm

- [ ] P0: Đổi workflow status theo SRS: `Đã nhận đơn`, `Đang chuẩn bị`, `Chờ giao hàng`, `Đang giao`, `Hoàn thành`, `Từ chối`.
- [ ] P1: Pop-up/chuông âm thanh khi có đơn mới.
- [ ] P1: Nút `Từ chối đơn` kèm lý do.
- [ ] P1: Broadcast đơn cho `Người giao hàng` gần khu vực.
- [ ] P1: Tách đơn theo cửa hàng của từng `Người bán`.

### 3.8 FR-08: Người giao hàng nhận đơn và cập nhật giao hàng

#### 3.8.1 Đã làm

- [x] Có role `Người giao hàng`.
- [x] Có route guard `/shipper`.
- [x] Có dashboard đơn hàng cho `Người giao hàng`.
- [x] Hiển thị đơn chờ nhận từ các đơn đã sẵn sàng giao.
- [x] Có nút nhận đơn và gắn shipper vào đơn.
- [x] Cập nhật trạng thái `Đã lấy hàng`, `Đang giao`, `Hoàn thành`.

#### 3.8.2 Chưa làm

- [ ] P1: Lọc đơn gần khu vực theo địa chỉ/GPS thật.
- [ ] P1: Ghi nhận COD và doanh thu chuyến đi cho `Người giao hàng`.
- [ ] P1: Báo cáo sự cố khách không nghe máy.
- [ ] P2: GPS/live location mobile-friendly.

### 3.9 FR-09: Theo dõi tiến độ đơn hàng thời gian thực

#### 3.9.1 Đã làm

- [~] Có trang success sau khi đặt đơn.
- [~] Có status đơn trong DB.
- [~] Admin/Người bán có thể xem status.

#### 3.9.2 Chưa làm

- [ ] P0: Trang chi tiết/theo dõi đơn cho `Khách hàng`.
- [ ] P0: Progress bar theo trạng thái đơn.
- [ ] P1: Cập nhật realtime bằng WebSocket/SSE.
- [ ] P1: Bản đồ vị trí `Người giao hàng`.
- [ ] P1: ETA dự kiến.
- [ ] P2: Hiển thị vị trí cập nhật cuối cùng khi mất GPS.

### 3.10 FR-10: Đánh giá sao, bình luận và tải ảnh

#### 3.10.1 Đã làm

- [ ] Chưa có module đánh giá.

#### 3.10.2 Chưa làm

- [ ] P0: Thêm model `Review`.
- [ ] P0: Form đánh giá sau khi đơn `completed`.
- [ ] P0: Chấm sao món ăn và `Người giao hàng`.
- [ ] P1: Bình luận text.
- [ ] P1: Upload ảnh review.
- [ ] P1: Hiển thị review trên cửa hàng/món.
- [ ] P1: Lọc từ ngữ thô tục và ẩn review vi phạm.

### 3.11 FR-11: AI phân tích cảm xúc phản hồi

#### 3.11.1 Đã làm

- [ ] Chưa có module AI sentiment.

#### 3.11.2 Chưa làm

- [ ] P0: Thêm sentiment mock theo rule để demo: positive/neutral/negative.
- [ ] P1: Lưu sentiment vào DB theo review.
- [ ] P1: Cảnh báo review tiêu cực 1 sao trên dashboard `Quản trị viên` và `Người bán`.
- [ ] P2: Hàng đợi xử lý review.
- [ ] P2: Tích hợp model NLP/AI thật.

### 3.12 FR-12: Dashboard thống kê tài chính

#### 3.12.1 Đã làm

- [x] `Người bán` có dashboard doanh thu hoàn thành.
- [x] `Người bán` có đếm đơn cho, đang giao, hoàn thành.
- [x] `Người bán` có top sản phẩm bán chạy.
- [x] `Quản trị viên` có dashboard tổng quan đơn, sản phẩm, đề xuất món.

#### 3.12.2 Chưa làm

- [ ] P1: Bộ lọc thời gian: hôm nay, tuần này, tháng này.
- [ ] P1: Doanh thu theo từng cửa hàng.
- [ ] P1: Thống kê đơn hủy/từ chối.
- [ ] P1: Biểu đồ trực quan.
- [ ] P1: Báo cáo tỷ lệ sentiment.
- [ ] P2: Export CSV/PDF.

## 4. Checklist GUI theo vai trò

### 4.1 Khách hàng

#### 4.1.1 Đã làm

- [x] Trang chủ và menu sản phẩm.
- [x] Product card.
- [x] Giỏ hàng.
- [x] Checkout.
- [x] Success page.
- [x] Đăng nhập/đăng ký.

#### 4.1.2 Chưa làm

- [ ] P0: Trang tìm kiếm/lọc.
- [ ] P0: Trang theo dõi đơn.
- [ ] P0: Trang đánh giá sau đơn.
- [x] Trang chi tiết cửa hàng.
- [x] UI voucher và phí giao hàng.

### 4.2 Người bán

#### 4.2.1 Đã làm

- [x] Dashboard protected.
- [x] Hồ sơ cửa hàng.
- [x] Danh sách đơn hàng.
- [x] Cập nhật trạng thái đơn cơ bản.
- [x] Đề xuất món mới.
- [x] Quản lý menu riêng của cửa hàng.
- [x] Thống kê doanh thu cơ bản.

#### 4.2.2 Chưa làm

- [ ] P0: UI nhận/từ chối đơn đầy đủ.
- [ ] P1: Pop-up đơn mới.
- [ ] P1: Dashboard sentiment.
- [ ] P1: Biểu đồ doanh thu.

### 4.3 Người giao hàng

#### 4.3.1 Đã làm

- [x] Route `/shipper`.
- [x] Guard role `shipper`.
- [x] Dashboard danh sách đơn chờ nhận.
- [x] Nút nhận đơn.
- [x] Nút cập nhật trạng thái giao hàng.

#### 4.3.2 Chưa làm

- [ ] P1: Màn hình chi tiết lộ trình.
- [ ] P1: UI COD/đối soát.
- [ ] P1: UI báo cáo sự cố.

### 4.4 Quản trị viên

#### 4.4.1 Đã làm

- [x] Route `/admin`.
- [x] Guard role `admin`.
- [x] Dashboard tổng quan.
- [x] Quản lý đơn.
- [x] Quản lý thực đơn.
- [x] Duyệt đề xuất món.

#### 4.4.2 Chưa làm

- [ ] P0: Quản lý user/RBAC.
- [ ] P1: Quản lý/khóa tài khoản.
- [ ] P1: Duyệt/khóa cửa hàng.
- [ ] P1: Dashboard review sentiment.
- [ ] P2: Quản lý khiếu nại và hoàn tiền.

## 5. Checklist API và database

### 5.1 Đã làm

- [x] `User`.
- [x] `MerchantProfile`.
- [x] `Product`.
- [x] `Order`.
- [x] Trường gắn shipper vào `Order`.
- [x] `Proposal`.
- [x] `Notification`.
- [x] API auth: login/register/social.
- [x] API merchant profile.
- [x] API products.
- [x] API orders.
- [x] API proposals.
- [x] API notifications.
- [x] API upload.

### 5.2 Chưa làm

- [ ] P0: Push schema lên DB thật và seed admin test.
- [x] `Voucher`.
- [ ] P0: `Review`.
- [ ] P0: Thêm trường payment/delivery vào `Order`.
- [ ] P1: `Shop`/`MerchantProfile` liên kết với `User`.
- [ ] P1: `Transaction`/`Payment`.
- [x] `MenuCategory`.
- [x] Tùy chọn món bằng `Product.options`.
- [ ] P1: `SentimentAnalysis`.
- [ ] P1: API authorization theo role.

## 6. Checklist phi chức năng

### 6.1 Hiệu năng

- [~] Có render Next.js và API route cơ bản.
- [ ] P1: Do/kiểm tra response time dưới 1.5s cho menu và dưới 3s cho giao dịch.
- [ ] P1: Load test giờ cao điểm 11h-13h, 18h-20h.
- [ ] P1: Realtime latency dưới 1 giây cho thông báo đơn mới.

### 6.2 Bảo mật

- [x] Mật khẩu hash bằng `scrypt` + salt.
- [~] RBAC có trên UI/route guard client-side.
- [ ] P0: Bảo vệ API theo role.
- [ ] P1: JWT/cookie httpOnly thay cho localStorage.
- [ ] P1: HTTPS/TLS trên môi trường deploy.
- [ ] P1: Signature/checksum cho thanh toán online.
- [ ] P1: Rate limit login/register.

### 6.3 Khả dụng và tin cậy

- [x] Giỏ hàng lưu localStorage.
- [~] UI responsive cơ bản.
- [ ] P1: Sao lưu DB hằng ngày.
- [ ] P1: Error state/loading state đầy đủ cho từng form.
- [ ] P1: Test khi mất mạng/DB fail.

### 6.4 Mở rộng và bảo trì

- [~] API đang tách theo route/module.
- [~] Prisma schema đã có các model cốt lõi.
- [ ] P1: Tách service/helper cho order, payment, delivery, review.
- [ ] P1: Thêm test case unit/integration.
- [ ] P1: CI lint/build.
- [ ] P2: Chuẩn hóa status enum thay vì string tự do.

## 7. Thứ tự update đề nghị tiếp theo

### 7.1 P0 nên làm trước

1. Push schema DB và seed admin test khi kết nối Aiven đúng.
2. Payment fields trong `Order`.
3. Order tracking cho `Khách hàng`.
4. Review + sentiment mock.
5. API authorization theo role.

### 7.2 P1 sau khi demo P0 ổn định

1. Tìm kiếm/lọc quán ăn và món.
2. Quản lý menu theo cửa hàng của `Người bán`.
3. Realtime bằng WebSocket/SSE.
4. Dashboard biểu đồ và lọc thời gian.
5. OAuth thật và JWT/cookie.
