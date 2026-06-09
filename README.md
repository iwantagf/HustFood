# HustFood

HustFood là ứng dụng đặt và giao đồ ăn trực tuyến được xây dựng bằng Next.js App Router, React và Prisma/MySQL. Dự án mô phỏng các luồng chính trong SRS: khách hàng đặt món, người bán xử lý đơn, người giao hàng nhận giao, quản trị viên quản lý nền tảng.

## 1. Yêu cầu hệ thống

### 1.1 Môi trường chạy

- Node.js LTS, khuyến nghị Node.js 20+.
- npm, đi kèm Node.js.
- MySQL Server hoặc managed MySQL như Aiven.
- Git.

### 1.2 Công nghệ sử dụng

- Next.js `16.x`.
- React `19.x`.
- Prisma `5.x`.
- MySQL datasource.
- Cookie httpOnly/JWT demo cho session đăng nhập.
- Guard theo role cho UI và API thao tác dữ liệu.

### 1.3 Biến môi trường

Tạo file `.env` từ file mẫu:

```bash
cp .env.example .env
```

Biến bắt buộc:

```env
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE?ssl-mode=REQUIRED"
```

Ghi chú:

- Không commit `.env`.
- Với Aiven hoặc managed MySQL, thường cần giữ `ssl-mode=REQUIRED`.
- Nếu đổi schema Prisma, cần chạy lại `npx prisma db push`.

## 2. Khởi động nhanh

### 2.1 Cài đặt dependencies

```bash
npm install
```

### 2.2 Generate Prisma Client

```bash
npx prisma generate
```

### 2.3 Khởi tạo database

```bash
npx prisma db push
```

Seed dữ liệu mẫu:

```bash
npm run seed
```

Nếu cần seed tài khoản quản trị viên, cấu hình `SEED_ADMIN_USERNAME` và `SEED_ADMIN_PASSWORD` trong `.env`.

### 2.4 Chạy development server

```bash
npm run dev
```

Mở trình duyệt tại:

```text
http://localhost:3000
```

### 2.5 Build production

```bash
npm run build
npm start
```

### 2.6 Installation guide cho team

Quy trình cài đặt từ máy mới:

```bash
git clone https://github.com/iwantagf/HustFood.git
cd HustFood
cp .env.example .env
npm install
npx prisma generate
npx prisma db push
npm run seed
npm run dev
```

Sau khi chạy `npm run dev`, mở `http://localhost:3000`.

Trước khi chạy các lệnh Prisma, cập nhật `DATABASE_URL` trong `.env` trỏ tới MySQL local hoặc database được team chia sẻ. Nếu dùng database managed như Aiven, giữ `ssl-mode=REQUIRED` trong connection string.

## 3. Môi trường kiểm thử

### 3.1 Thiết lập test local

Môi trường test tối thiểu:

- `.env` có `DATABASE_URL` hợp lệ.
- Database đã chạy `npx prisma db push`.
- Đã chạy `npm run seed` nếu cần tài khoản admin test.
- Dev server chạy bằng `npm run dev`.

### 3.2 Tài khoản demo

- Tài khoản `Quản trị viên` demo lấy từ `DEMO_ADMIN_USERNAME` và `DEMO_ADMIN_PASSWORD` trong `.env`.
- Các tài khoản test có sẵn trong `DEMO_MODE=true` và được seed bằng `npm run seed`:
  - `dongmanhhung` / `1` / `Người bán hàng`
  - `tadinhtam` / `1` / `Khách hàng`
  - `doanducmanh` / `1` / `Shipper`
  - `nguyendanhthai` / `1` / `Khách hàng`
- Người dùng thường có thể tạo tài khoản tại `/login` bằng Gmail.
- Social login hiện là mô phỏng qua Google/Facebook/Instagram, chưa phải OAuth thật.

### 3.3 Luồng test thủ công chính

- `Khách hàng`: `/` -> thêm món -> `/cart` -> `/checkout` -> `/success`.
- `Người bán`: `/login` -> đăng nhập/tạo tài khoản role `Người bán` -> `/seller`.
- `Người giao hàng`: `/login` -> đăng nhập/tạo tài khoản role `Người giao hàng` -> `/shipper`.
- `Quản trị viên`: `/login` -> đăng nhập bằng tài khoản demo trong `.env` -> `/admin`.

## 4. Các script có sẵn

```bash
npm run dev
```

Chạy Next.js ở chế độ phát triển.

```bash
npm run build
```

Build production và kiểm tra lỗi compile.

```bash
npm start
```

Chạy build production sau khi đã `npm run build`.

```bash
npm run lint
```

Chạy ESLint toàn repo. Lưu ý: repo hiện còn một số lỗi lint legacy ở các page cũ liên quan rule `react-hooks/set-state-in-effect`.

```bash
npm run seed
```

Seed sản phẩm mẫu và tài khoản admin test.

## 5. Lệnh debug

### 5.1 Prisma

Validate schema:

```bash
npx prisma validate
```

Generate Prisma Client:

```bash
npx prisma generate
```

Sync schema lên database:

```bash
npx prisma db push
```

Mở Prisma Studio:

```bash
npx prisma studio
```

In schema từ database để kiểm tra kết nối:

```bash
npx prisma db pull --print
```

### 5.2 Next.js

Build có debug:

```bash
npx next build --debug
```

Chạy dev server trên port khác:

```bash
npm run dev -- -p 3001
```

### 5.3 Git

Kiểm tra branch và file thay đổi:

```bash
git status --short --branch
```

Xem commit gần nhất:

```bash
git log --oneline --decorate -5
```

Kiểm tra whitespace trước khi commit:

```bash
git diff --check
```

### 5.4 Smoke test API

Khi dev server đang chạy tại `http://localhost:3000`, có thể thử nhanh:

```bash
curl http://localhost:3000/api/products
curl http://localhost:3000/api/orders
curl http://localhost:3000/api/merchant-profile
```

Đăng nhập credential:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"<username-or-email>","password":"<password>"}'
```

Tạo tài khoản Gmail:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"tester@gmail.com","password":"<password>","displayName":"Tester","role":"customer"}'
```

## 6. Cấu trúc repository

```text
.
├── prisma/
│   ├── schema.prisma
│   └── seed.js
├── public/
│   └── images/
├── src/
│   ├── app/
│   │   ├── api/
│   │   ├── admin/
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── login/
│   │   ├── orders/
│   │   ├── seller/
│   │   ├── shipper/
│   │   ├── success/
│   │   ├── layout.js
│   │   └── page.js
│   ├── components/
│   ├── context/
│   └── lib/
├── docs/
│   └── SRS_TODO.md
├── .env.example
├── package.json
└── README.md
```

### 6.1 Các file quan trọng

- `prisma/schema.prisma`: Prisma models and MySQL datasource.
- `prisma/seed.js`: seed products and test admin account.
- `src/lib/prisma.js`: shared Prisma client.
- `src/lib/auth/password.js`: password hashing and verification.
- `src/lib/auth/users.js`: auth helpers and role labels.
- `src/context/AuthContext.js`: demo auth session and role context.
- `src/context/CartContext.js`: localStorage cart state.
- `src/components/Header.js`: navigation and role-aware links.
- `docs/SRS_TODO.md`: implementation checklist mapped to SRS.

## 7. Các trang chính

### 7.1 Trang public và Khách hàng

- `/`: home page, search/filter cửa hàng và món theo từ khóa, giá, khoảng cách demo, điểm đánh giá.
- `/stores/[id]`: trang chi tiết cửa hàng và menu theo cửa hàng.
- `/cart`: shopping cart.
- `/checkout`: checkout, allowed for `customer`.
- `/success`: order success page.
- `/orders`: danh sách đơn của khách hàng, cập nhật realtime bằng SSE.
- `/orders/[id]`: chi tiết theo dõi đơn với progress, ETA và vị trí người giao hàng.
- `/login`: credential login, Gmail registration, demo social login.

### 7.2 Người bán

- `/seller`: seller dashboard, merchant profile, order status update, product proposal, revenue summary.

### 7.3 Người giao hàng

- `/shipper`: protected shipper dashboard placeholder for delivery workflow.

### 7.4 Quản trị viên

- `/admin`: admin dashboard.
- `/admin/orders`: order management.
- `/admin/menu`: menu management.

## 8. API routes

### 8.1 Auth APIs

#### `POST /api/auth/login`

Đăng nhập bằng username/Gmail và mật khẩu.

Body:

```json
{
  "identifier": "<username-or-email>",
  "password": "<password>"
}
```

Response:

```json
{
  "user": {
    "id": "...",
    "email": null,
    "username": "...",
    "displayName": "...",
    "role": "admin",
    "provider": "credentials"
  }
}
```

#### `POST /api/auth/register`

Tạo tài khoản bằng Gmail. Cho phép role `customer`, `seller`, `shipper`.

Body:

```json
{
  "email": "tester@gmail.com",
  "password": "1",
  "displayName": "Tester",
  "role": "customer"
}
```

#### `POST /api/auth/social`

Đăng nhập social mô phỏng. Provider hỗ trợ: `google`, `facebook`, `instagram`.

Body:

```json
{
  "provider": "google",
  "email": "tester@gmail.com"
}
```

### 8.2 Product APIs

#### `GET /api/products`

Lấy danh sách món ăn.

- `GET /api/products?scope=mine`: người bán lấy thực đơn của chính cửa hàng.

#### `POST /api/products`

Tạo món ăn. `admin` tạo món chung, `seller` tạo món thuộc cửa hàng của mình.

Body:

```json
{
  "name": "Burger",
  "desc": "Mô tả món ăn",
  "price": "65.000đ",
  "image": "/images/burger.png",
  "categoryId": "category_id",
  "options": {
    "sizes": "Nhỏ, Vừa, Lớn",
    "toppings": "Phô mai, Trứng",
    "tastes": "Không cay, Cay vừa",
    "allowNote": true
  },
  "isAvailable": true,
  "isHidden": false
}
```

#### `PUT /api/products`

Sửa món ăn. `seller` chỉ được sửa món thuộc cửa hàng của mình.

Body:

```json
{
  "id": "product_id",
  "name": "Burger",
  "desc": "Mô tả món ăn",
  "price": "65.000đ",
  "image": "/images/burger.png",
  "categoryId": "category_id",
  "options": {
    "sizes": "Nhỏ, Vừa, Lớn",
    "toppings": "Phô mai, Trứng",
    "tastes": "Không cay, Cay vừa",
    "allowNote": true
  },
  "isAvailable": true,
  "isHidden": false
}
```

#### `DELETE /api/products`

Xóa món ăn theo `id`. `seller` chỉ được xóa món thuộc cửa hàng của mình. Nếu món đang nằm trong đơn đang xử lý, hệ thống chặn xóa và yêu cầu chuyển `Hết hàng` hoặc `Ẩn`.

Body:

```json
{
  "id": "product_id"
}
```

### 8.3 Menu Category APIs

#### `GET /api/menu-categories?scope=mine`

Người bán lấy danh mục thực đơn của chính cửa hàng.

#### `POST /api/menu-categories`

Người bán tạo danh mục thực đơn.

Body:

```json
{
  "name": "Burger"
}
```

### 8.4 Order APIs

#### `GET /api/orders`

Lấy danh sách đơn hàng theo role. `Khách hàng` chỉ thấy đơn của chính mình. `Người bán` chỉ thấy đơn của cửa hàng mình. `Người giao hàng` thấy đơn `ready_for_pickup` chưa ai nhận và các đơn đã gán cho chính họ.

#### `GET /api/orders/stream`

SSE stream cập nhật đơn hàng theo quyền truy cập hiện tại. Có thể truyền `id` để theo dõi một đơn cụ thể.

```text
GET /api/orders/stream
GET /api/orders/stream?id=%23HF1234
```

Stream trả event `orders` mỗi 5 giây, dùng cho trang `/orders` và `/orders/[id]`.

#### `POST /api/orders`

Tạo đơn hàng.

Body:

```json
{
  "customer": {
    "name": "Nguyễn Văn A",
    "phone": "0987654321",
    "address": "Hà Nội",
    "notes": "",
    "paymentMethod": "cod"
  },
  "items": [
    {
      "id": "product_id",
      "cartKey": "product_id:{...}",
      "quantity": 1,
      "selectedOptions": {
        "size": "Vừa",
        "topping": "Phô mai",
        "taste": "Không cay"
      },
      "itemNote": "Ít sốt"
    }
  ],
  "voucherCode": "HUSTFOOD10",
  "payment": {
    "provider": "mock",
    "transactionId": "MOCK-MOMO-123",
    "status": "paid",
    "checksum": "mock_checksum"
  }
}
```

Nếu giỏ hàng có món từ nhiều cửa hàng, API tự tách thành nhiều đơn theo `merchantId`. Với `momo` hoặc `card`, API kiểm tra checksum của payment mock trước khi lưu đơn. Nếu payment mock thất bại, đơn được lưu với trạng thái `payment_retry`.

#### `PUT /api/orders`

Cập nhật trạng thái đơn. Luồng người bán dùng `pending` -> `accepted` -> `preparing` -> `ready_for_pickup`; shipper nhận đơn bằng `action: "accept"` rồi cập nhật `picked_up` -> `delivering` -> `completed`.

Body:

```json
{
  "id": "#HF1234",
  "status": "accepted"
}
```

Người giao hàng có các action riêng:

```json
{
  "id": "#HF1234",
  "action": "accept"
}
```

```json
{
  "id": "#HF1234",
  "action": "collect_cod"
}
```

```json
{
  "id": "#HF1234",
  "action": "update_location",
  "location": {
    "latitude": 21.0059,
    "longitude": 105.8431
  }
}
```

```json
{
  "id": "#HF1234",
  "action": "report_issue",
  "issue": "Khách không nghe máy"
}
```

Đơn COD phải được ghi nhận `collect_cod` trước khi chuyển `completed`. Màn hình `/shipper` dùng GPS trình duyệt để sắp xếp/lọc đơn gần điểm lấy hàng và lưu vị trí cuối của người giao hàng vào đơn.

Từ chối đơn cần lý do:

```json
{
  "id": "#HF1234",
  "status": "rejected",
  "rejectionReason": "Cửa hàng đã hết nguyên liệu"
}
```

#### `DELETE /api/orders`

Xóa đơn hàng theo `id`. `Người bán` chỉ được xóa đơn thuộc `merchantId` của mình.

### 8.5 Merchant Profile APIs

#### `GET /api/merchant-profile`

Người bán lấy hồ sơ cửa hàng của chính mình. Quản trị viên lấy danh sách hồ sơ cửa hàng để duyệt/khóa.

#### `PUT /api/merchant-profile`

Cập nhật hồ sơ cửa hàng của người bán đang đăng nhập.

Body:

```json
{
  "shopName": "HustFood Người bán",
  "address": "Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội",
  "mapLocation": "21.0059,105.8431",
  "openTime": "08:00",
  "closeTime": "22:00",
  "phone": "0987654321",
  "image": "/images/burger.png",
  "status": "active"
}
```

#### `PATCH /api/merchant-profile`

Quản trị viên cập nhật trạng thái cửa hàng.

Body:

```json
{
  "id": "merchant_profile_id",
  "status": "active"
}
```

#### `GET /api/merchant-profile/public`

Lấy danh sách cửa hàng đang hoạt động để hiển thị cho khách hàng.

### 8.6 Proposal APIs

#### `GET /api/proposals`

Lấy danh sách đề xuất món mới.

#### `POST /api/proposals`

Người bán gửi đề xuất món mới.

#### `PUT /api/proposals`

Quản trị viên duyệt hoặc từ chối đề xuất.

Body:

```json
{
  "id": "proposal_id",
  "status": "accepted"
}
```

Nếu `status = accepted`, hệ thống tạo món mới trong `Product` và giữ chủ sở hữu là người bán đã gửi đề xuất.

### 8.7 Notification APIs

#### `GET /api/notifications`

Lấy danh sách thông báo.

#### `PUT /api/notifications`

Đánh dấu thông báo đã đọc.

Body:

```json
{
  "id": "notification_id"
}
```

Đánh dấu tất cả:

```json
{
  "id": "all"
}
```

### 8.8 Cart APIs

#### `GET /api/cart`

Khách hàng lấy giỏ hàng đã lưu server-side.

#### `PUT /api/cart`

Khách hàng lưu giỏ hàng server-side.

Body:

```json
{
  "items": []
}
```

#### `DELETE /api/cart`

Khách hàng xóa giỏ hàng đã lưu.

### 8.9 Voucher APIs

#### `POST /api/vouchers/validate`

Kiểm tra mã giảm giá theo tạm tính, giá trị tối thiểu, hạn sử dụng và số lượt dùng.

Body:

```json
{
  "code": "HUSTFOOD10",
  "subtotal": 120000
}
```

Mã seed/demo có sẵn: `HUSTFOOD10`, `SV20`.

### 8.10 Upload API

#### `POST /api/upload`

Upload file ảnh. Kiểm tra implementation cụ thể tại `src/app/api/upload/route.js`.

## 9. Database models

### 9.1 `User`

Lưu tài khoản đăng nhập.

- `email`: Gmail cho tài khoản tự tạo hoặc social.
- `username`: dùng cho tài khoản admin test.
- `role`: `customer`, `seller`, `shipper`, `admin`.
- `provider`: `credentials`, `google`, `facebook`, `instagram`.
- `passwordHash`, `passwordSalt`: lưu mật khẩu đã hash, không lưu plaintext.

### 9.2 `MerchantProfile`

Lưu hồ sơ cửa hàng người bán: tên quán, địa chỉ, tọa độ, giờ mở/đóng cửa, số điện thoại, ảnh, trạng thái.

### 9.3 `Product`

Lưu món ăn. `ownerId` liên kết món với người bán; món không có `ownerId` là món chung do quản trị viên tạo. `categoryId`, `options`, `isAvailable`, `isHidden` phục vụ quản lý danh mục, tùy chọn, còn/hết hàng và ẩn món.

### 9.4 `MenuCategory`

Lưu danh mục món theo cửa hàng người bán.

### 9.5 `Order`

Lưu đơn hàng. `customerId` gắn đơn với khách hàng để giới hạn quyền xem tracking. `merchantId`/`merchantName` dùng để tách đơn theo cửa hàng; `deliveryFee`, `discount`, `finalTotal`, `paymentMethod`, `paymentStatus`, `paymentProvider`, `paymentTransactionId`, `paymentChecksum` lưu trạng thái chốt đơn/thanh toán. `shipperId`, thông tin COD, issue và tọa độ shipper cuối cùng phục vụ luồng giao hàng/tracking. `customer` và `items` vẫn là JSON để demo nhanh.

### 9.6 `SavedCart`

Lưu giỏ hàng server-side theo `User` khi khách hàng đã đăng nhập.

### 9.7 `Voucher`

Lưu mã giảm giá, loại giảm, giá trị tối thiểu, hạn dùng, giới hạn lượt dùng và số lượt đã dùng.

### 9.8 `Proposal`

Lưu đề xuất món mới từ người bán.

### 9.9 `Notification`

Lưu thông báo nội bộ cho dashboard.

## 10. Trạng thái tính năng hiện tại

### 10.1 Đã làm hoặc đã làm một phần

- RBAC demo với 4 role.
- Credential login, Gmail registration, demo social login.
- Password hashing bằng `scrypt`.
- Customer product menu, cart, voucher, checkout.
- Seller dashboard, merchant profile, order status update.
- Shipper dashboard nhận đơn và cập nhật trạng thái giao hàng.
- Customer order tracking realtime bằng SSE, progress bar, ETA và vị trí shipper cuối cùng.
- Admin dashboard, order/menu/proposal management.
- Seller/Admin financial dashboard với filter hôm nay/tuần/tháng, biểu đồ, doanh thu theo cửa hàng và export CSV/PDF.
- Prisma schema for current demo models.

### 10.2 Chưa làm

Chi tiết theo SRS nằm trong:

```text
docs/SRS_TODO.md
```

Các phần lớn còn thiếu:

- Review/rating.
- Sentiment analysis không nằm trong scope demo hiện tại.

## 11. Hướng dẫn đóng góp

### 11.1 Quy tắc đặt tên branch

Tạo branch từ `main` hoặc branch đang được nhóm thống nhất:

```bash
git checkout main
git pull
git checkout -b features/ten-tinh-nang
```

Gợi ý:

- `features/ten-tinh-nang` cho feature.
- `hotfix/ten-loi` cho sửa lỗi khẩn cấp.
- `docs/noi-dung` cho tài liệu.

### 11.2 Trước khi commit

Chạy các lệnh tối thiểu:

```bash
npx prisma validate
npm run build
git diff --check
```

Nếu thay đổi auth/API quan trọng, test thêm bằng curl hoặc UI.

### 11.3 Commit Message

Dùng message rõ ràng:

```bash
git commit -m "feat: add voucher checkout flow"
git commit -m "fix: guard seller order update"
git commit -m "docs: update api guide"
```

### 11.4 Checklist Pull Request

Trong PR nên ghi:

- Mục tiêu thay đổi.
- File/module chính đã sửa.
- API/DB migration nếu có.
- Cách test.
- Screenshot nếu thay đổi GUI.
- Rủi ro hoặc phần chưa hoàn thiện.

## 12. Vấn đề đã biết

- `npx prisma db push` cần DB reachable. Nếu DNS/host Aiven không resolve, cần kiểm tra network, host, port và SSL.
- Social login hiện là demo endpoint, chưa tích hợp OAuth thật.
- Một số UI còn dùng `<img>` nên ESLint có thể cảnh báo về tối ưu ảnh Next.js.
