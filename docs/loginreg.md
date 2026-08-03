# 📘 HƯỚNG DẪN TÍCH HỢP LOGIN / REGISTER / TRANG PROFILE — XÁC THỰC BẰNG JWT

> **Dự án áp dụng:** `hvn-khkt-task-002` (Node.js + Express 5.2.1, ES Modules, kiến trúc 4 tầng SRP, frontend HTML thuần + Vanilla JS)
> **Mục đích tài liệu:** hướng dẫn từng bước cách tích hợp hệ thống đăng ký (register), đăng nhập (login), trang hồ sơ cá nhân (profile) với cơ chế xác thực bằng **JWT token**. Chỉ những người đã đăng nhập (có JWT hợp lệ) mới truy cập được trang profile, và danh tính được định danh thông qua JWT.
> **Phạm vi:** thêm khối auth MỚI, KHÔNG phá vỡ chức năng `/profiles` hiện có.

---

## MỤC LỤC

1. [Tổng quan & Kiến trúc](#1-tổng-quan--kiến-trúc)
2. [Sơ đồ luồng hoạt động](#2-sơ-đồ-luồng-hoạt-động)
3. [Bước 1 — Cài đặt dependencies](#3-bước-1--cài-đặt-dependencies)
4. [Bước 2 — Cấu hình biến môi trường (.env)](#4-bước-2--cấu-hình-biến-môi-trường-env)
5. [Bước 3 — Tầng Database: user.database.js](#5-bước-3--tầng-database-userdatabasejs)
6. [Bước 4 — Tầng Service: auth.service.js](#6-bước-4--tầng-service-authservicejs)
7. [Bước 5 — Middleware xác thực: authenticate.middleware.js](#7-bước-5--middleware-xác-thực-authenticatemiddlewarejs)
8. [Bước 6 — Tầng Controller: auth.controller.js](#8-bước-6--tầng-controller-authcontrollerjs)
9. [Bước 7 — Tầng Route: auth.route.js](#9-bước-7--tầng-route-authroutejs)
10. [Bước 8 — Cập nhật server.js](#10-bước-8--cập-nhật-serverjs)
11. [Bước 9 — Frontend: auth.js (helper dùng chung)](#11-bước-9--frontend-authjs-helper-dùng-chung)
12. [Bước 10 — Frontend: login.html](#12-bước-10--frontend-loginhtml)
13. [Bước 11 — Frontend: register.html](#13-bước-11--frontend-registerhtml)
14. [Bước 12 — Frontend: profile.html](#14-bước-12--frontend-profilehtml)
15. [Bước 13 — (Tùy chọn) Bảo vệ toàn bộ API /profiles](#15-bước-13--tùy-chọn-bảo-vệ-toàn-bộ-api-profiles)
16. [Kiểm thử toàn bộ luồng](#16-kiểm-thử-toàn-bộ-luồng)
17. [Các lưu ý bảo mật](#17-các-lưu-ý-bảo-mật)
18. [Lỗi thường gặp & cách xử lý](#18-lỗi-thường-gặp--cách-xử-lý)
19. [✅ Checklist hoàn thành](#19--checklist-hoàn-thành)

---

## 1. Tổng quan & Kiến trúc

### 1.1 Hiện trạng dự án (đã xác minh)

| Hạng mục | Hiện trạng |
|---|---|
| Framework | Express `^5.2.1`, `"type": "module"` (ESM) |
| Kiến trúc | 4 tầng SRP: `routes/` → `controllers/` → `services/` → `database/` |
| Database | **In-Memory array** — chỉ có entity `Profile { id, fullName, birthYear, gender, email, phone }` |
| Auth hiện có | ❌ **Không có** — chưa có User model, chưa có JWT, chưa có hash password |
| Frontend | `frontend/index.html` + `frontend/script.js` (Vanilla JS, serve bởi chính Express) |
| Response chuẩn | `{ success: true, message, data }` / `{ success: false, message }` |
| Service pattern | Result Object `{ isSuccess, data \| statusCode, message }` |
| `.gitignore` | Đã chặn `node_modules/`, `.env`, `logs/` ✅ |

### 1.2 Kiến trúc mục tiêu (thêm mới, không phá vỡ khối cũ)

```
HTTP Request
   │
   ▼
┌──────────────────────────────┐
│  Route Layer                 │  routes/auth.route.js
│  routes/profile.route.js (cũ)│
└──────────────┬───────────────┘
               ▼
┌──────────────────────────────┐
│  Middleware Layer            │  middlewares/authenticate.middleware.js  ← MỚI
│  middlewares/error.middleware.js (cũ)                                    (bảo vệ route)
└──────────────┬───────────────┘
               ▼
┌──────────────────────────────┐
│  Controller Layer            │  controllers/auth.controller.js  ← MỚI
│  controllers/profile.controller.js (cũ)│
└──────────────┬───────────────┘
               ▼
┌──────────────────────────────┐
│  Service Layer               │  services/auth.service.js  ← MỚI
│  services/profile.service.js (cũ)│  (không biết req/res)
└──────────────┬───────────────┘
               ▼
┌──────────────────────────────┐
│  Database Layer              │  database/user.database.js  ← MỚI
│  database/profile.database.js (cũ)│
└──────────────────────────────┘
```

### 1.3 Cấu trúc file sau khi tích hợp

```
C:\Users\Admin\Desktop\trueproject\
├── .gitignore
├── backend\
│   ├── package.json                      (SỬA: thêm dependencies)
│   ├── .env                              (MỚI: JWT_SECRET, PORT — KHÔNG commit)
│   └── src\
│       ├── server.js                     (SỬA: mount /api/auth, nạp dotenv)
│       ├── database\
│       │   ├── profile.database.js       (giữ nguyên)
│       │   └── user.database.js          (MỚI)
│       ├── services\
│       │   ├── profile.service.js        (giữ nguyên)
│       │   └── auth.service.js           (MỚI)
│       ├── controllers\
│       │   ├── profile.controller.js     (giữ nguyên)
│       │   └── auth.controller.js        (MỚI)
│       ├── routes\
│       │   ├── profile.route.js          (giữ nguyên)
│       │   └── auth.route.js             (MỚI)
│       └── middlewares\
│           ├── error.middleware.js       (giữ nguyên)
│           └── authenticate.middleware.js (MỚI)
└── frontend\
    ├── index.html                        (giữ nguyên)
    ├── script.js                         (giữ nguyên)
    ├── login.html                        (MỚI)
    ├── register.html                     (MỚI)
    ├── profile.html                      (MỚI)
    └── auth.js                           (MỚI — helper dùng chung)
```

### 1.4 Quyết định thiết kế (decision log)

| # | Vấn đề | Quyết định | Lý do |
|---|---|---|---|
| 1 | Thư viện hash password | **`bcryptjs`** (không dùng `bcrypt`) | Thuần JS, không cần `node-gyp` biên dịch → cài trơn tru trên Windows |
| 2 | Thư viện JWT | **`jsonwebtoken`** | Chuẩn ngành, API ổn định, hỗ trợ `expiresIn`, tự sinh `iat`/`exp` |
| 3 | Biến môi trường | **`dotenv`** | Đọc `JWT_SECRET` từ `backend/.env`, không phụ thuộc version Node |
| 4 | Lưu token ở đâu | **`localStorage`** (trình duyệt) + header `Authorization: Bearer` | Đơn giản, không cần cookie-parser/CSRF; ghi chú nhược điểm XSS cho production |
| 5 | Entity User | **Tách riêng** khỏi Profile: `{ id, email, passwordHash, fullName, createdAt }` | SRP (danh tính vs dữ liệu nghiệp vụ) + bảo mật `passwordHash` |
| 6 | Thời hạn token | **`1h`** | Cân bằng an toàn & trải nghiệm demo; nên đặt thành hằng số để dễ chỉnh |
| 7 | Bảo vệ API /profiles cũ | **Giữ public** (Phương án B) | Không phá vỡ frontend/test cũ; nếu cần bảo vệ → làm Phase 2 (mục 15) |
| 8 | Endpoint lấy thông tin user | **`GET /api/auth/me`** | Thuộc quyền sở hữu auth domain, không làm ô nhiễm profile routes |
| 9 | Đăng ký xong trả token? | **Có** (auto-login) | UX tốt: đăng ký xong vào thẳng trang profile |
| 10 | Trùng email khi register | **409 Conflict** | Phân biệt ngữ nghĩa với 400 validation |

---

## 2. Sơ đồ luồng hoạt động

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant F as Frontend (auth.js)
    participant B as Backend (Express)
    participant M as authenticate.middleware
    participant S as auth.service

    Note over U,F: REGISTER
    U->>F: Nhập fullName, email, password
    F->>B: POST /api/auth/register
    B->>S: register({email, password, fullName})
    S->>S: Validate + bcrypt.hash(password, 10)
    S->>S: Lưu user, phát JWT
    B-->>F: 201 { success, data: { token, user } }
    F->>F: localStorage.setItem('token', token)
    F->>U: Chuyển hướng profile.html

    Note over U,F: LOGIN
    U->>F: Nhập email, password
    F->>B: POST /api/auth/login
    B->>S: login({email, password})
    S->>S: findByEmail + bcrypt.compare
    S->>S: Phát JWT (payload: sub, email; exp: 1h)
    B-->>F: 200 { success, data: { token, user } }
    F->>F: localStorage.setItem('token', token)
    F->>U: Chuyển hướng profile.html

    Note over U,F: TRUY CẬP PROFILE (yêu cầu JWT)
    U->>F: Mở profile.html
    F->>F: requireAuth(): kiểm tra token tồn tại
    F->>B: GET /api/auth/me (Authorization: Bearer <token>)
    B->>M: authenticateJWT: jwt.verify(token, JWT_SECRET)
    M-->>B: req.user = { id, email } (hoặc 401)
    B->>S: getMe(req.user.id)
    B-->>F: 200 { success, data: { id, email, fullName, createdAt } }
    F->>U: Hiển thị thông tin profile
```

---

## 3. Bước 1 — Cài đặt dependencies

Chạy lệnh sau **trong thư mục `backend/`** (phải `cd` vào `backend` trước):

```bash
cd C:\Users\Admin\Desktop\trueproject\backend
npm install jsonwebtoken bcryptjs dotenv
```

**Kết quả mong đợi:** `backend/package.json` sẽ có thêm:

```json
"dependencies": {
  "express": "^5.2.1",
  "cors": "^2.8.5",
  "jsonwebtoken": "^9.0.2",
  "bcryptjs": "^2.4.3",
  "dotenv": "^16.4.5"
}
```

> ⚠️ **Tại sao dùng `bcryptjs` thay vì `bcrypt`?**
> `bcrypt` là native C++ addon, khi `npm install` trên Windows phải biên dịch bằng `node-gyp` — rất dễ lỗi nếu máy thiếu Visual Studio Build Tools / Python. `bcryptjs` thuần JavaScript, cài đặt 100% thành công, API giống hệt (`hash`, `compare`). Hiệu năng thấp hơn chút nhưng không đáng kể với dự án học tập.

> ⚠️ **Cần `cookie-parser` không?** Không. Chúng ta lưu token ở `localStorage` và gửi qua header `Authorization`. `cors()` hiện có đủ vì frontend được serve cùng origin bởi chính Express.

---

## 4. Bước 2 — Cấu hình biến môi trường (.env)

### 4.1 Tạo file `backend/.env` (MỚI)

```
PORT=3000
JWT_SECRET=thay_bang_chuoi_ngau_nhien_it_nhat_32_ky_tu
```

### 4.2 Sinh secret ngẫu nhiên (chạy trong `backend/`)

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy kết quả dán vào `JWT_SECRET=`.

### 4.3 Quy tắc quan trọng

- ✅ `.env` đã được `.gitignore` chặn → **không bao giờ commit** file này.
- ✅ Không hardcode secret trong code.
- ✅ Không log token/secret ra console.
- ⚠️ Đổi `JWT_SECRET` ⇒ **toàn bộ token cũ hết hạn** (mọi phiên đăng nhập bị mất) — ghi nhớ khi thay đổi.
- ⚠️ Trong production: nếu thiếu `JWT_SECRET`, phải throw lỗi và thoát app, **không dùng** secret mặc định.

---

## 5. Bước 3 — Tầng Database: user.database.js

Tạo mới: **`backend/src/database/user.database.js`**

```js
// Tầng Database: chỉ CRUD thô trên mảng In-Memory, KHÔNG chứa nghiệp vụ.
// Nguyên tắc giống profile.database.js: không validate, không hash, không biết req/res.

let users = [];
let nextId = 1;

export const userDb = {
  async getAll() {
    return [...users];
  },

  async getById(id) {
    return users.find((u) => u.id === id) || null;
  },

  // Tìm user theo email (email đã được chuẩn hóa lowercase ở tầng Service)
  async findByEmail(email) {
    return users.find((u) => u.email === email) || null;
  },

  async create(data) {
    const newUser = { id: nextId++, ...data };
    users.push(newUser);
    return newUser;
  },

  async delete(id) {
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) return false;
    users.splice(index, 1);
    return true;
  }
};
```

> 💡 **Giải thích:** mảng `users` khởi tạo rỗng (không có user mẫu) — user đầu tiên sẽ tự đăng ký. Nếu muốn có user mẫu để test nhanh, có thể seed 1 bản ghi với `passwordHash` đã hash sẵn (xem mục 18).

---

## 6. Bước 4 — Tầng Service: auth.service.js

Tạo mới: **`backend/src/services/auth.service.js`**

```js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userDb } from '../database/user.database.js';

// Result Object Pattern (giống profile.service.js)
const ok = (data) => ({ isSuccess: true, data });
const fail = (statusCode, message) => ({ isSuccess: false, statusCode, message });

// Hằng số cấu hình — dễ chỉnh sửa
const SALT_ROUNDS = 10;
const TOKEN_EXPIRES_IN = '1h';
// Secret: ưu tiên từ .env; fallback chỉ dành cho dev (đổi ngay khi lên production)
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

// Hàm dọn user trước khi trả ra ngoài: TUYỆT ĐỐI không lộ passwordHash
const toSafeUser = (user) => ({
  id: user.id,
  email: user.email,
  fullName: user.fullName,
  createdAt: user.createdAt
});

// Hàm phát JWT — dùng chung cho register và login
const signToken = (user) =>
  jwt.sign(
    { sub: user.id, email: user.email }, // payload: sub = id user
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRES_IN }
  );

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const authService = {
  // ── ĐĂNG KÝ ─────────────────────────────────────────────
  async register({ email, password, fullName }) {
    // 1. Validate email
    if (!email || !EMAIL_REGEX.test(String(email).trim())) {
      return fail(400, 'Email không hợp lệ');
    }
    // 2. Validate password
    if (!password || String(password).length < 6) {
      return fail(400, 'Mật khẩu phải có ít nhất 6 ký tự');
    }
    // 3. Validate fullName
    if (!fullName || !String(fullName).trim()) {
      return fail(400, 'Thiếu trường bắt buộc: fullName');
    }

    // 4. Chuẩn hóa email
    const normalizedEmail = String(email).trim().toLowerCase();

    // 5. Kiểm tra trùng email
    const existing = await userDb.findByEmail(normalizedEmail);
    if (existing) return fail(409, 'Email đã được đăng ký');

    // 6. Hash password
    const passwordHash = await bcrypt.hash(String(password), SALT_ROUNDS);

    // 7. Lưu user
    const user = await userDb.create({
      email: normalizedEmail,
      passwordHash,
      fullName: String(fullName).trim(),
      createdAt: new Date().toISOString()
    });

    // 8. Phát token (auto-login) và trả về user an toàn
    const token = signToken(user);
    return ok({ token, user: toSafeUser(user) });
  },

  // ── ĐĂNG NHẬP ────────────────────────────────────────────
  async login({ email, password }) {
    // Không validate format ở đây — chỉ cần tìm + so sánh
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const user = await userDb.findByEmail(normalizedEmail);

    // Thông điệp lỗi GIỐNG NHAU cho cả "email sai" và "mật khẩu sai"
    // để không lộ thông tin user có tồn tại hay không (chống user enumeration)
    if (!user) return fail(401, 'Email hoặc mật khẩu không đúng');

    const match = await bcrypt.compare(String(password || ''), user.passwordHash);
    if (!match) return fail(401, 'Email hoặc mật khẩu không đúng');

    const token = signToken(user);
    return ok({ token, user: toSafeUser(user) });
  },

  // ── LẤY THÔNG TIN USER HIỆN TẠI ─────────────────────────
  async getMe(userId) {
    const user = await userDb.getById(userId);
    if (!user) return fail(404, 'Không tìm thấy user');
    return ok(toSafeUser(user));
  }
};
```

> 💡 **Điểm mấu chốt:**
> - `bcrypt.hash(password, 10)` — cost factor 10 (mặc định, đủ an toàn).
> - `signToken` payload: `{ sub: user.id, email: user.email }` — **không** đưa `passwordHash` (đương nhiên), **không** đưa `fullName` (tránh data lỗi thời khi user đổi tên).
> - `toSafeUser` — single source of truth cho danh sách field an toàn.
> - Message lỗi login giống nhau cho cả 2 trường hợp sai → chống kẻ tấn công dò email.

---

## 7. Bước 5 — Middleware xác thực: authenticate.middleware.js

Tạo mới: **`backend/src/middlewares/authenticate.middleware.js`**

```js
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

// Middleware xác thực JWT — bảo vệ các route yêu cầu đăng nhập.
// Đặt TRƯỚC handler cần bảo vệ (vd: router.get('/me', authenticateJWT, handler)).
export default function authenticateJWT(req, res, next) {
  // 1. Đọc header Authorization
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Thiếu token xác thực' });
  }

  // 2. Tách token (bỏ tiền tố "Bearer ")
  const token = header.slice(7).trim();

  // 3. Verify token
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.sub, email: decoded.email }; // gắn user vào request
    return next();
  } catch (err) {
    // Phân biệt lỗi hết hạn vs lỗi khác
    const message =
      err.name === 'TokenExpiredError' ? 'Token đã hết hạn' : 'Token không hợp lệ';
    return res.status(401).json({ success: false, message });
  }
}
```

> 💡 **Giải thích:**
> - `jwt.verify` là hàm **đồng bộ** → chủ động `try/catch` và trả `401` ngay, không để rơi vào global error handler (tránh trả `500`).
> - `req.user = { id: decoded.sub, email: decoded.email }` → các handler phía sau dùng `req.user.id`, `req.user.email`.
> - Express 5 (v5.2.1) **không có thay đổi nào ảnh hưởng** tới middleware dạng này — hoạt động y hệt Express 4.

---

## 8. Bước 6 — Tầng Controller: auth.controller.js

Tạo mới: **`backend/src/controllers/auth.controller.js`**

```js
import { authService } from '../services/auth.service.js';

export const authController = {
  // POST /api/auth/register
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);
      if (!result.isSuccess) {
        return res.status(result.statusCode).json({ success: false, message: result.message });
      }
      res.status(201).json({ success: true, message: 'Đăng ký thành công', data: result.data });
    } catch (err) { next(err); }
  },

  // POST /api/auth/login
  async login(req, res, next) {
    try {
      const result = await authService.login(req.body);
      if (!result.isSuccess) {
        return res.status(result.statusCode).json({ success: false, message: result.message });
      }
      res.status(200).json({ success: true, message: 'Đăng nhập thành công', data: result.data });
    } catch (err) { next(err); }
  },

  // GET /api/auth/me  (protected — cần token hợp lệ)
  async getMe(req, res, next) {
    try {
      const result = await authService.getMe(req.user.id);
      if (!result.isSuccess) {
        return res.status(result.statusCode).json({ success: false, message: result.message });
      }
      res.status(200).json({ success: true, message: 'Lấy thông tin thành công', data: result.data });
    } catch (err) { next(err); }
  }
};
```

> 💡 **Giải thích:** Controller chỉ bóc tách `req`, gọi service, trả `res` theo Result Object — đúng chuẩn 4 tầng SRP. Lưu ý `getMe` dùng `req.user.id` (đã được middleware gắn vào).

---

## 9. Bước 7 — Tầng Route: auth.route.js

Tạo mới: **`backend/src/routes/auth.route.js`**

```js
import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import authenticateJWT from '../middlewares/authenticate.middleware.js';

const router = Router();

// Công khai (public)
router.post('/register', authController.register);
router.post('/login', authController.login);

// Bảo vệ (protected) — yêu cầu JWT hợp lệ
router.get('/me', authenticateJWT, authController.getMe);

export default router;
```

> 💡 **Giải thích:** Route `/me` được bảo vệ bằng `authenticateJWT` đặt ngay trước handler. Đây chính là cơ chế "chỉ truy cập nếu đã đăng nhập và định danh bằng JWT".

---

## 10. Bước 8 — Cập nhật server.js

Sửa file **`backend/src/server.js`** — thêm 3 thay đổi được đánh dấu `// 🔐`:

```js
import 'dotenv/config'; // 🔐 NẠP BIẾN MÔI TRƯỜNG TỪ .env — đặt ngay đầu file
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import profileRoutes from './routes/profile.route.js';
import authRoutes from './routes/auth.route.js'; // 🔐 IMPORT ROUTE AUTH
import errorHandler from './middlewares/error.middleware.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Lấy __dirname trong ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Global middleware
app.use(cors());
app.use(express.json());

// Serve frontend (nằm ngoài backend/)
app.use(express.static(path.join(__dirname, '../../frontend')));

// Endpoint test
app.get('/ping', (req, res) => {
  res.json({ success: true, message: 'pong' });
});

// Mount routes
app.use('/profiles', profileRoutes);        // giữ nguyên
app.use('/api/auth', authRoutes);           // 🔐 MOUNT ROUTE AUTH MỚI

// Global error handler (PHẢI đặt cuối cùng)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
```

> ⚠️ **Lưu ý:** `app.use('/api/auth', authRoutes)` phải đặt **trước** `app.use(errorHandler)` (đương nhiên đúng nếu đặt như trên).

---

## 11. Bước 9 — Frontend: auth.js (helper dùng chung)

Tạo mới: **`frontend/auth.js`** — helper dùng chung cho mọi trang: quản lý token, fetch wrapper, guard điều hướng.

```js
// ====== QUẢN LÝ TOKEN (localStorage) ======
const TOKEN_KEY = 'token';

const tokenStorage = {
  get() {
    return localStorage.getItem(TOKEN_KEY);
  },
  set(token) {
    localStorage.setItem(TOKEN_KEY, token);
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
  }
};

// ====== FETCH WRAPPER — tự gắn Authorization header ======
async function apiFetch(url, options = {}) {
  const token = tokenStorage.get();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, { ...options, headers });

  // Nếu token không hợp lệ/hết hạn: xóa token + chuyển về trang đăng nhập
  if (res.status === 401) {
    tokenStorage.clear();
    window.location.href = 'login.html';
    throw new Error('Phiên đăng nhập đã hết hạn');
  }
  return res;
}

// ====== GUARD — dùng ở đầu các trang YÊU CẦU đăng nhập ======
function requireAuth() {
  if (!tokenStorage.get()) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

// ====== GUARD cho trang login/register (đã đăng nhập rồi thì chuyển đi) ======
function redirectIfLoggedIn() {
  if (tokenStorage.get()) {
    window.location.href = 'profile.html';
    return true;
  }
  return false;
}

// ====== ĐĂNG XUẤT ======
function logout() {
  tokenStorage.clear();
  window.location.href = 'login.html';
}
```

> 💡 **Giải thích:** `auth.js` được viết dạng **classic script** (không dùng `export`) nên các hàm/biến như `tokenStorage`, `apiFetch`, `requireAuth`, `logout` trở thành biến **global** — mọi trang HTML nạp bằng `<script src="auth.js"></script>` đều dùng được trực tiếp. Đây là cách đơn giản nhất cho dự án frontend HTML thuần không dùng bundler.

> ✅ **Đã thống nhất:** cả `auth.js` và 3 trang HTML đều dùng classic script + biến global — không có xung đột ESM. Các `fetch` trong `login.html`/`register.html` dùng `fetch` trần (không qua `apiFetch`) là chủ ý vì chưa có token; `profile.html` gắn header `Authorization` thủ công và xử lý 401 riêng.

---

## 12. Bước 10 — Frontend: login.html

Tạo mới: **`frontend/login.html`**

```html
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Đăng nhập</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 400px; margin: 60px auto; text-align: center; }
    form { display: flex; flex-direction: column; gap: 12px; }
    input, button { padding: 10px; font-size: 16px; }
    .error { color: red; min-height: 20px; }
    a { color: #1a73e8; }
  </style>
</head>
<body>
  <h1>Đăng nhập</h1>

  <form id="login-form">
    <input type="email" id="email" placeholder="Email" required />
    <input type="password" id="password" placeholder="Mật khẩu" required />
    <button type="submit">Đăng nhập</button>
  </form>

  <p class="error" id="message"></p>
  <p>Chưa có tài khoản? <a href="register.html">Đăng ký ngay</a></p>

  <script src="auth.js"></script>
  <script>
    // Nếu đã đăng nhập thì chuyển thẳng vào trang profile
    if (tokenStorage.get()) {
      window.location.href = 'profile.html';
    }

    const form = document.getElementById('login-form');
    const messageEl = document.getElementById('message');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      messageEl.textContent = '';

      const payload = {
        email: document.getElementById('email').value.trim(),
        password: document.getElementById('password').value
      };

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (!res.ok) {
          messageEl.textContent = data.message || 'Đăng nhập thất bại';
          return;
        }

        // Lưu token rồi chuyển hướng
        tokenStorage.set(data.data.token);
        window.location.href = 'profile.html';
      } catch (err) {
        messageEl.textContent = 'Lỗi kết nối, vui lòng thử lại';
      }
    });
  </script>
</body>
</html>
```

> 💡 **Giải thích:** `auth.js` được load bằng `<script src="auth.js"></script>` (classic script) nên `tokenStorage` là biến **global** — trang `login.html` dùng trực tiếp được. Tuyệt đối **không** dùng `<script type="module">` để load `auth.js` vì khi đó các khai báo top-level không thành global, trang sẽ lỗi `ReferenceError`.

---

## 13. Bước 11 — Frontend: register.html

Tạo mới: **`frontend/register.html`**

```html
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Đăng ký</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 400px; margin: 60px auto; text-align: center; }
    form { display: flex; flex-direction: column; gap: 12px; }
    input, button { padding: 10px; font-size: 16px; }
    .error { color: red; min-height: 20px; }
    a { color: #1a73e8; }
  </style>
</head>
<body>
  <h1>Đăng ký tài khoản</h1>

  <form id="register-form">
    <input type="text" id="fullName" placeholder="Họ tên" required />
    <input type="email" id="email" placeholder="Email" required />
    <input type="password" id="password" placeholder="Mật khẩu (tối thiểu 6 ký tự)" minlength="6" required />
    <input type="password" id="confirmPassword" placeholder="Xác nhận mật khẩu" required />
    <button type="submit">Đăng ký</button>
  </form>

  <p class="error" id="message"></p>
  <p>Đã có tài khoản? <a href="login.html">Đăng nhập</a></p>

  <script src="auth.js"></script>
  <script>
    if (tokenStorage.get()) {
      window.location.href = 'profile.html';
    }

    const form = document.getElementById('register-form');
    const messageEl = document.getElementById('message');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      messageEl.textContent = '';

      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;

      // Validate client trước khi gửi
      if (password !== confirmPassword) {
        messageEl.textContent = 'Xác nhận mật khẩu không khớp';
        return;
      }

      const payload = {
        fullName: document.getElementById('fullName').value.trim(),
        email: document.getElementById('email').value.trim(),
        password
      };

      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (!res.ok) {
          messageEl.textContent = data.message || 'Đăng ký thất bại';
          return;
        }

        // Auto-login: lưu token rồi vào thẳng trang profile
        tokenStorage.set(data.data.token);
        window.location.href = 'profile.html';
      } catch (err) {
        messageEl.textContent = 'Lỗi kết nối, vui lòng thử lại';
      }
    });
  </script>
</body>
</html>
```

---

## 14. Bước 12 — Frontend: profile.html

Tạo mới: **`frontend/profile.html`** — trang profile yêu cầu đăng nhập, hiển thị thông tin user lấy từ `GET /api/auth/me` (định danh bằng JWT).

```html
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Trang cá nhân</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 500px; margin: 60px auto; }
    .header { display: flex; justify-content: space-between; align-items: center; }
    .card { border: 1px solid #ccc; border-radius: 8px; padding: 20px; margin-top: 20px; }
    .card p { margin: 8px 0; }
    .error { color: red; }
    #logout-btn { padding: 8px 16px; cursor: pointer; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Trang cá nhân</h1>
    <button id="logout-btn">Đăng xuất</button>
  </div>

  <p class="error" id="message"></p>

  <div class="card" id="profile-card" style="display:none">
    <h2 id="user-name"></h2>
    <p><strong>Email:</strong> <span id="user-email"></span></p>
    <p><strong>ID:</strong> <span id="user-id"></span></p>
    <p><strong>Ngày tham gia:</strong> <span id="user-created"></span></p>
  </div>

  <script src="auth.js"></script>
  <script>
    // GUARD: chưa đăng nhập → bị đá về login.html
    if (!tokenStorage.get()) {
      window.location.href = 'login.html';
    }

    const messageEl = document.getElementById('message');
    const card = document.getElementById('profile-card');

    // Lấy thông tin user hiện tại thông qua JWT
    async function loadProfile() {
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${tokenStorage.get()}` }
        });
        const data = await res.json();

        if (!res.ok) {
          // Nếu 401 → auth.js chưa xử lý ở fetch trần này, xử lý thủ công:
          if (res.status === 401) {
            tokenStorage.clear();
            window.location.href = 'login.html';
            return;
          }
          messageEl.textContent = data.message || 'Không thể tải thông tin';
          return;
        }

        const u = data.data;
        document.getElementById('user-name').textContent = u.fullName;
        document.getElementById('user-email').textContent = u.email;
        document.getElementById('user-id').textContent = u.id;
        document.getElementById('user-created').textContent =
          new Date(u.createdAt).toLocaleString('vi-VN');
        card.style.display = 'block';
      } catch (err) {
        messageEl.textContent = 'Lỗi kết nối, vui lòng thử lại';
      }
    }

    document.getElementById('logout-btn').addEventListener('click', () => {
      tokenStorage.clear();
      window.location.href = 'login.html';
    });

    loadProfile();
  </script>
</body>
</html>
```

> 💡 **Vì sao "chỉ truy cập được nếu đã đăng nhập"?**
> 1. `tokenStorage.get()` kiểm tra client: không có token → chuyển hướng `login.html`.
> 2. `GET /api/auth/me` (có gửi `Authorization: Bearer`) phía server: middleware `authenticateJWT` verify token → sai/thiếu/hết hạn trả `401`.
> 3. Đây là **cả hai lớp bảo vệ**: frontend guard (UX) + backend JWT (bảo mật thực sự). Việc bảo vệ thật sự nằm ở backend — kẻ gọi API trực tiếp không qua frontend vẫn bị chặn bởi middleware.

---

## 15. Bước 13 — (Tùy chọn) Bảo vệ toàn bộ API /profiles

> Yêu cầu gốc nói "chỉ được truy cập nếu đã đăng nhập" — nếu bạn muốn **toàn bộ API quản lý profile cũng phải đăng nhập** (không chỉ trang profile), thực hiện theo lộ trình này **SAU KHI luồng auth hoạt động ổn định**.

### 15.1 Backend — server.js

```js
// Thay vì: app.use('/profiles', profileRoutes);
// Đổi thành:
app.use('/profiles', authenticateJWT, profileRoutes);
// (import authenticateJWT ở đầu file)
```

### 15.2 Frontend — script.js

Thay toàn bộ `fetch(...)` bằng `apiFetch(...)` (từ `auth.js`) và thêm guard đầu file:

```js
// Đầu script.js — thêm:
if (!tokenStorage.get()) {
  window.location.href = 'login.html';
}

// Ví dụ: đổi
// const res = await fetch(`${API}?${params.toString()}`);
// thành
// const res = await apiFetch(`${API}?${params.toString()}`);
// ...tương tự cho POST và DELETE
```

### 15.3 Kiểm thử lại

Mọi test curl cũ phải thêm header:

```bash
curl -H "Authorization: Bearer <TOKEN>" http://localhost:3000/profiles
```

---

## 16. Kiểm thử toàn bộ luồng

> Giả định server chạy `http://localhost:3000` (lệnh khởi động: `cd backend && npm run dev`).

### 16.1 Test bằng curl (Windows PowerShell)

**1. Server sống**
```bash
curl.exe -i http://localhost:3000/ping
# → 200 {"success":true,"message":"pong"}
```

**2. REGISTER — thành công (201)**
```bash
curl.exe -i -X POST http://localhost:3000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d '{\"fullName\":\"Nguyễn Văn C\",\"email\":\"c@example.com\",\"password\":\"secret123\"}'
# → 201, data chứa token + user (KHÔNG có passwordHash)
```

**3. REGISTER — trùng email (409)**
```bash
curl.exe -i -X POST http://localhost:3000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d '{\"fullName\":\"Nguyễn Văn C2\",\"email\":\"c@example.com\",\"password\":\"secret123\"}'
# → 409 {"success":false,"message":"Email đã được đăng ký"}
```

**4. REGISTER — password ngắn (400)**
```bash
curl.exe -i -X POST http://localhost:3000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d '{\"fullName\":\"X\",\"email\":\"x@example.com\",\"password\":\"123\"}'
# → 400 {"success":false,"message":"Mật khẩu phải có ít nhất 6 ký tự"}
```

**5. LOGIN — đúng (200, lấy token để dùng tiếp)**
```bash
curl.exe -i -X POST http://localhost:3000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d '{\"email\":\"c@example.com\",\"password\":\"secret123\"}'
# → 200, data.token = <JWT>  ← copy token này
```

**6. LOGIN — sai mật khẩu (401)**
```bash
curl.exe -i -X POST http://localhost:3000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d '{\"email\":\"c@example.com\",\"password\":\"sai-mat-khau\"}'
# → 401 {"success":false,"message":"Email hoặc mật khẩu không đúng"}
```

**7. LOGIN — email không tồn tại (401, message GIỐNG bước 6)**
```bash
curl.exe -i -X POST http://localhost:3000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d '{\"email\":\"khong-ton-tai@example.com\",\"password\":\"secret123\"}'
# → 401, cùng message — không lộ thông tin user tồn tại hay không
```

**8. GET /api/auth/me — có token (200)**
```bash
curl.exe -i http://localhost:3000/api/auth/me ^
  -H "Authorization: Bearer <TOKEN_LAY_O_BUOC_5>"
# → 200, data không chứa passwordHash
```

**9. GET /api/auth/me — thiếu token (401)**
```bash
curl.exe -i http://localhost:3000/api/auth/me
# → 401 {"success":false,"message":"Thiếu token xác thực"}
```

**10. GET /api/auth/me — token sai (401)**
```bash
curl.exe -i http://localhost:3000/api/auth/me ^
  -H "Authorization: Bearer abc.def.ghi"
# → 401 {"success":false,"message":"Token không hợp lệ"}
```

**11. Route cũ KHÔNG bị phá vỡ (xác nhận Phương án B)**
```bash
curl.exe -i http://localhost:3000/profiles
# → 200 (vẫn public, không cần token)
```

### 16.2 Test bằng Postman (checklist)

| # | Request | Mong đợi |
|---|---------|----------|
| 1 | `POST /api/auth/register` (hợp lệ) | `201` + token + user |
| 2 | `POST /api/auth/register` (trùng email) | `409` |
| 3 | `POST /api/auth/register` (password < 6) | `400` |
| 4 | `POST /api/auth/login` (đúng) | `200` + token |
| 5 | `POST /api/auth/login` (sai pass) | `401` |
| 6 | `GET /api/auth/me` (kèm token) | `200` + user an toàn |
| 7 | `GET /api/auth/me` (không token) | `401` |
| 8 | `GET /api/auth/me` (token sai/hết hạn) | `401` |
| 9 | `GET /profiles`, `POST /profiles` | vẫn hoạt động (không cần token) |

> **Mẹo Postman:** tạo Environment variable `token`, ở test của request Login viết script:
> ```js
> pm.environment.set('token', pm.response.json().data.token);
> ```
> Rồi dùng `Authorization: Bearer {{token}}` cho request `/me`.

### 16.3 Test trình duyệt (E2E)

1. Mở `http://localhost:3000/` → vẫn là trang quản lý profile cũ (hoạt động bình thường).
2. Mở `http://localhost:3000/login.html` → nhập sai mật khẩu → thấy lỗi `401`.
3. Đăng ký user mới tại `http://localhost:3000/register.html` → tự chuyển sang `profile.html`.
4. Tại `profile.html` thấy đúng tên/email vừa đăng ký.
5. Bấm **Đăng xuất** → quay về `login.html`.
6. Truy cập thẳng `http://localhost:3000/profile.html` → **bị đá về `login.html`** (guard).
7. Mở DevTools → Application → Local Storage → xóa `token` → truy cập `profile.html` → bị đá về login.

---

## 17. Các lưu ý bảo mật

1. **Không bao giờ trả `passwordHash`** ra ngoài — đã xử lý bằng `toSafeUser()`.
2. **Hash password bằng bcrypt** (cost 10) — không lưu plaintext, không dùng MD5/SHA (quá nhanh để brute-force).
3. **Message lỗi login giống nhau** cho mọi trường hợp sai → chống user enumeration.
4. **JWT_SECRET phải đủ dài và ngẫu nhiên** (≥ 32 ký tự), lưu trong `.env`, không commit.
5. **Token hết hạn sau `1h`** — giảm thiểu rủi ro khi token bị lộ.
6. **localStorage dễ bị đọc bởi XSS** — đây là hạn chế của phương án đơn giản; production nên chuyển sang **httpOnly cookie** (kèm CSRF protection) hoặc lưu refresh token an toàn.
7. **Validate ở cả client và server** — client chỉ để UX, server mới là tuyến phòng thủ thực sự.
8. **In-Memory DB mất dữ liệu khi restart server** — nếu cần lưu lâu dài, nâng cấp tầng `database/` lên SQLite/MongoDB (Controller/Service không đổi).

---

## 18. Lỗi thường gặp & cách xử lý

| # | Triệu chứng | Nguyên nhân | Cách xử lý |
|---|---|---|---|
| 1 | `Cannot find module 'jsonwebtoken'` | Chưa cài dependency | Chạy `cd backend && npm install jsonwebtoken bcryptjs dotenv` |
| 2 | Register/login trả `500` | Quên `import 'dotenv/config'` → `JWT_SECRET` undefined; hoặc lỗi cú pháp | Kiểm tra `server.js` nạp dotenv, kiểm tra log console |
| 3 | `/api/auth/me` luôn trả `401 Token không hợp lệ` | Gửi sai header / secret khác nhau | Đảm bảo `Authorization: Bearer <token>`; secret phải khớp `.env` |
| 4 | Đăng nhập đúng mà trả `401` | Email bị lệch hoa/thường; hoặc user chưa tồn tại | Service đã lowercase email; kiểm tra dữ liệu user đã lưu |
| 5 | Trang profile không load được | Chưa khai báo `auth.js` đúng cách / biến global không có | Kiểm tra thẻ `<script src="auth.js"></script>` và tên biến (`tokenStorage`) |
| 6 | Sau khi xóa localStorage vẫn vào được profile | Token vẫn hợp lệ trong memory của fetch wrapper | Refresh trang; guard chỉ chạy lúc load |
| 7 | Muốn seed user mẫu để test nhanh | Không muốn đăng ký thủ công | Thêm user mẫu vào `user.database.js`: tạo object `{ id, email, passwordHash, fullName, createdAt }` với `passwordHash` = kết quả của `bcrypt.hash('secret123', 10)` chạy bằng Node, ví dụ: `node -e "const b=require('bcryptjs');b.hash('secret123',10).then(h=>console.log(h))"`. |
| 8 | `npm run dev` không tự reload khi tạo file mới | `node --watch` chỉ theo dõi file import | Restart server sau khi thêm file mới |

---

## 19. ✅ Checklist hoàn thành

- [ ] `npm install jsonwebtoken bcryptjs dotenv` trong `backend/` thành công
- [ ] File `backend/.env` có `JWT_SECRET` ngẫu nhiên dài ≥ 32 ký tự
- [ ] Tạo `backend/src/database/user.database.js`
- [ ] Tạo `backend/src/services/auth.service.js`
- [ ] Tạo `backend/src/middlewares/authenticate.middleware.js`
- [ ] Tạo `backend/src/controllers/auth.controller.js`
- [ ] Tạo `backend/src/routes/auth.route.js`
- [ ] Cập nhật `backend/src/server.js` (import dotenv, mount `/api/auth`)
- [ ] Tạo `frontend/auth.js`, `frontend/login.html`, `frontend/register.html`, `frontend/profile.html`
- [ ] Test curl 11 bước (mục 16.1) đạt 100%
- [ ] Test Postman checklist (mục 16.2) đạt 100%
- [ ] Test E2E trình duyệt (mục 16.3) đạt 100%
- [ ] (Tùy chọn Phase 2) Bảo vệ `/profiles` theo mục 15
