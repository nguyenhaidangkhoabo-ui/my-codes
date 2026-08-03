Báo cáo Phân tích Quyết định Kiến trúc & Cấu trúc Thư mụcDự án: hvn-khkt-task-002 (API Quản lý Thông tin Cá nhân)Tác giả: Đội ngũ Phát triển BackendMục tiêu: Xây dựng hệ thống RESTful API chuẩn hóa, tuân thủ nguyên lý SRP (Single Responsibility Principle) và mô hình Layered Architecture / MVC.I. TỔNG QUAN VỀ KIẾN TRÚC VÀ NGUYÊN LÝ THIẾT KẾ1. Nguyên lý Đơn trách nhiệm (Single Responsibility Principle - SRP)Nguyên lý SRP quy định: "Một module hay lớp chỉ nên có một và chỉ một lý do để thay đổi."Trong ứng dụng Backend Node.js / Express.js, việc dồn toàn bộ logic vào file server.js hoặc đưa xử lý dữ liệu vào Controller sẽ gây ra các vấn đề nghiêm trọng:Khó kiểm thử độc lập (Unit Test).Khó nâng cấp (ví dụ: chuyển từ mảng Memory sang database MongoDB/PostgreSQL).Trùng lặp code và gây phụ thuộc lẫn nhau (Tightly Coupled).2. Mô hình Kiến trúc Phân tầng (Layered Architecture)Hệ thống được chia thành 4 tầng riêng biệt, luồng dữ liệu chỉ đi theo một chiều từ ngoài vào trong và ngược lại:[ HTTP Request ] 
       │
       ▼
┌──────────────┐     Nhận request, định tuyến URL
│ Route Layer  │ ────────┐
└──────────────┘         │
       │                 │
       ▼                 │
┌──────────────┐         │ Chuyển giao params/body
│ Controller   │ <───────┘ 
└──────────────┘
       │
       ▼                 
┌──────────────┐         Gọi nghiệp vụ, xử lý logic & validate
│ Service Layer│
└──────────────┘
       │
       ▼                 
┌──────────────┐         Truy xuất / Thao tác với bộ nhớ dữ liệu
│ Database Layer│
└──────────────┘
II. PHÂN TÍCH CHI TIẾT CẤU TRÚC THƯ MỤC (FOLDER STRUCTURE)1. Cấu trúc tổng thểC:\Users\Admin\Desktop\trueproject\ (tên dự án: hvn-khkt-task-002)
├── .gitignore
├── backend\
│   ├── package.json
│   └── src\
│       ├── server.js
│       ├── database\profile.database.js
│       ├── services\profile.service.js
│       ├── controllers\profile.controller.js
│       ├── routes\profile.route.js
│       └── middlewares\error.middleware.js
└── frontend\
    ├── index.html
    └── script.js
2. Nhiệm vụ và Ranh giới Trách nhiệm (Boundaries) từng tầngThư mục / FileTầng (Layer)Trách nhiệm chính (Single Responsibility)Những điều KHÔNG làm tại tầng nàysrc/routes/RouteKhai báo đường dẫn URL, khớp HTTP Method (GET, POST, PUT, PATCH, DELETE) với hàm điều hướng tương ứng.Không chứa logic xử lý request, không trả về JSON response.src/controllers/ControllerNhận req (query, params, body), gọi tầng Service xử lý, nhận kết quả và trả về res đúng HTTP Status Code & Format JSON.Không tính toán thuật toán, không validate chi tiết nghiệp vụ, không thao tác trực tiếp mảng dữ liệu.src/services/ServiceThực hiện các quy tắc nghiệp vụ (Business Rules): validate tuổi, kiểm tra trùng email/phone, lọc dữ liệu, sắp xếp.Không phụ thuộc vào Express req hay res, không biết dữ liệu trả về client qua REST API hay GraphQL.src/database/DatabaseLưu trữ và thực hiện thao tác thô (CRUD) trên dữ liệu (mảng profiles).Không kiểm tra quy tắc nghiệp vụ (ví dụ: không kiểm tra tuổi hợp lệ hay email trùng).src/server.jsEntry PointKhởi tạo ứng dụng Express, tích hợp các Global Middleware (cors, express.json), lắng nghe cổng PORT.Không chứa định tuyến API chi tiết.III. MA TRẬN QUYẾT ĐỊNH KIẾN TRÚC (ARCHITECTURAL DECISION RECORDS - ADR)Quyết định 1: Chuẩn hóa Response Entity & HTTP Status CodeBối cảnh: Frontend hoặc bên thứ 3 tích hợp API cần một định dạng phản hồi đồng nhất để xử lý giao diện dễ dàng.Quyết định:Thành công: { "success": true, "message": "...", "data": ... }Thất bại: { "success": false, "message": "..." }Tuân thủ chính xác status code: 200 OK, 201 Created, 204 No Content (không body), 400 Bad Request, 404 Not Found, 500 Server Error.Ưu điểm: Tăng tính nhất quán, Frontend chỉ cần kiểm tra res.ok hoặc data.success để render giao diện.Quyết định 2: Tách biệt Nghiệp vụ khỏi Controller vào Service LayerBối cảnh: Các xử lý như kiểm tra năm sinh (1900 - hiện tại), tính tuổi (currentYear - birthYear), lọc theo giới tính/tên cần nơi xử lý tập trung.Quyết định: Đưa toàn bộ vào profile.service.js. Controller chỉ đóng vai trò "Trạm chuyển tiếp".Lợi ích: Khi viết Unit Test, ta có thể test toàn bộ logic của profileService mà không cần giả lập (mock) Express req/res.Quyết định 3: Sử dụng ES Modules (import/export) và Async/AwaitBối cảnh: Node.js hiện đại ưu tiên chuẩn ES Module thay vì CommonJS (require).Quyết định: Khai báo "type": "module" trong package.json. Tất cả hàm xử lý dữ liệu đều trả về Promise (async/await).Lợi ích: Sẵn sàng cho việc thay thế mảng In-Memory bằng Database thực tế (Async I/O) mà không phải sửa lại chữ ký hàm (function signature) ở Controller.IV. PHÂN TÍCH LUỒNG DỮ LIỆU (DATA FLOW ANALYSIS)Ví dụ với Yêu cầu: Tạo một Profile mới (POST /profiles)1. CLIENT (Postman/Fetch) ───[ POST /profiles + Body JSON ]───> Express Router
                                                                    │
2. Route (profile.route.js) ──────[ Điều hướng đến ]─────────> Controller
                                                                    │
3. Controller (profile.controller.js) ──[ Bóc tách req.body ]─> Service
                                                                    │
4. Service (profile.service.js):                                    │
   - Validate thông tin bắt buộc                                    │
   - Validate tuổi (1900 -> 2026)                                  │
   - Trích xuất DB kiểm tra trùng Email/Phone                       │
   - Nếu vi phạm ───> throw Error(400, "Thông báo lỗi")            │
   - Nếu hợp lệ ───[ Gọi hàm tạo mới ]─────────────────────────> Database
                                                                    │
5. Database (profile.database.js) ──[ Push vào mảng & gán ID ]─> Service
                                                                    │
6. Controller ◄───[ Trả về Object đã tạo ]──────────────────────── Service
   │
   └───[ res.status(201).json({ success: true, message: ..., data }) ]───> CLIENT
V. ĐỊNH HƯỚNG NÂNG CẤP & MỞ RỘNG (SCALABILITY ROADMAP)Khi dự án phát triển lên quy mô sản xuất (Production), cấu trúc SRP hiện tại cho phép mở rộng cực kỳ dễ dàng:Thay thế In-Memory bằng Database thật (MongoDB / PostgreSQL):Chỉ cần sửa: src/database/profile.database.js (hoặc đổi thành Repository Layer).Không cần sửa: Controller và Route giữ nguyên 100%.Bổ sung Middleware Validation (Zod / Joi):Tạo thư mục src/middlewares/ và đặt file validate.middleware.js trước Controller trong Route.Quản lý Lỗi Tập trung (Global Error Handler):Chuyển việc bắt catch(error) trong Controller về cho một Custom Error Middleware xử lý tự động.