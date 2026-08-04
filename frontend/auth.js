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