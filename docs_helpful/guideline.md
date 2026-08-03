# **Hướng Dẫn Hiểu Dự Án TrueProject (Quản Lý Thông Tin Cá Nhân)**

> Cẩm nang này giúp bạn đọc hiểu toàn bộ dự án **trueproject** — một ứng dụng web **Quản lý Thông tin Cá nhân** (CRUD) được xây dựng bằng **Node.js + Express** (backend) và **HTML/CSS/JS thuần** (frontend). Bạn sẽ hiểu từng dòng lệnh làm gì và **chúng liên kết với nhau như thế nào**.

---

## 🗺️ Tổng quan: Dự án này là gì?

Dự án gồm **2 phần** chính:

```
trueproject/
├── backend/          ← Máy chủ API (Node.js + Express)
│   └── src/
│       ├── server.js                    (Điểm khởi động)
│       ├── routes/profile.route.js      (Tầng 1: Định tuyến)
│       ├── controllers/profile.controller.js (Tầng 2: Điều khiển)
│       ├── services/profile.service.js  (Tầng 3: Nghiệp vụ)
│       ├── database/profile.database.js (Tầng 4: Lưu trữ)
│       └── middlewares/error.middleware.js (Xử lý lỗi)
└── frontend/         ← Giao diện người dùng (HTML/CSS/JS)
    ├── index.html
    └── script.js
```

**Ý tưởng cốt lõi:** Backend cung cấp các **API** (đường dẫn trả dữ liệu JSON). Frontend gọi các API đó bằng `fetch()` để hiển thị và thao tác dữ liệu. Toàn bộ dữ liệu được lưu **trong bộ nhớ (in-memory)** — chưa dùng cơ sở dữ liệu thật.

---

## 🚀 Cách chạy dự án (Các lệnh quan trọng)

Mở terminal tại thư mục `backend/` và chạy:

```bash
npm install        # Lần đầu: cài các thư viện (express, cors, ...)
npm start          # Chạy server (node src/server.js)
npm run dev        # Chạy server ở chế độ phát triển (tự khởi động lại khi sửa code)
```

Sau khi chạy, mở trình duyệt tại: **http://localhost:3000**

> **Giải thích:** `npm start` chạy lệnh `node src/server.js` — tức là chạy file `server.js`. Lệnh `npm run dev` dùng `node --watch` để **tự động khởi động lại** mỗi khi bạn sửa file, rất tiện khi phát triển.

---

## 🔗 Luồng hoạt động: Một yêu cầu đi qua những đâu?

Đây là **điều quan trọng nhất** để hiểu dự án. Khi bạn thao tác trên giao diện, dữ liệu chạy theo **một chiều duy nhất**:

```
Frontend (script.js)
   │  fetch('/profiles')
   ▼
server.js  ──►  routes  ──►  controllers  ──►  services  ──►  database
   │  (định tuyến)   (điều khiển)    (nghiệp vụ)     (lưu trữ)
   ▼
Trả về JSON  ──►  Frontend hiển thị lên bảng
```

**Nguyên tắc 4 tầng (SRP):** Mỗi tầng chỉ làm **một việc**:
1. **Route** — chỉ biết "đường đi" (URL nào gọi hàm nào).
2. **Controller** — nhận yêu cầu, gọi Service, trả về mã trạng thái HTTP.
3. **Service** — chứa **nghiệp vụ** (kiểm tra dữ liệu, tính tuổi, lọc, sắp xếp).
4. **Database** — chỉ làm **CRUD thô** (thêm/sửa/xóa/tìm) trên mảng.

---

## 📄 Đọc từng file: Các dòng lệnh làm gì?

### 1. `backend/src/server.js` — Điểm khởi động

```javascript
import express from 'express';          // Mượn thư viện Express (tạo server)
import cors from 'cors';                // Cho phép trình duyệt gọi API
import profileRoutes from './routes/profile.route.js'; // Mượn các đường dẫn /profiles
import errorHandler from './middlewares/error.middleware.js'; // Mượn bộ xử lý lỗi

const app = express();                  // Tạo ứng dụng Express
const PORT = process.env.PORT || 3000;  // Cổng chạy (mặc định 3000)

app.use(cors());                        // Bật CORS
app.use(express.json());                // Đọc dữ liệu JSON từ body yêu cầu
app.use(express.static(path.join(__dirname, '../../frontend'))); // Phục vụ file frontend

app.get('/ping', (req, res) => {        // Endpoint kiểm tra sức khỏe
  res.json({ success: true, message: 'pong' });
});

app.use('/profiles', profileRoutes);    // Gắn các route /profiles vào app
app.use(errorHandler);                  // Bộ xử lý lỗi (PHẢI đặt cuối cùng)

app.listen(PORT, () => {                // Bắt đầu lắng nghe
  console.log(`Server running at http://localhost:${PORT}`);
});
```

**Giải thích từng dòng:**
- `import ... from ...` = mượn công cụ từ file/thư viện khác (giống `require`).
- `app.use('/profiles', profileRoutes)` → **liên kết quan trọng**: mọi URL bắt đầu bằng `/profiles` sẽ được chuyển sang file `profile.route.js` xử lý.
- `app.use(errorHandler)` → nếu có lỗi ở bất kỳ đâu, nó sẽ được chuyển xuống đây.

---

### 2. `routes/profile.route.js` — Bản đồ đường đi

```javascript
import { Router } from 'express';
import { profileController } from '../controllers/profile.controller.js';

const router = Router();

router.get('/', profileController.getAll);      // GET  /profiles
router.get('/:id', profileController.getById);    // GET  /profiles/1
router.post('/', profileController.create);       // POST /profiles
router.put('/:id', profileController.update);     // PUT  /profiles/1
router.patch('/:id', profileController.patch);    // PATCH /profiles/1
router.delete('/:id', profileController.delete);  // DELETE /profiles/1

export default router;
```

**Giải thích:**
- `router.get('/', ...)` → khi có yêu cầu `GET /profiles`, gọi hàm `getAll`.
- `:id` là **tham số động** — ví dụ `/profiles/5` thì `id = 5`.
- File này **không chứa logic**, chỉ là "bảng chỉ đường" nối URL với Controller.

---

### 3. `controllers/profile.controller.js` — Người điều phối

```javascript
async getAll(req, res, next) {
  try {
    const result = await profileService.getAllProfiles(req.query);
    if (!result.isSuccess) return res.status(result.statusCode).json({ success: false, message: result.message });
    res.status(200).json({ success: true, message: 'Lấy danh sách thành công', data: result.data });
  } catch (err) { next(err); }
}
```

**Giải thích:**
- `req` = yêu cầu (chứa dữ liệu gửi lên), `res` = phản hồi (trả về cho client).
- Gọi `profileService.getAllProfiles(...)` → **liên kết sang Service**.
- Nếu `isSuccess = false` → trả về mã lỗi (`400`, `404`...). Nếu thành công → trả về `200` kèm dữ liệu.
- `next(err)` → nếu có lỗi bất ngờ, chuyển xuống `errorHandler`.

### 4. Service (`profile.service.js`) — Bộ não nghiệp vụ

```javascript
async getAllProfiles(queryParams = {}) {
  let list = await profileDb.getAll();               // Lấy dữ liệu từ Database
  list = list.map((p) => ({ ...p, age: CURRENT_YEAR - p.birthYear })); // Tự tính tuổi

  if (queryParams.search) {                          // Lọc theo tên
    const keyword = queryParams.search.toLowerCase();
    list = list.filter((p) => p.fullName.toLowerCase().includes(keyword));
  }
  if (queryParams.gender) {                          // Lọc theo giới tính
    list = list.filter((p) => p.gender === queryParams.gender);
  }
  if (queryParams.sortBirthYear === 'asc') {         // Sắp xếp tăng dần
    list.sort((a, b) => a.birthYear - b.birthYear);
  }
  return ok(list);                                   // Trả về { isSuccess: true, data }
}
```

**Giải thích:**
- `profileDb.getAll()` → **liên kết sang Database** để lấy dữ liệu thô.
- `map`, `filter`, `sort` → các hàm xử lý mảng của JS (biến đổi danh sách).
- `ok(list)` → đóng gói kết quả theo **Result Object Pattern** `{isSuccess, data}` để Controller dễ kiểm tra.

### 5. Database (`database/profile.database.js`) — Kho lưu trữ

```javascript
let profiles = [ /* 2 bản ghi mẫu */ ];
let nextId = 3;

export const profileDb = {
  async getAll() { return [...profiles]; },
  async getById(id) { return profiles.find((p) => p.id === id) || null; },
  async create(data) { const np = { id: nextId++, ...data }; profiles.push(np); return np; },
  async delete(id) { const i = profiles.findIndex((p) => p.id === id); if (i === -1) return false; profiles.splice(i, 1); return true; }
};
```

**Giải thích:**
- `profiles` là **mảng trong bộ nhớ** — dữ liệu sẽ mất khi tắt server.
- `find`, `findIndex`, `push`, `splice` → các thao tác CRUD trên mảng.
- Tầng này **không kiểm tra nghiệp vụ** — chỉ thao tác dữ liệu thô.

### 6. `middlewares/error.middleware.js` — Bộ bắt lỗi

```javascript
export default function errorHandler(err, req, res, next) {
  console.error(err);
  res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Lỗi máy chủ nội bộ' });
}
```

**Giải thích:** Hàm có **4 tham số** `(err, req, res, next)` là dấu hiệu nhận biết middleware lỗi. Nó bắt mọi lỗi chưa được xử lý và trả về JSON `{success:false}`.

---

## 🌐 Frontend: Giao diện gọi API như thế nào?

### `frontend/script.js` — Kết nối với backend

```javascript
const API = '/profiles';   // Địa chỉ API (cùng server, nên không cần http://localhost:3000)

async function fetchProfiles() {
  const params = new URLSearchParams();   // Tạo chuỗi query ?search=...&gender=...
  if (searchInput.value) params.set('search', searchInput.value);
  if (genderFilter.value) params.set('gender', genderFilter.value);
  if (sortSelect.value) params.set('sortBirthYear', sortSelect.value);

  const res = await fetch(`${API}?${params.toString()}`);  // Gọi GET /profiles
  const data = await res.json();
  if (!data.success) { messageEl.textContent = data.message; return; }
  renderTable(data.data);   // Hiển thị dữ liệu lên bảng
}
```

**Giải thích:**
- `fetch()` → gửi yêu cầu HTTP đến backend. `await` → chờ kết quả trả về.
- `URLSearchParams` → tạo chuỗi truy vấn như `?search=An&gender=male`.
- `renderTable(data.data)` → **liên kết**: dữ liệu JSON từ backend được vẽ thành các dòng trong bảng HTML.

**Các sự kiện gắn kết:**
```javascript
form.addEventListener('submit', ...);        // Khi bấm "Thêm" → POST /profiles
tableBody.addEventListener('click', ...);    // Khi bấm "Xóa" → DELETE /profiles/:id
searchInput.addEventListener('input', fetchProfiles);  // Gõ tìm kiếm → gọi lại API
fetchProfiles();                             // Chạy lần đầu khi tải trang
```

---

## 🔗 Tổng kết: Các mảnh ghép liên kết với nhau

| Bạn thao tác | Frontend gọi | Route | Controller | Service | Database |
|--------------|--------------|-------|-----------|---------|----------|
| Tải trang | `GET /profiles` | `getAll` | `getAllProfiles` | lọc/sắp xếp | `getAll` |
| Thêm mới | `POST /profiles` | `create` | `createProfile` | kiểm tra trùng | `create` |
| Xóa | `DELETE /profiles/1` | `delete` | `delete` | kiểm tra tồn tại | `delete` |

**Chuỗi liên kết hoàn chỉnh:**
```
script.js ──fetch──► server.js ──app.use('/profiles')──► route ──► controller ──► service ──► database
   ▲                                                                                          │
   └─────────────────────────── JSON trả về (data) ───────────────────────────────────────────┘
```

---

## 💡 Lời khuyên khi đọc dự án này

1. **Bắt đầu từ `server.js`** — nó là "cửa ngõ" nối mọi thứ lại.
2. **Đi theo một luồng duy nhất** (ví dụ: chức năng "Thêm mới") từ frontend → backend → database → trả về.
3. **Nhớ quy tắc 4 tầng:** Route (đường đi) → Controller (điều khiển) → Service (nghiệp vụ) → Database (lưu trữ). Mỗi tầng chỉ làm một việc.
4. **Dùng `console.log()`** để xem dữ liệu thực tế tại từng tầng khi gặp lỗi.
5. **Đặt câu hỏi "Hàm này nhận gì và trả về gì?"** — đừng sa lầy vào chi tiết bên trong.

---

*Tài liệu tham khảo thêm: `docs/main.md` (kiến trúc), `docs/mapping.md` (bản đồ tài liệu), `docs/phase.md` (các giai đoạn), `docs/loginreg.md` (tính năng đăng nhập sắp tới).*

---