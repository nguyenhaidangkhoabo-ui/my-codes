I now have everything I need. Here is your complete, detailed implementation plan — written so you can type every file by hand, plus a code evaluation against the 100-point rubric.

---

# 📋 IMPLEMENTATION PLAN — `hvn-khkt-task-002`

## Cấu trúc thư mục cuối cùng (theo lựa chọn của bạn)

```
C:\Users\Admin\Desktop\trueproject\
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
```

> ⚠️ Lưu ý quan trọng: vì backend nằm trong `backend/` và frontend trong `frontend/`, `express.static` phải trỏ sang `../frontend` (xem `server.js`). Đây là điểm khác biệt duy nhất so với docs gốc.

---

## 🟢 PHASE 1 — Setup Khung & Server Base

### 1.1 `.gitignore` (đặt tại `C:\Users\Admin\Desktop\trueproject\`)
```gitignore
node_modules/
.env
logs/
```

### 1.2 `backend/package.json`
```json
{
  "name": "hvn-khkt-task-002",
  "version": "1.0.0",
  "description": "RESTful API Quản lý Thông tin Cá nhân - Express.js",
  "type": "module",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "node --watch src/server.js"
  },
  "dependencies": {
    "express": "^4.19.2",
    "cors": "^2.8.5"
  }
}
```
Sau đó chạy `npm install` trong thư mục `backend/`.

### 1.3 `backend/src/server.js`
```js
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import profileRoutes from './routes/profile.route.js';
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
app.use('/profiles', profileRoutes);

// Global error handler (PHẢI đặt cuối cùng)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
```

✅ **Kiểm tra Phase 1:** `npm run dev` → mở `http://localhost:3000/ping` thấy `{ success: true, message: "pong" }`.

---

## 🟢 PHASE 2 — Database & Service Layer

### 2.1 `backend/src/database/profile.database.js`
```js
// Tầng Database: chỉ CRUD thô trên mảng In-Memory, KHÔNG chứa nghiệp vụ.
let profiles = [
  { id: 1, fullName: 'Nguyễn Văn A', birthYear: 2000, gender: 'male', email: 'a@example.com', phone: '0901000001' },
  { id: 2, fullName: 'Trần Thị B', birthYear: 1995, gender: 'female', email: 'b@example.com', phone: '0901000002' }
];
let nextId = 3;

export const profileDb = {
  async getAll() {
    return [...profiles];
  },
  async getById(id) {
    return profiles.find((p) => p.id === id) || null;
  },
  async create(data) {
    const newProfile = { id: nextId++, ...data };
    profiles.push(newProfile);
    return newProfile;
  },
  async update(id, data) {
    const index = profiles.findIndex((p) => p.id === id);
    if (index === -1) return null;
    profiles[index] = { id, ...data };
    return profiles[index];
  },
  async patch(id, data) {
    const index = profiles.findIndex((p) => p.id === id);
    if (index === -1) return null;
    profiles[index] = { ...profiles[index], ...data, id };
    return profiles[index];
  },
  async delete(id) {
    const index = profiles.findIndex((p) => p.id === id);
    if (index === -1) return false;
    profiles.splice(index, 1);
    return true;
  },
  async findByEmailOrPhone(email, phone, excludeId) {
    return profiles.find(
      (p) => p.id !== excludeId && (p.email === email || p.phone === phone)
    ) || null;
  }
};
```

### 2.2 `backend/src/services/profile.service.js`
```js
import { profileDb } from '../database/profile.database.js';

const CURRENT_YEAR = new Date().getFullYear();

// Result Object Pattern
const ok = (data) => ({ isSuccess: true, data });
const fail = (statusCode, message) => ({ isSuccess: false, statusCode, message });

export const profileService = {
  async getAllProfiles(queryParams = {}) {
    let list = await profileDb.getAll();

    // Tự tính tuổi
    list = list.map((p) => ({ ...p, age: CURRENT_YEAR - p.birthYear }));

    // Lọc theo tên
    if (queryParams.search) {
      const keyword = queryParams.search.toLowerCase();
      list = list.filter((p) => p.fullName.toLowerCase().includes(keyword));
    }

    // Lọc theo giới tính
    if (queryParams.gender) {
      list = list.filter((p) => p.gender === queryParams.gender);
    }

    // Sắp xếp theo năm sinh
    if (queryParams.sortBirthYear === 'asc') {
      list.sort((a, b) => a.birthYear - b.birthYear);
    } else if (queryParams.sortBirthYear === 'desc') {
      list.sort((a, b) => b.birthYear - a.birthYear);
    }

    return ok(list);
  },

  async getById(id) {
    const profile = await profileDb.getById(id);
    if (!profile) return fail(404, 'Không tìm thấy profile');
    return ok({ ...profile, age: CURRENT_YEAR - profile.birthYear });
  },

  async createProfile(data) {
    const required = ['fullName', 'birthYear', 'gender', 'email', 'phone'];
    for (const field of required) {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        return fail(400, `Thiếu trường bắt buộc: ${field}`);
      }
    }

    const birthYear = Number(data.birthYear);
    if (!Number.isInteger(birthYear) || birthYear < 1900 || birthYear > CURRENT_YEAR) {
      return fail(400, `Năm sinh phải từ 1900 - ${CURRENT_YEAR}`);
    }

    const duplicate = await profileDb.findByEmailOrPhone(data.email, data.phone);
    if (duplicate) return fail(400, 'Email hoặc số điện thoại đã tồn tại');

    const created = await profileDb.create(data);
    return ok(created);
  },

  async update(id, data) {
    const existing = await profileDb.getById(id);
    if (!existing) return fail(404, 'Không tìm thấy profile');

    // Strict PUT: bắt buộc đủ 5 trường
    const required = ['fullName', 'birthYear', 'gender', 'email', 'phone'];
    for (const field of required) {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        return fail(400, `Thiếu trường bắt buộc: ${field}`);
      }
    }

    const birthYear = Number(data.birthYear);
    if (!Number.isInteger(birthYear) || birthYear < 1900 || birthYear > CURRENT_YEAR) {
      return fail(400, `Năm sinh phải từ 1900 - ${CURRENT_YEAR}`);
    }

    const duplicate = await profileDb.findByEmailOrPhone(data.email, data.phone, id);
    if (duplicate) return fail(400, 'Email hoặc số điện thoại đã tồn tại');

    const updated = await profileDb.update(id, data);
    return ok(updated);
  },

  async patch(id, data) {
    const existing = await profileDb.getById(id);
    if (!existing) return fail(404, 'Không tìm thấy profile');

    if (data.birthYear !== undefined) {
      const birthYear = Number(data.birthYear);
      if (!Number.isInteger(birthYear) || birthYear < 1900 || birthYear > CURRENT_YEAR) {
        return fail(400, `Năm sinh phải từ 1900 - ${CURRENT_YEAR}`);
      }
    }

    if (data.email !== undefined || data.phone !== undefined) {
      const duplicate = await profileDb.findByEmailOrPhone(data.email, data.phone, id);
      if (duplicate) return fail(400, 'Email hoặc số điện thoại đã tồn tại');
    }

    const patched = await profileDb.patch(id, data);
    return ok(patched);
  },

  async delete(id) {
    const deleted = await profileDb.delete(id);
    if (!deleted) return fail(404, 'Không tìm thấy profile');
    return ok(true);
  }
};
```

✅ **Kiểm tra Phase 2:** 2 file này **không được** import `express`, `req`, `res`.

---

## 🟢 PHASE 3 — Controller & Route Layer

### 3.1 `backend/src/controllers/profile.controller.js`
```js
import { profileService } from '../services/profile.service.js';

export const profileController = {
  async getAll(req, res, next) {
    try {
      const result = await profileService.getAllProfiles(req.query);
      if (!result.isSuccess) return res.status(result.statusCode).json({ success: false, message: result.message });
      res.status(200).json({ success: true, message: 'Lấy danh sách thành công', data: result.data });
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const result = await profileService.getById(Number(req.params.id));
      if (!result.isSuccess) return res.status(result.statusCode).json({ success: false, message: result.message });
      res.status(200).json({ success: true, message: 'Lấy profile thành công', data: result.data });
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const result = await profileService.createProfile(req.body);
      if (!result.isSuccess) return res.status(result.statusCode).json({ success: false, message: result.message });
      res.status(201).json({ success: true, message: 'Tạo profile thành công', data: result.data });
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const result = await profileService.update(Number(req.params.id), req.body);
      if (!result.isSuccess) return res.status(result.statusCode).json({ success: false, message: result.message });
      res.status(200).json({ success: true, message: 'Cập nhật thành công', data: result.data });
    } catch (err) { next(err); }
  },

  async patch(req, res, next) {
    try {
      const result = await profileService.patch(Number(req.params.id), req.body);
      if (!result.isSuccess) return res.status(result.statusCode).json({ success: false, message: result.message });
      res.status(200).json({ success: true, message: 'Cập nhật một phần thành công', data: result.data });
    } catch (err) { next(err); }
  },

  async delete(req, res, next) {
    try {
      const result = await profileService.delete(Number(req.params.id));
      if (!result.isSuccess) return res.status(result.statusCode).json({ success: false, message: result.message });
      res.status(204).send(); // 204 KHÔNG có body
    } catch (err) { next(err); }
  }
};
```

### 3.2 `backend/src/routes/profile.route.js`
```js
import { Router } from 'express';
import { profileController } from '../controllers/profile.controller.js';

const router = Router();

router.get('/', profileController.getAll);
router.get('/:id', profileController.getById);
router.post('/', profileController.create);
router.put('/:id', profileController.update);
router.patch('/:id', profileController.patch);
router.delete('/:id', profileController.delete);

export default router;
```

✅ **Kiểm tra Phase 3 (Postman):**
| Test | Kết quả mong đợi |
|------|------------------|
| `POST /profiles` đủ dữ liệu | `201` |
| `POST /profiles` thiếu trường | `400` |
| `POST /profiles` trùng email | `400` |
| `GET /profiles/999` | `404` |
| `DELETE /profiles/1` | `204` (không body) |
| `PUT /profiles/1` thiếu 1 trong 5 trường | `400` |

---

## 🟢 PHASE 4 — Frontend & Tích hợp API

### 4.1 `frontend/index.html`
```html
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Quản lý Thông tin Cá nhân</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    h1 { color: #333; }
    form, .filters { margin-bottom: 20px; }
    input, select, button { padding: 6px; margin: 4px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
    .error { color: red; }
  </style>
</head>
<body>
  <h1>Quản lý Thông tin Cá nhân</h1>

  <form id="profile-form">
    <h3>Thêm mới</h3>
    <input type="text" id="fullName" placeholder="Họ tên" required />
    <input type="number" id="birthYear" placeholder="Năm sinh" required />
    <select id="gender" required>
      <option value="">Giới tính</option>
      <option value="male">Nam</option>
      <option value="female">Nữ</option>
      <option value="other">Khác</option>
    </select>
    <input type="email" id="email" placeholder="Email" required />
    <input type="tel" id="phone" placeholder="SĐT" required />
    <button type="submit">Thêm</button>
  </form>

  <div class="filters">
    <input type="text" id="search" placeholder="Tìm theo tên" />
    <select id="gender-filter">
      <option value="">Tất cả giới tính</option>
      <option value="male">Nam</option>
      <option value="female">Nữ</option>
      <option value="other">Khác</option>
    </select>
    <select id="sort">
      <option value="">Sắp xếp</option>
      <option value="asc">Năm sinh tăng dần</option>
      <option value="desc">Năm sinh giảm dần</option>
    </select>
  </div>

  <p id="message" class="error"></p>

  <table>
    <thead>
      <tr>
        <th>ID</th><th>Họ tên</th><th>Năm sinh</th><th>Tuổi</th>
        <th>Giới tính</th><th>Email</th><th>SĐT</th><th></th>
      </tr>
    </thead>
    <tbody id="table-list"></tbody>
  </table>

  <script src="script.js"></script>
</body>
</html>
```

### 4.2 `frontend/script.js`
```js
const API = '/profiles';

const form = document.getElementById('profile-form');
const searchInput = document.getElementById('search');
const genderFilter = document.getElementById('gender-filter');
const sortSelect = document.getElementById('sort');
const tableBody = document.getElementById('table-list');
const messageEl = document.getElementById('message');

async function fetchProfiles() {
  const params = new URLSearchParams();
  if (searchInput.value) params.set('search', searchInput.value);
  if (genderFilter.value) params.set('gender', genderFilter.value);
  if (sortSelect.value) params.set('sortBirthYear', sortSelect.value);

  const res = await fetch(`${API}?${params.toString()}`);
  const data = await res.json();
  if (!data.success) {
    messageEl.textContent = data.message;
    return;
  }
  renderTable(data.data);
}

function renderTable(profiles) {
  tableBody.innerHTML = '';
  profiles.forEach((p) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${p.id}</td>
      <td>${p.fullName}</td>
      <td>${p.birthYear}</td>
      <td>${p.age}</td>
      <td>${p.gender}</td>
      <td>${p.email}</td>
      <td>${p.phone}</td>
      <td><button class="delete-btn" data-id="${p.id}">Xóa</button></td>
    `;
    tableBody.appendChild(row);
  });
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    fullName: document.getElementById('fullName').value,
    birthYear: Number(document.getElementById('birthYear').value),
    gender: document.getElementById('gender').value,
    email: document.getElementById('email').value,
    phone: document.getElementById('phone').value
  };
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  messageEl.textContent = data.message || '';
  if (res.ok) {
    form.reset();
    fetchProfiles();
  }
});

tableBody.addEventListener('click', async (e) => {
  if (!e.target.classList.contains('delete-btn')) return;
  const id = e.target.dataset.id;
  const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
  if (res.status === 204) {
    messageEl.textContent = 'Đã xóa';
    fetchProfiles();
  }
});

searchInput.addEventListener('input', fetchProfiles);
genderFilter.addEventListener('change', fetchProfiles);
sortSelect.addEventListener('change', fetchProfiles);

fetchProfiles();
```

✅ **Kiểm tra Phase 4:** Mở `http://localhost:3000` → Thêm/Lọc/Xóa hoạt động, **không reload trang**.

---

## 🟢 PHASE 5 — Global Error Handling & Refactor

### 5.1 `backend/src/middlewares/error.middleware.js`
```js
// Middleware bắt lỗi 4 tham số — phải đặt sau tất cả routes.
export default function errorHandler(err, req, res, next) {
  console.error(err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Lỗi máy chủ nội bộ'
  });
}
```

---

# 🔍 ĐÁNH GIÁ CODE (Code Review theo Rubric 100đ)

| Tiêu chí | Điểm | Trạng thái | Ghi chú |
|----------|:----:|:----------:|---------|
| CRUD đầy đủ (GET list, GET by id, POST, PUT, PATCH, DELETE) | 30 | ✅ | 6 handler đủ |
| Đúng HTTP Method | 20 | ✅ | GET/POST/PUT/PATCH/DELETE khớp route |
| Đúng Status Code | 15 | ✅ | 200/201/204/400/404/500 |
| Response Entity nhất quán | 10 | ✅ | `{success, message, data}`; DELETE 204 không body |
| CORS đúng | 5 | ✅ | `app.use(cors())` |
| Tách 4 tầng SRP | 15 | ✅ | Route→Controller→Service→Database, không lẫn trách nhiệm |
| Frontend fetch không reload | 5 | ✅ | `e.preventDefault()` + `fetch()` |
| `.gitignore` & Git chuẩn | 5 | ✅ | `node_modules/`, `.env`, `logs/` |

**Tổng: 100/100** ✅

### ✅ Điểm mạnh của plan
- **SRP đúng chuẩn:** Service không biết `req`/`res`; Database không validate nghiệp vụ.
- **Result Object Pattern** giúp Controller tách bạch thành công/lỗi, dễ unit test.
- **Strict PUT** đúng yêu cầu (đủ 5 trường), PATCH linh hoạt.
- **Global error handler** tập trung, Controller chỉ `next(err)`.

### ⚠️ Lưu ý khi viết tay (tránh mất điểm)
1. **`server.js`:** đặt `app.use(errorHandler)` **sau cùng**, sau `app.use('/profiles', ...)`.
2. **`express.static`:** dùng `path.join(__dirname, '../../frontend')` vì backend nằm trong `backend/src/`.
3. **DELETE:** dùng `res.status(204).send()` — **không** gửi body.
4. **`findByEmailOrPhone`:** truyền `excludeId` khi update/patch để không tự trùng chính nó.
5. **`package.json`:** bắt buộc `"type": "module"` để dùng `import/export`.
6. **Chạy lệnh:** `npm install` phải chạy **trong `backend/`**.

### 🧪 Checklist kiểm thử cuối cùng
- [ ] `GET /ping` → `{success:true, message:"pong"}`
- [ ] `GET /profiles?search=Nguyễn&gender=male&sortBirthYear=asc` lọc + sắp xếp đúng
- [ ] `POST /profiles` thiếu trường → 400
- [ ] `POST /profiles` trùng email → 400
- [ ] `PUT /profiles/1` thiếu 1 trong 5 trường → 400
- [ ] `DELETE /profiles/1` → 204, không body
- [ ] Trang web thêm/lọc/xóa không reload

---

Bạn muốn tôi **tự động tạo toàn bộ các file này** vào đúng thư mục (backend/ + frontend/) để bạn đối chiếu, hay bạn muốn tự gõ tay theo plan này? Nếu muốn tôi tạo file, hãy cho biết và tôi sẽ triển khai ngay.