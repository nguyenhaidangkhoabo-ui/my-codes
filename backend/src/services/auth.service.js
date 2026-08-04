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