# Trực quan hóa: Báo cáo Phân tích Quyết định Kiến trúc & Cấu trúc Thư mục

> Dự án: **hvn-khkt-task-002** (API Quản lý Thông tin Cá nhân)
> Mục tiêu: Hệ thống RESTful API chuẩn hóa, tuân thủ SRP và mô hình Layered Architecture / MVC.

---

## 1. Kiến trúc phân tầng (Layered Architecture)

Hệ thống chia thành 4 tầng riêng biệt, luồng dữ liệu đi một chiều từ ngoài vào trong.

```mermaid
flowchart TD
    accTitle: Kiến trúc phân tầng 4 lớp
    accDescr: Luồng dữ liệu một chiều từ HTTP Request qua Route, Controller, Service đến Database

    HTTP["HTTP Request"] --> Route["Route Layer<br/>Nhận request, định tuyến URL"]
    Route --> Controller["Controller Layer<br/>Nhận req, gọi Service, trả res"]
    Controller --> Service["Service Layer<br/>Xử lý nghiệp vụ & validate"]
    Service --> DB["Database Layer<br/>CRUD trên dữ liệu"]
```

---

## 2. Cấu trúc thư mục (Folder Structure)

```mermaid
flowchart TD
    accTitle: Cấu trúc thư mục dự án
    accDescr: Sơ đồ cây thư mục của dự án hvn-khkt-task-002 gồm public và src với các tầng database, services, controllers, routes

    Root["hvn-khkt-task-002"] --> Git[".gitignore"]
    Root --> Pkg["package.json"]
    Root --> Public["public/"]
    Root --> Src["src/"]

    Public --> Index["index.html"]
    Public --> Script["script.js"]

    Src --> Server["server.js"]
    Src --> DB["database/"]
    Src --> Services["services/"]
    Src --> Controllers["controllers/"]
    Src --> Routes["routes/"]

    DB --> ProfileDB["profile.database.js"]
    Services --> ProfileService["profile.service.js"]
    Controllers --> ProfileController["profile.controller.js"]
    Routes --> ProfileRoute["profile.route.js"]
```

---

## 3. Ranh giới trách nhiệm từng tầng (Boundaries)

```mermaid
flowchart LR
    accTitle: Ranh giới trách nhiệm từng tầng
    accDescr: Phân chia trách nhiệm chính và những điều không làm của Route, Controller, Service, Database và server.js

    Route["Route<br/>Định tuyến URL + HTTP Method"] --> Controller["Controller<br/>Nhận req, gọi Service, trả res"]
    Controller --> Service["Service<br/>Business Rules & validate"]
    Service --> DB["Database<br/>CRUD thô trên dữ liệu"]
    Server["server.js<br/>Entry Point, middleware, PORT"]
```

---

## 4. Luồng dữ liệu: Tạo Profile mới (POST /profiles)

```mermaid
sequenceDiagram
    accTitle: Luồng dữ liệu POST /profiles
    accDescr: Trình tự tương tác từ Client qua Route, Controller, Service đến Database khi tạo profile mới

    participant Client as CLIENT
    participant Route as Route
    participant Controller as Controller
    participant Service as Service
    participant DB as Database

    Client->>Route: POST /profiles + Body JSON
    Route->>Controller: Điều hướng request
    Controller->>Service: Bóc tách req.body
    Service->>Service: Validate thông tin bắt buộc
    Service->>Service: Validate tuổi (1900 - 2026)
    Service->>DB: Kiểm tra trùng Email/Phone

    alt Vi phạm
        Service-->>Controller: throw Error(400)
        Controller-->>Client: res.status(400) success:false
    else Hợp lệ
        Service->>DB: Gọi hàm tạo mới
        DB-->>Service: Push vào mảng & gán ID
        Service-->>Controller: Trả về Object đã tạo
        Controller-->>Client: res.status(201) success:true, data
    end
```

---

## 5. Ma trận quyết định kiến trúc (ADR)

```mermaid
flowchart TD
    accTitle: Ma trận quyết định kiến trúc
    accDescr: Ba quyết định kiến trúc gồm chuẩn hóa response, tách nghiệp vụ vào Service và sử dụng ES Modules

    ADR1["Quyết định 1<br/>Chuẩn hóa Response Entity & HTTP Status Code"]
    ADR2["Quyết định 2<br/>Tách nghiệp vụ khỏi Controller vào Service"]
    ADR3["Quyết định 3<br/>Sử dụng ES Modules & Async/Await"]

    ADR1 --> R1["success:true/false + status code chuẩn"]
    ADR2 --> R2["profile.service.js xử lý business rules"]
    ADR3 --> R3["type: module + Promise async/await"]
```

---

## 6. Định hướng nâng cấp & mở rộng (Scalability Roadmap)

```mermaid
flowchart TD
    accTitle: Định hướng nâng cấp và mở rộng
    accDescr: Các bước mở rộng gồm thay database thật, thêm middleware validation và quản lý lỗi tập trung

    Current["Cấu trúc SRP hiện tại"] --> DBUpgrade["Thay In-Memory bằng MongoDB/PostgreSQL<br/>Chỉ sửa database layer"]
    Current --> Middleware["Bổ sung Middleware Validation (Zod/Joi)<br/>Tạo src/middlewares/"]
    Current --> ErrorHandler["Quản lý Lỗi Tập trung<br/>Custom Error Middleware"]

    DBUpgrade --> Keep["Controller & Route giữ nguyên 100%"]
```