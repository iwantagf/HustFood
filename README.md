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

## 3. Môi trường kiểm thử

### 3.1 Thiết lập test local

Môi trường test tối thiểu:

- `.env` có `DATABASE_URL` hợp lệ.
- Database đã chạy `npx prisma db push`.
- Đã chạy `npm run seed` nếu cần tài khoản admin test.
- Dev server chạy bằng `npm run dev`.

### 3.2 Tài khoản demo

- Tài khoản `Quản trị viên` demo lấy từ `DEMO_ADMIN_USERNAME` và `DEMO_ADMIN_PASSWORD` trong `.env`.
- Các tài khoản test được seed bằng `npm run seed`:
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

- `/`: home page and product menu.
- `/cart`: shopping cart.
- `/checkout`: checkout, allowed for `customer`.
- `/success`: order success page.
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

#### `POST /api/products`

Tạo món ăn.

Body:

```json
{
  "name": "Burger",
  "desc": "Mô tả món ăn",
  "price": "65.000đ",
  "image": "/images/burger.png"
}
```

#### `DELETE /api/products`

Xóa món ăn theo `id`.

Body:

```json
{
  "id": "product_id"
}
```

### 8.3 Order APIs

#### `GET /api/orders`

Lấy danh sách đơn hàng.

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
  "items": [],
  "totalItems": 1,
  "totalPrice": 65000
}
```

#### `PUT /api/orders`

Cập nhật trạng thái đơn.

Body:

```json
{
  "id": "#HF1234",
  "status": "processing"
}
```

#### `DELETE /api/orders`

Xóa đơn hàng theo `id`.

### 8.4 Merchant Profile APIs

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

### 8.5 Proposal APIs

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

Nếu `status = accepted`, hệ thống tạo món mới trong `Product`.

### 8.6 Notification APIs

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

### 8.7 Upload API

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

Lưu món ăn.

### 9.4 `Order`

Lưu đơn hàng. Hiện `customer` và `items` đang là JSON để demo nhanh.

### 9.5 `Proposal`

Lưu đề xuất món mới từ người bán.

### 9.6 `Notification`

Lưu thông báo nội bộ cho dashboard.

## 10. Trạng thái tính năng hiện tại

### 10.1 Đã làm hoặc đã làm một phần

- RBAC demo với 4 role.
- Credential login, Gmail registration, demo social login.
- Password hashing bằng `scrypt`.
- Customer product menu, cart, checkout.
- Seller dashboard, merchant profile, order status update.
- Shipper protected dashboard placeholder.
- Admin dashboard, order/menu/proposal management.
- Prisma schema for current demo models.

### 10.2 Chưa làm

Chi tiết theo SRS nằm trong:

```text
docs/SRS_TODO.md
```

Các phần lớn còn thiếu:

- Voucher và phí giao hàng.
- Shipper workflow thật.
- Order tracking cho khách hàng.
- Review/rating.
- Sentiment analysis.
- API authorization server-side.
- JWT/cookie auth thay cho `localStorage`.
- Realtime WebSocket/SSE.

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

- `npm run lint` toàn repo có thể fail do một số lỗi legacy ở page cũ với rule `react-hooks/set-state-in-effect`.
- Auth hiện vẫn lưu session demo ở `localStorage`; SRS yêu cầu JWT/cookie và RBAC server-side.
- `npx prisma db push` cần DB reachable. Nếu DNS/host Aiven không resolve, cần kiểm tra network, host, port và SSL.
- Social login hiện là demo endpoint, chưa tích hợp OAuth thật.
- Một số UI còn dùng `<img>` nên ESLint có thể cảnh báo về tối ưu ảnh Next.js.
