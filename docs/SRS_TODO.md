# HustFood SRS TODO List

## 1. Nguon doi chieu

### 1.1 Tai lieu SRS

- File doi chieu: `/home/hoang/Downloads/Nhom 8.pdf`.
- Ten du an trong SRS: He thong Dat va Giao do an truc tuyen HustFood.
- Ngay bien soan SRS: 06/05/2026.
- SRS chia he thong thanh 4 vai tro: `Khach hang`, `Nguoi ban`, `Nguoi giao hang`, `Quan tri vien`.
- SRS liet ke 12 yeu cau chuc nang: FR-01 den FR-12.

### 1.2 Trang thai code hien tai

- Branch dang lam: `feature-srs-missing-modules`.
- Cac module da co code chinh:
  - Trang chu, thuc don, gio hang, checkout, success.
  - Login/register demo qua database.
  - Phan quyen client-side theo role.
  - Dashboard `Nguoi ban`, `Nguoi giao hang`, `Quan tri vien`.
  - API san pham, don hang, thong bao, de xuat mon, upload, ho so cua hang, auth.
  - Prisma schema cho `User`, `MerchantProfile`, `Product`, `Order`, `Proposal`, `Notification`.

## 2. Chu thich trang thai

### 2.1 Ky hieu

- `[x]` Da lam.
- `[~]` Da lam mot phan, can bo sung.
- `[ ]` Chua lam.

### 2.2 Muc uu tien

- `P0`: can co de demo dung luong SRS co ban.
- `P1`: can co de khop SRS day du.
- `P2`: cai tien sau demo.

## 3. Tong quan theo module SRS

### 3.1 FR-01: Dang nhap va phan quyen RBAC

#### 3.1.1 Da lam

- [x] Them bang `User` trong Prisma.
- [x] Doi ten role hien thi:
  - `customer` -> `Khach hang`
  - `seller` -> `Nguoi ban`
  - `shipper` -> `Nguoi giao hang`
  - `admin` -> `Quan tri vien`
- [x] Them API dang nhap bang username/Gmail va mat khau: `/api/auth/login`.
- [x] Them API tao tai khoan Gmail: `/api/auth/register`.
- [x] Them API social login demo: `/api/auth/social`.
- [x] Hash mat khau bang `scrypt` + salt rieng.
- [x] Them seed tai khoan test `Quan tri vien`: `huyhoangdao` / `1`.
- [x] Guard route client-side cho `/checkout`, `/seller`, `/shipper`, `/admin`.

#### 3.1.2 Chua lam

- [ ] P0: Chay `npx prisma db push` va `npm run seed` tren DB that khi host Aiven resolve duoc.
- [ ] P1: Doi session tu `localStorage` sang cookie/JWT server-side theo dung SRS.
- [ ] P1: Khoa tai khoan va thong bao "lien he ho tro" khi account bi block.
- [ ] P1: Bao ve API theo role, khong chi bao ve UI.
- [ ] P2: OAuth that cho Google/Facebook/Instagram thay vi social login mo phong.

### 3.2 FR-02: Khoi tao va thiet lap ho so cua hang

#### 3.2.1 Da lam

- [x] Them model `MerchantProfile`.
- [x] Them API `/api/merchant-profile` voi `GET` va `PUT`.
- [x] Them form ho so cua hang trong dashboard `Nguoi ban`.
- [x] Ho so co ten quan, dia chi, toa do ban do, gio mo/dong cua, so dien thoai, anh dai dien, trang thai.
- [x] Validate so dien thoai Viet Nam o API.

#### 3.2.2 Chua lam

- [ ] P0: Push schema len DB that de tao bang `MerchantProfile`.
- [ ] P1: Gan ho so cua hang theo user `Nguoi ban` that, khong dung singleton `ownerRole = seller`.
- [ ] P1: Upload anh dai dien bang file that thay vi nhap URL.
- [ ] P1: Hien thi cua hang tren trang tim kiem/duyet cua `Khach hang`.
- [ ] P2: Duyet/khoa cua hang tu `Quan tri vien`.

### 3.3 FR-03: Bien soan, cap nhat thuc don va tuy chon mon

#### 3.3.1 Da lam

- [x] Co model `Product`.
- [x] Co API `/api/products` de lay, tao, xoa mon.
- [x] Co trang `Quan tri vien` quan ly thuc don.
- [x] `Nguoi ban` co form de xuat mon moi, `Quan tri vien` duyet de tao san pham.

#### 3.3.2 Chua lam

- [ ] P0: Cho `Nguoi ban` quan ly thuc don cua chinh cua hang theo SRS.
- [ ] P1: Them sua mon, khong chi them/xoa.
- [ ] P1: Them danh muc mon `MenuCategory`.
- [ ] P1: Them tuy chon mon: topping, kich co, cay/ngot, ghi chu rieng.
- [ ] P1: Them trang thai `Con hang` / `Het hang`.
- [ ] P1: Chan xoa mon dang nam trong don cho xu ly, chi cho an hoac het hang.
- [ ] P2: Upload anh mon bang file that va toi uu anh.

### 3.4 FR-04: Tim kiem quan an va loc ket qua

#### 3.4.1 Da lam

- [~] Trang chu hien thi danh sach mon tu database.
- [~] Co CTA toi khu vuc menu.

#### 3.4.2 Chua lam

- [ ] P0: Them thanh tim kiem mon/quan.
- [ ] P1: Loc theo gia.
- [ ] P1: Loc theo khoang cach GPS.
- [ ] P1: Loc theo diem danh gia.
- [ ] P1: Trang chi tiet cua hang va menu theo cua hang.
- [ ] P2: Goi y mon thinh hanh khi khong co ket qua.

### 3.5 FR-05: Gio hang, tinh tien tu dong va khuyen mai

#### 3.5.1 Da lam

- [x] Co `CartContext`.
- [x] Gio hang luu bang `localStorage`.
- [x] Them/xoa/cap nhat so luong mon.
- [x] Tinh tong so luong va tong tien mon.

#### 3.5.2 Chua lam

- [ ] P0: Them phi giao hang theo km hoac rule demo.
- [ ] P0: Them voucher/ma giam gia.
- [ ] P1: Validate dieu kien voucher: gia tri toi thieu, han su dung, so lan dung.
- [ ] P1: Tach don khi them mon tu 2 cua hang khac nhau.
- [ ] P1: Topping/tuy chon mon va ghi chu theo tung item.
- [ ] P2: Luu gio hang server-side cho user da dang nhap.

### 3.6 FR-06: Thanh toan da hinh thuc va chot don

#### 3.6.1 Da lam

- [x] Co trang checkout cho `Khach hang`.
- [x] Validate so dien thoai.
- [x] Co hinh thuc COD, MoMo demo, the/card demo.
- [x] Co modal QR mo phong cho thanh toan online.
- [x] Co API tao don `/api/orders`.
- [x] Co trang success sau khi dat don.

#### 3.6.2 Chua lam

- [ ] P0: Luu `paymentMethod`, `paymentStatus`, `deliveryFee`, `discount`, `finalTotal` vao DB.
- [ ] P1: Tich hop cong thanh toan that hoac mock co trang thai ro rang.
- [ ] P1: Checksum/signature verification cho ket qua thanh toan.
- [ ] P1: Trang thai `Cho thanh toan lai` khi thanh toan fail.
- [ ] P1: Tao notification realtime cho `Nguoi ban` khi co don moi.

### 3.7 FR-07: Nguoi ban tiep nhan va chuyen trang thai don

#### 3.7.1 Da lam

- [x] Dashboard `Nguoi ban` doc danh sach don.
- [x] Cap nhat trang thai `pending` -> `processing` -> `completed`.
- [x] Co polling 5 giay de lam moi du lieu.
- [x] Co thong bao de xuat mon moi.

#### 3.7.2 Chua lam

- [ ] P0: Doi workflow status theo SRS: `Da nhan don`, `Dang chuan bi`, `Cho giao hang`, `Dang giao`, `Hoan thanh`, `Tu choi`.
- [ ] P1: Pop-up/chuong am thanh khi co don moi.
- [ ] P1: Nut `Tu choi don` kem ly do.
- [ ] P1: Broadcast don cho `Nguoi giao hang` gan khu vuc.
- [ ] P1: Tach don theo cua hang cua tung `Nguoi ban`.

### 3.8 FR-08: Nguoi giao hang nhan don va cap nhat giao hang

#### 3.8.1 Da lam

- [x] Co role `Nguoi giao hang`.
- [x] Co route guard `/shipper`.
- [x] Co dashboard placeholder cho `Nguoi giao hang`.
- [x] Co khung luong giao hang du kien.

#### 3.8.2 Chua lam

- [ ] P0: Hien thi don cho giao gan khu vuc.
- [ ] P0: Nut nhan don.
- [ ] P0: Cap nhat trang thai `Da lay hang`, `Dang giao`, `Hoan thanh`.
- [ ] P1: Luu shipper duoc gan vao don.
- [ ] P1: Ghi nhan COD va doanh thu chuyen di cho `Nguoi giao hang`.
- [ ] P1: Bao cao su co khach khong nghe may.
- [ ] P2: GPS/live location mobile-friendly.

### 3.9 FR-09: Theo doi tien do don hang thoi gian thuc

#### 3.9.1 Da lam

- [~] Co trang success sau khi dat don.
- [~] Co status don trong DB.
- [~] Admin/Nguoi ban co the xem status.

#### 3.9.2 Chua lam

- [ ] P0: Trang chi tiet/theo doi don cho `Khach hang`.
- [ ] P0: Progress bar theo trang thai don.
- [ ] P1: Cap nhat realtime bang WebSocket/SSE.
- [ ] P1: Ban do vi tri `Nguoi giao hang`.
- [ ] P1: ETA du kien.
- [ ] P2: Hien thi vi tri cap nhat cuoi cung khi mat GPS.

### 3.10 FR-10: Danh gia sao, binh luan va tai anh

#### 3.10.1 Da lam

- [ ] Chua co module danh gia.

#### 3.10.2 Chua lam

- [ ] P0: Them model `Review`.
- [ ] P0: Form danh gia sau khi don `completed`.
- [ ] P0: Cham sao mon an va `Nguoi giao hang`.
- [ ] P1: Binh luan text.
- [ ] P1: Upload anh review.
- [ ] P1: Hien thi review tren cua hang/mon.
- [ ] P1: Loc tu ngu tho tuc va an review vi pham.

### 3.11 FR-11: AI phan tich cam xuc phan hoi

#### 3.11.1 Da lam

- [ ] Chua co module AI sentiment.

#### 3.11.2 Chua lam

- [ ] P0: Them sentiment mock theo rule de demo: positive/neutral/negative.
- [ ] P1: Luu sentiment vao DB theo review.
- [ ] P1: Canh bao review tieu cuc 1 sao tren dashboard `Quan tri vien` va `Nguoi ban`.
- [ ] P2: Hang doi xu ly review.
- [ ] P2: Tich hop model NLP/AI that.

### 3.12 FR-12: Dashboard thong ke tai chinh

#### 3.12.1 Da lam

- [x] `Nguoi ban` co dashboard doanh thu hoan thanh.
- [x] `Nguoi ban` co dem don cho, dang giao, hoan thanh.
- [x] `Nguoi ban` co top san pham ban chay.
- [x] `Quan tri vien` co dashboard tong quan don, san pham, de xuat mon.

#### 3.12.2 Chua lam

- [ ] P1: Bo loc thoi gian: hom nay, tuan nay, thang nay.
- [ ] P1: Doanh thu theo tung cua hang.
- [ ] P1: Thong ke don huy/tu choi.
- [ ] P1: Bieu do truc quan.
- [ ] P1: Bao cao ty le sentiment.
- [ ] P2: Export CSV/PDF.

## 4. Checklist GUI theo vai tro

### 4.1 Khach hang

#### 4.1.1 Da lam

- [x] Trang chu va menu san pham.
- [x] Product card.
- [x] Gio hang.
- [x] Checkout.
- [x] Success page.
- [x] Dang nhap/dang ky.

#### 4.1.2 Chua lam

- [ ] P0: Trang tim kiem/loc.
- [ ] P0: Trang theo doi don.
- [ ] P0: Trang danh gia sau don.
- [ ] P1: Trang chi tiet cua hang.
- [ ] P1: UI voucher va phi giao hang.

### 4.2 Nguoi ban

#### 4.2.1 Da lam

- [x] Dashboard protected.
- [x] Ho so cua hang.
- [x] Danh sach don hang.
- [x] Cap nhat trang thai don co ban.
- [x] De xuat mon moi.
- [x] Thong ke doanh thu co ban.

#### 4.2.2 Chua lam

- [ ] P0: Quan ly menu rieng cua cua hang.
- [ ] P0: UI nhan/tu choi don day du.
- [ ] P1: Pop-up don moi.
- [ ] P1: Dashboard sentiment.
- [ ] P1: Bieu do doanh thu.

### 4.3 Nguoi giao hang

#### 4.3.1 Da lam

- [x] Route `/shipper`.
- [x] Guard role `shipper`.
- [x] Dashboard placeholder.

#### 4.3.2 Chua lam

- [ ] P0: Danh sach don co the nhan.
- [ ] P0: Man hinh chi tiet lo trinh.
- [ ] P0: Nut cap nhat trang thai giao hang.
- [ ] P1: UI COD/doi soat.
- [ ] P1: UI bao cao su co.

### 4.4 Quan tri vien

#### 4.4.1 Da lam

- [x] Route `/admin`.
- [x] Guard role `admin`.
- [x] Dashboard tong quan.
- [x] Quan ly don.
- [x] Quan ly thuc don.
- [x] Duyet de xuat mon.

#### 4.4.2 Chua lam

- [ ] P0: Quan ly user/RBAC.
- [ ] P1: Quan ly/khoa tai khoan.
- [ ] P1: Duyet/khoa cua hang.
- [ ] P1: Dashboard review sentiment.
- [ ] P2: Quan ly khieu nai va hoan tien.

## 5. Checklist API va database

### 5.1 Da lam

- [x] `User`.
- [x] `MerchantProfile`.
- [x] `Product`.
- [x] `Order`.
- [x] `Proposal`.
- [x] `Notification`.
- [x] API auth: login/register/social.
- [x] API merchant profile.
- [x] API products.
- [x] API orders.
- [x] API proposals.
- [x] API notifications.
- [x] API upload.

### 5.2 Chua lam

- [ ] P0: Push schema len DB that va seed admin test.
- [ ] P0: `Voucher`.
- [ ] P0: `Review`.
- [ ] P0: Them truong payment/delivery vao `Order`.
- [ ] P1: `Shop`/`MerchantProfile` lien ket voi `User`.
- [ ] P1: `ShipperAssignment` hoac truong `shipperId` trong `Order`.
- [ ] P1: `Transaction`/`Payment`.
- [ ] P1: `MenuCategory`.
- [ ] P1: `MenuOption`/`Topping`.
- [ ] P1: `SentimentAnalysis`.
- [ ] P1: API authorization theo role.

## 6. Checklist phi chuc nang

### 6.1 Hieu nang

- [~] Co render Next.js va API route co ban.
- [ ] P1: Do/kiem tra response time duoi 1.5s cho menu va duoi 3s cho giao dich.
- [ ] P1: Load test gio cao diem 11h-13h, 18h-20h.
- [ ] P1: Realtime latency duoi 1 giay cho thong bao don moi.

### 6.2 Bao mat

- [x] Mat khau hash bang `scrypt` + salt.
- [~] RBAC co tren UI/route guard client-side.
- [ ] P0: Bao ve API theo role.
- [ ] P1: JWT/cookie httpOnly thay cho localStorage.
- [ ] P1: HTTPS/TLS tren moi truong deploy.
- [ ] P1: Signature/checksum cho thanh toan online.
- [ ] P1: Rate limit login/register.

### 6.3 Kha dung va tin cay

- [x] Gio hang luu localStorage.
- [~] UI responsive co ban.
- [ ] P1: Sao luu DB hang ngay.
- [ ] P1: Error state/loading state day du cho tung form.
- [ ] P1: Test khi mat mang/DB fail.

### 6.4 Mo rong va bao tri

- [~] API dang tach theo route/module.
- [~] Prisma schema da co cac model cot loi.
- [ ] P1: Tach service/helper cho order, payment, delivery, review.
- [ ] P1: Them test case unit/integration.
- [ ] P1: CI lint/build.
- [ ] P2: Chuan hoa status enum thay vi string tu do.

## 7. Thu tu update de nghi tiep theo

### 7.1 P0 nen lam truoc

1. Push schema DB va seed admin test khi ket noi Aiven dung.
2. Voucher + phi giao hang + payment fields trong `Order`.
3. Shipper workflow: nhan don, da lay hang, dang giao, hoan thanh.
4. Order tracking cho `Khach hang`.
5. Review + sentiment mock.
6. API authorization theo role.

### 7.2 P1 sau khi demo P0 on dinh

1. Tim kiem/loc quan an va mon.
2. Quan ly menu theo cua hang cua `Nguoi ban`.
3. Realtime bang WebSocket/SSE.
4. Dashboard bieu do va loc thoi gian.
5. OAuth that va JWT/cookie.

