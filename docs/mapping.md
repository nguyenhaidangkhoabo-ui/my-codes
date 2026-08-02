# Mapping — Index & Description

Mô tả ngắn theo cấu trúc của project `hvn-khkt-task-002` (RESTful API Quản lý Thông tin Cá nhân — Express.js) để LLM nhanh chóng định vị đúng tài liệu và mã nguồn cần thiết.

## 1. Điểm vào tài liệu (Docs)

| File | Nội dung |
|------|----------|
| `docs/main.md` | Quyết định kiến trúc (ADR), mô hình Layered Architecture 4 tầng, nguyên lý SRP, chuẩn Response Entity & HTTP Status Code. |
| `docs/phase.md` | Định nghĩa 5 giai đoạn lập trình (Coding Phases): đầu vào, nhiệm vụ, sản phẩm bàn giao, tiêu chí hoàn thành (theo Rubric 100đ). |
| `docs/task.md` | Danh sách tác vụ triển khai (công việc cụ thể theo Phase). |
| `docs/mapping.md` | File này — bản đồ rút gọn giúp định vị nhanh tài liệu, tầng code và API. |

## 2. Kiến trúc (4 tầng SRP)

Luồng dữ liệu một chiều: `Route → Controller → Service → Database`.

| Tầng (thư mục) | File | Trách nhiệm | KHÔNG làm |
|----------------|------|-------------|-----------|
| `src/routes/` | `profile.route.js` | Định tuyến URL + khớp HTTP Method với handler Controller. | Chứa logic, trả JSON. |
| `src/controllers/` | `profile.controller.js` | Bóc tách `req`, gọi Service, trả `res` đúng status & format. | Tính toán, validate nghiệp vụ, thao tác dữ liệu. |
| `src/services/` | `profile.service.js` | Business Rules: validate tuổi (1900–nay), check trùng email/phone, lọc, sắp xếp. | Phụ thuộc `req`/`res`. |
| `src/database/` | `profile.database.js` | CRUD thô trên mảng In-Memory `profiles`. | Check quy tắc nghiệp vụ. |
| Entry Point | `src/server.js` | Khởi tạo Express, middleware (cors, express.json), serve `public/`, `GET /ping`. | Định tuyến chi tiết. |
| Frontend | `public/index.html`, `public/script.js` | Giao diện + `fetch()` không reload trang. | — |

## 3. API cốt lõi (base: `/profiles`)

| Method | Path | Mô tả | Service handler |
|--------|------|-------|-----------------|
| GET | `/profiles` | Danh sách + lọc `search`(tên), `gender`, sắp xếp `sortBirthYear`(asc/desc); tự tính `age`. | `getAllProfiles(queryParams)` |
| GET | `/profiles/:id` | Lấy 1 profile. | `getById(id)` |
| POST | `/profiles` | Tạo mới (validate bắt buộc, năm sinh, trùng email/phone). | `createProfile(data)` |
| PUT | `/profiles/:id` | Cập nhật — Strict PUT: yêu cầu đủ 5 trường `fullName, birthYear, gender, email, phone`. | `update(id, data)` |
| PATCH | `/profiles/:id` | Cập nhật một phần. | `patch(id, data)` |
| DELETE | `/profiles/:id` | Xóa → trả 204 No Content (không body). | `delete(id)` |

Database helper: `findByEmailOrPhone(email, phone, excludeId)` dùng để kiểm tra trùng lặp khi create/update.

## 4. Quy chuẩn phản hồi (Response Entity)

- Thành công: `{ "success": true, "message": "...", "data": ... }`
- Thất bại: `{ "success": false, "message": "..." }`
- Status: `200 OK`, `201 Created`, `204 No Content` (không body), `400 Bad Request`, `404 Not Found`, `500 Server Error`.
- Service dùng **Result Object Pattern**: `{ isSuccess: true, data }` hoặc `{ isSuccess: false, statusCode, message }`.
- Lỗi tập trung qua middleware 4 tham số `(err, req, res, next)` — `src/middlewares/error.middleware.js`.

## 5. Bản đồ giai đoạn (Phase → Deliverables)

| Phase | Giai đoạn | Sản phẩm bàn giao |
|-------|-----------|-------------------|
| 1 | Setup Khung & Server Base | `.gitignore`, `package.json`, `src/server.js`, khung thư mục |
| 2 | Database & Service Layer | `src/database/*`, `src/services/*` |
| 3 | Controller & Route Layer | `src/controllers/*`, `src/routes/*` |
| 4 | Frontend & Tích hợp API | `public/index.html`, `public/script.js` |
| 5 | Global Error Handling & Refactor | `src/middlewares/error.middleware.js`, hoàn thiện 100% Rubric |

## 6. Chú ý lập trình

- ES Modules (`"type": "module"`), dependencies: `express`, `cors`.
- Deps không phụ thuộc Express trong tầng Service & Database.
- Quy tắc rating Rock: CRUD đầy đủ (30đ), đúng HTTP Method (20đ), đúng Status Code (15đ), Response nhất quán (10đ), CORS (5đ), 4 tầng SRP (15đ), frontend fetch không reload (5đ), `.gitignore`/Git chuẩn (5đ).