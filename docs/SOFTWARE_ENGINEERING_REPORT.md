# Báo cáo phương pháp xây dựng phần mềm và biểu đồ thiết kế - HustFood

Tài liệu này tổng hợp nội dung phục vụ báo cáo môn Nhập môn Công nghệ Phần mềm cho hệ thống HustFood. Các biểu đồ được viết bằng Mermaid để có thể render trực tiếp trên GitHub, VS Code hoặc Mermaid Live Editor.

## 1. Tổng quan dự án

HustFood là ứng dụng đặt và giao đồ ăn trực tuyến được xây dựng bằng Next.js App Router, React, Prisma và MySQL. Hệ thống mô phỏng các luồng nghiệp vụ chính:

- Khách hàng tìm cửa hàng, đặt món, thanh toán, theo dõi đơn và đánh giá.
- Người bán quản lý hồ sơ cửa hàng, thực đơn, đơn hàng, doanh thu và đề xuất món.
- Người giao hàng nhận đơn, cập nhật trạng thái giao hàng và vị trí.
- Quản trị viên quản lý người dùng, cửa hàng, thực đơn, đơn hàng, hoàn tiền và duyệt nội dung.

## 2. Phương pháp xây dựng phần mềm đã sử dụng

### 2.1 Lựa chọn phương pháp

Phương pháp phù hợp với dự án là **Agile theo mô hình Scrum/Kanban nhẹ**.

Lý do không chọn Waterfall thuần túy:

- Yêu cầu thay đổi liên tục trong quá trình phát triển: đăng ký tài khoản, OAuth, JWT, quản lý store, shipper, rating, deploy Vercel, Prisma/Aiven.
- Cần có bản chạy được sớm để kiểm thử trực tiếp trên giao diện và cơ sở dữ liệu thật.
- Các chức năng có thể chia thành các increment độc lập: Auth, Cart, Order, Seller, Shipper, Admin, Review, Payment, Security.
- Mỗi lần hoàn thành một phần đều build, test, push và deploy để phát hiện lỗi sớm.

### 2.2 Cách áp dụng Agile trong dự án

Dự án được triển khai theo các vòng lặp ngắn. Mỗi vòng lặp gồm:

1. Phân tích yêu cầu nhỏ từ SRS/TODO.
2. Tạo branch riêng cho nhóm chức năng lớn.
3. Thiết kế nhanh luồng dữ liệu, API và giao diện.
4. Cài đặt chức năng.
5. Kiểm thử bằng lint, unit test, build production và test thủ công.
6. Commit, push, merge vào `main`.
7. Deploy lên Vercel và sửa lỗi runtime nếu có.

### 2.3 So sánh với các mô hình khác

| Tiêu chí | Waterfall | Agile Scrum/Kanban | Lựa chọn cho HustFood |
| --- | --- | --- | --- |
| Thay đổi yêu cầu | Khó xử lý | Xử lý tốt | Agile |
| Cần bản demo sớm | Không tối ưu | Rất phù hợp | Agile |
| Dự án sinh viên, deadline ngắn | Rủi ro nếu làm tuyến tính | Chia nhỏ để giao hàng nhanh | Agile |
| Kiểm thử liên tục | Thường ở cuối dự án | Sau mỗi increment | Agile |
| Deploy thật lên Vercel | Không phải trọng tâm | Phù hợp CI/CD nhẹ | Agile |

### 2.4 Method Diagram - Quy trình Agile đã áp dụng

```mermaid
flowchart LR
    A[Product Backlog / SRS_TODO] --> B[Chọn chức năng cho sprint ngắn]
    B --> C[Phân tích yêu cầu]
    C --> D[Thiết kế API, UI, Database]
    D --> E[Tạo branch feature]
    E --> F[Cài đặt]
    F --> G[Lint, Unit Test, Build]
    G --> H{Đạt yêu cầu?}
    H -- Chưa --> C
    H -- Rồi --> I[Commit và Push]
    I --> J[Merge vào main]
    J --> K[Deploy Vercel]
    K --> L[Test production]
    L --> M{Có lỗi runtime?}
    M -- Có --> C
    M -- Không --> N[Hoàn thành increment]
    N --> B
```

## 3. Tác nhân và Use Case

### 3.1 Danh sách tác nhân

| Tác nhân | Vai trò |
| --- | --- |
| Guest | Xem thực đơn, xem cửa hàng, đăng nhập, đăng ký |
| Customer | Đặt món, thanh toán, theo dõi đơn, đánh giá |
| Seller | Quản lý cửa hàng, thực đơn, đơn hàng, doanh thu |
| Shipper | Nhận đơn, cập nhật giao hàng, báo sự cố |
| Admin | Quản trị tài khoản, cửa hàng, thực đơn, đơn hàng, hoàn tiền |
| Google OAuth | Nhà cung cấp đăng nhập bên ngoài |
| Payment Provider | Mô phỏng thanh toán Momo/Card/COD |
| Database | Lưu trữ dữ liệu hệ thống |

### 3.2 Use-Case Diagram tổng quát

```mermaid
flowchart LR
    Guest((Guest))
    Customer((Customer))
    Seller((Seller))
    Shipper((Shipper))
    Admin((Admin))
    Google((Google OAuth))
    Payment((Payment Provider))

    UC1[Đăng ký tài khoản]
    UC2[Đăng nhập]
    UC3[Xem cửa hàng và món ăn]
    UC4[Tìm kiếm / lọc món]
    UC5[Thêm món vào giỏ]
    UC6[Đặt hàng]
    UC7[Thanh toán]
    UC8[Theo dõi đơn]
    UC9[Đánh giá đơn hàng]
    UC10[Quản lý hồ sơ cửa hàng]
    UC11[Quản lý thực đơn]
    UC12[Xử lý đơn hàng]
    UC13[Xem báo cáo doanh thu]
    UC14[Nhận đơn giao]
    UC15[Cập nhật vị trí / trạng thái giao]
    UC16[Quản lý người dùng]
    UC17[Duyệt cửa hàng]
    UC18[Duyệt đề xuất món]
    UC19[Quản lý hoàn tiền / khiếu nại]

    Guest --> UC1
    Guest --> UC2
    Guest --> UC3
    Guest --> UC4

    Customer --> UC3
    Customer --> UC4
    Customer --> UC5
    Customer --> UC6
    Customer --> UC7
    Customer --> UC8
    Customer --> UC9

    Seller --> UC10
    Seller --> UC11
    Seller --> UC12
    Seller --> UC13

    Shipper --> UC14
    Shipper --> UC15

    Admin --> UC16
    Admin --> UC17
    Admin --> UC18
    Admin --> UC19

    UC2 --> Google
    UC7 --> Payment
```

### 3.3 Use Case chi tiết - Đặt hàng

| Mục | Nội dung |
| --- | --- |
| Tên use case | Đặt món ăn |
| Tác nhân chính | Customer |
| Tiền điều kiện | Customer đã đăng nhập, giỏ hàng có ít nhất một món |
| Hậu điều kiện | Đơn hàng được tạo, seller có thể xử lý |
| Luồng chính | Chọn món -> giỏ hàng -> nhập thông tin giao hàng -> chọn thanh toán -> tạo đơn |
| Luồng ngoại lệ | Món hết hàng, thanh toán online thất bại, voucher không hợp lệ |

## 4. Activity Diagram

### 4.1 Activity Diagram - Luồng đặt món của khách hàng

```mermaid
flowchart TD
    A([Bắt đầu]) --> B[Xem danh sách cửa hàng/món ăn]
    B --> C[Tìm kiếm hoặc lọc theo giá, khoảng cách, đánh giá]
    C --> D[Chọn món]
    D --> E[Chọn tùy chọn: size, topping, vị, ghi chú]
    E --> F[Thêm vào giỏ hàng]
    F --> G{Tiếp tục mua?}
    G -- Có --> B
    G -- Không --> H[Mở giỏ hàng]
    H --> I[Kiểm tra tổng tiền, phí giao hàng, voucher]
    I --> J[Nhập thông tin giao hàng]
    J --> K[Chọn phương thức thanh toán]
    K --> L{Thanh toán online?}
    L -- Có --> M[Xử lý thanh toán mock]
    M --> N{Thành công?}
    N -- Không --> O[Tạo đơn payment_retry]
    N -- Có --> P[Tạo đơn pending]
    L -- Không --> P
    O --> Q[Chờ khách thanh toán lại hoặc hủy]
    P --> R[Seller nhận thông báo đơn mới]
    R --> S([Kết thúc])
```

### 4.2 Activity Diagram - Xử lý đơn hàng

```mermaid
flowchart TD
    A([Đơn pending]) --> B[Seller xem đơn]
    B --> C{Chấp nhận đơn?}
    C -- Không --> D[Nhập lý do từ chối]
    D --> E[Đơn rejected]
    C -- Có --> F[Đơn accepted]
    F --> G[Chuẩn bị món]
    G --> H[Đánh dấu ready_for_pickup]
    H --> I[Shipper nhận đơn]
    I --> J[Shipper picked_up]
    J --> K[Shipper delivering]
    K --> L{Giao thành công?}
    L -- Có --> M[Đơn completed]
    L -- Không --> N[Báo sự cố]
    N --> O[Admin xử lý khiếu nại/hoàn tiền]
    M --> P[Khách đánh giá]
    E --> Q([Kết thúc])
    O --> Q
    P --> Q
```

## 5. Sequence Diagram

### 5.1 Sequence Diagram - Đăng nhập và JWT session

```mermaid
sequenceDiagram
    actor User
    participant LoginPage as Login Page
    participant AuthAPI as /api/auth/login
    participant AdminAuth as Admin Account
    participant Prisma as Prisma/MySQL
    participant JWT as JWT Helper
    participant Browser as Browser Cookie

    User->>LoginPage: Nhập username/email và mật khẩu
    LoginPage->>AuthAPI: POST credentials
    AuthAPI->>AdminAuth: Kiểm tra ADMIN_ACCOUNT nếu có
    alt Là admin cấu hình
        AdminAuth->>Prisma: Tạo/cập nhật admin user
        Prisma-->>AdminAuth: Admin user
    else User thường
        AuthAPI->>Prisma: Tìm User theo email/username
        Prisma-->>AuthAPI: User + password hash
        AuthAPI->>AuthAPI: Verify password
    end
    AuthAPI->>JWT: Tạo JWT session HS256
    JWT-->>AuthAPI: Token
    AuthAPI->>Browser: Set httpOnly cookie hustfood_session
    AuthAPI-->>LoginPage: Trả về user đã sanitize
    LoginPage->>User: Điều hướng theo role
```

### 5.2 Sequence Diagram - Đặt hàng

```mermaid
sequenceDiagram
    actor Customer
    participant UI as Web UI
    participant Cart as Cart Context
    participant OrderAPI as /api/orders
    participant VoucherAPI as /api/vouchers/validate
    participant Payment as Payment Mock
    participant DB as MySQL
    participant Seller as Seller Dashboard

    Customer->>UI: Chọn món và tùy chọn
    UI->>Cart: addToCart(product, options)
    Customer->>UI: Checkout
    UI->>VoucherAPI: Kiểm tra voucher nếu có
    VoucherAPI-->>UI: Discount hợp lệ/không hợp lệ
    UI->>Payment: Tạo payment mock nếu Momo/Card
    Payment-->>UI: paymentState
    UI->>OrderAPI: POST thông tin khách, items, voucher, payment
    OrderAPI->>DB: Lấy sản phẩm, tạo Order, PaymentTransaction
    DB-->>OrderAPI: Đơn hàng đã tạo
    OrderAPI-->>UI: Danh sách đơn
    UI->>Customer: Hiện trang success
    Seller->>OrderAPI: Poll /api/orders
    OrderAPI-->>Seller: Đơn pending mới
```

### 5.3 Sequence Diagram - Seller cập nhật hồ sơ cửa hàng

```mermaid
sequenceDiagram
    actor Seller
    participant SellerPage as Seller Page
    participant UploadAPI as /api/upload
    participant ProfileAPI as /api/merchant-profile
    participant Auth as requireRole
    participant DB as MySQL

    Seller->>SellerPage: Sửa tên quán, địa chỉ, giờ mở cửa, ảnh
    opt Có ảnh mới
        SellerPage->>UploadAPI: POST file
        UploadAPI-->>SellerPage: URL ảnh
    end
    SellerPage->>ProfileAPI: PUT profile payload
    ProfileAPI->>Auth: Kiểm tra role seller
    Auth-->>ProfileAPI: Seller hợp lệ
    ProfileAPI->>ProfileAPI: Validate phone, image, status
    ProfileAPI->>DB: Upsert MerchantProfile
    DB-->>ProfileAPI: Profile mới
    ProfileAPI-->>SellerPage: Profile đã lưu
    SellerPage->>Seller: Hiện thông báo thành công
```

## 6. State Diagram

### 6.1 State Diagram - Trạng thái đơn hàng

```mermaid
stateDiagram-v2
    [*] --> pending
    [*] --> payment_retry: Thanh toán online thất bại
    payment_retry --> pending: Thanh toán lại thành công
    payment_retry --> rejected: Khách/Admin hủy
    pending --> accepted: Seller chấp nhận
    pending --> rejected: Seller từ chối
    accepted --> preparing
    preparing --> ready_for_pickup
    ready_for_pickup --> picked_up: Shipper lấy hàng
    picked_up --> delivering
    delivering --> completed: Giao thành công
    delivering --> rejected: Sự cố giao hàng nghiêm trọng
    completed --> [*]
    rejected --> [*]
```

### 6.2 State Diagram - Trạng thái cửa hàng

```mermaid
stateDiagram-v2
    [*] --> pending_review: Seller tạo hồ sơ
    pending_review --> active: Admin duyệt
    pending_review --> blocked: Admin khóa
    active --> paused: Seller tạm dừng
    paused --> active: Seller mở lại
    active --> blocked: Admin khóa
    paused --> blocked: Admin khóa
    blocked --> pending_review: Admin mở xét duyệt
```

## 7. Class / Domain Model Diagram

```mermaid
classDiagram
    class User {
      +String id
      +String email
      +String username
      +String displayName
      +String role
      +String status
      +String provider
    }

    class MerchantProfile {
      +String id
      +String shopName
      +String address
      +String mapLocation
      +String openTime
      +String closeTime
      +String phone
      +Float rating
      +Int reviewCount
      +String status
    }

    class Product {
      +String id
      +String name
      +String desc
      +String price
      +String image
      +Json options
      +Boolean isAvailable
      +Boolean isHidden
    }

    class Order {
      +String id
      +String merchantId
      +Json customer
      +Json items
      +Int totalItems
      +Int totalPrice
      +Int deliveryFee
      +Int finalTotal
      +String paymentMethod
      +String paymentStatus
      +String status
    }

    class Review {
      +String id
      +Int foodRating
      +Int shipperRating
      +String comment
      +Json images
      +String status
    }

    class PaymentTransaction {
      +String id
      +String provider
      +String method
      +String status
      +Int amount
      +String type
    }

    class Voucher {
      +String id
      +String code
      +String discountType
      +Int discountValue
      +Boolean active
    }

    class Proposal {
      +String id
      +String name
      +String price
      +String status
    }

    User "1" --> "0..1" MerchantProfile : owns
    User "1" --> "0..*" Product : sells
    User "1" --> "0..*" Proposal : creates
    Product "1" --> "0..*" Review : receives
    Order "1" --> "0..*" PaymentTransaction : records
    Order "1" --> "0..*" Review : reviewed_by
    User "1" --> "0..*" Review : customer/merchant/shipper
```

## 8. ERD - Database Diagram

```mermaid
erDiagram
    USER ||--o| MERCHANT_PROFILE : owns
    USER ||--o{ PRODUCT : owns
    USER ||--o{ MENU_CATEGORY : owns
    USER ||--o| SAVED_CART : has
    USER ||--o{ PROPOSAL : creates
    USER ||--o{ REVIEW : writes_or_receives
    MENU_CATEGORY ||--o{ PRODUCT : contains
    PRODUCT ||--o{ REVIEW : receives
    ORDER ||--o{ REVIEW : has
    ORDER ||--o{ PAYMENT_TRANSACTION : has

    USER {
      string id PK
      string email UK
      string username UK
      string displayName
      string role
      string status
      string provider
      string providerAccountId
    }

    MERCHANT_PROFILE {
      string id PK
      string ownerId UK
      string shopName
      string address
      string mapLocation
      string phone
      float rating
      int reviewCount
      string status
    }

    PRODUCT {
      string id PK
      string ownerId FK
      string categoryId FK
      string name
      string price
      boolean isAvailable
      boolean isHidden
    }

    ORDER {
      string id PK
      string customerId
      string merchantId
      json customer
      json items
      int totalPrice
      int finalTotal
      string paymentStatus
      string status
      string shipperId
    }

    PAYMENT_TRANSACTION {
      string id PK
      string orderId FK
      string method
      string status
      int amount
      string type
    }

    REVIEW {
      string id PK
      string orderId FK
      string customerId FK
      string merchantId FK
      string productId FK
      string shipperId FK
      int foodRating
      int shipperRating
      string status
    }
```

## 9. Component Diagram

```mermaid
flowchart LR
    subgraph Client[Client Browser]
        UI[Next.js React UI]
        AuthCtx[AuthContext]
        CartCtx[CartContext]
    end

    subgraph NextApp[Next.js App Router]
        Pages[App Pages]
        AuthAPI[Auth APIs]
        OrderAPI[Order APIs]
        ProductAPI[Product APIs]
        AdminAPI[Admin APIs]
        UploadAPI[Upload API]
        ReviewAPI[Review API]
    end

    subgraph ServerLib[Server Libraries]
        JWT[JWT Session Helper]
        RBAC[Role Guard requireRole]
        Pricing[Pricing/Voucher Helpers]
        Payments[Payment Mock Helpers]
        PrismaClient[Prisma Client]
    end

    subgraph External[External Services]
        Google[Google OAuth]
        Vercel[Vercel Hosting]
        Aiven[Aiven MySQL]
    end

    UI --> AuthCtx
    UI --> CartCtx
    UI --> Pages
    Pages --> AuthAPI
    Pages --> OrderAPI
    Pages --> ProductAPI
    Pages --> AdminAPI
    Pages --> ReviewAPI
    Pages --> UploadAPI

    AuthAPI --> JWT
    AuthAPI --> RBAC
    OrderAPI --> RBAC
    ProductAPI --> RBAC
    AdminAPI --> RBAC
    ReviewAPI --> RBAC

    OrderAPI --> Pricing
    OrderAPI --> Payments
    AuthAPI --> Google

    RBAC --> JWT
    AuthAPI --> PrismaClient
    OrderAPI --> PrismaClient
    ProductAPI --> PrismaClient
    AdminAPI --> PrismaClient
    ReviewAPI --> PrismaClient
    PrismaClient --> Aiven
    Vercel --> NextApp
```

## 10. Deployment Diagram

```mermaid
flowchart TD
    Dev[Máy lập trình viên] --> GitHub[GitHub Repository]
    GitHub --> Vercel[Vercel Production Deployment]
    Vercel --> Browser[Trình duyệt người dùng]
    Vercel --> Aiven[Aiven MySQL Database]
    Vercel --> Google[Google OAuth]

    subgraph VercelEnv[Vercel Environment Variables]
        ENV1[DATABASE_URL]
        ENV2[AUTH_SECRET]
        ENV3[ADMIN_ACCOUNT / ADMIN_PASSWORD]
        ENV4[GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET]
        ENV5[NEXTAUTH_URL]
    end

    Vercel --> VercelEnv
```

## 11. Data Flow Diagram mức 0

```mermaid
flowchart LR
    Customer[Customer] -->|Đặt món / Thanh toán| System[HustFood System]
    Seller[Seller] -->|Quản lý menu / Xử lý đơn| System
    Shipper[Shipper] -->|Nhận và cập nhật giao hàng| System
    Admin[Admin] -->|Quản trị và duyệt nội dung| System
    Google[Google OAuth] -->|Thông tin đăng nhập| System
    Payment[Payment Mock] -->|Trạng thái thanh toán| System
    System -->|Đọc/Ghi dữ liệu| DB[(MySQL Database)]
    System -->|Thông báo đơn / trạng thái| Customer
    System -->|Đơn mới / Báo cáo| Seller
    System -->|Đơn sẵn sàng giao| Shipper
    System -->|Báo cáo / Cảnh báo| Admin
```

## 12. Kiến trúc bảo mật

```mermaid
flowchart TD
    A[User login/register] --> B[Validate input]
    B --> C{Provider}
    C -- Credentials --> D[Verify password hash/salt]
    C -- Google --> E[OAuth code flow + CSRF state]
    D --> F[Sanitize user]
    E --> F
    F --> G[Create JWT HS256]
    G --> H[Set httpOnly cookie]
    H --> I[Client calls protected API]
    I --> J[requireRole reads cookie]
    J --> K[Verify JWT signature, exp, iss, aud, tokenType]
    K --> L{Role allowed?}
    L -- Yes --> M[Execute API]
    L -- No --> N[401/403]
```

## 13. Bảng yêu cầu chức năng chính

| Mã | Chức năng | Tác nhân | Mức độ |
| --- | --- | --- | --- |
| FR-01 | Đăng ký/đăng nhập bằng credentials và Google OAuth | Guest | Cao |
| FR-02 | Phân quyền customer/seller/shipper/admin | Tất cả | Cao |
| FR-03 | Xem, tìm kiếm, lọc cửa hàng và món ăn | Guest, Customer | Cao |
| FR-04 | Quản lý giỏ hàng và voucher | Customer | Cao |
| FR-05 | Tạo đơn và thanh toán COD/Momo/Card mock | Customer | Cao |
| FR-06 | Seller xử lý đơn và xem báo cáo | Seller | Cao |
| FR-07 | Shipper nhận đơn, cập nhật vị trí/trạng thái | Shipper | Cao |
| FR-08 | Admin quản lý người dùng/cửa hàng/menu/đơn | Admin | Cao |
| FR-09 | Đánh giá đơn hàng và tính rating cửa hàng | Customer | Trung bình |
| FR-10 | Backup, deploy, cấu hình database | Admin/Dev | Trung bình |

## 14. Bảng yêu cầu phi chức năng

| Nhóm | Yêu cầu |
| --- | --- |
| Bảo mật | JWT ký bằng `AUTH_SECRET`, cookie httpOnly, role guard cho API |
| Khả dụng | Deploy trên Vercel, database managed MySQL |
| Bảo trì | Tách helper: pricing, auth, reviews, statuses, financialDashboard |
| Kiểm thử | Có lint, unit test helper và build production trước khi merge |
| Hiệu năng | Dùng Next.js App Router, Prisma query có include/select theo nhu cầu |
| Tin cậy | API trả lỗi rõ ràng, UI tránh crash khi response không đúng dạng |

## 15. Kế hoạch kiểm thử

| Nhóm test | Nội dung |
| --- | --- |
| Unit test | Pricing, payment checksum, JWT verify, review moderation, status helpers |
| Integration manual | Đăng nhập, đăng ký, Google OAuth, tạo đơn, seller xử lý đơn, shipper giao hàng |
| UI manual | Home, cart, checkout, seller dashboard, shipper dashboard, admin dashboard |
| Database test | `npx prisma validate`, `npx prisma db push`, seed data |
| Production test | Build Vercel, kiểm tra env, test các route chính sau deploy |

## 16. Kết luận

Dự án HustFood phù hợp với Agile vì quá trình phát triển cần lặp nhanh, kiểm thử liên tục và sửa lỗi sau deploy. Bộ biểu đồ trên mô tả các khía cạnh chính của một hệ thống phần mềm: tác nhân, use case, activity, sequence, state, domain model, ERD, component, deployment và data flow.

Nội dung này có thể dùng làm khung cho bài báo cáo Nhập môn Công nghệ Phần mềm, sau đó bổ sung ảnh chụp giao diện, phân công thành viên, timeline và kết quả kiểm thử thực tế.
