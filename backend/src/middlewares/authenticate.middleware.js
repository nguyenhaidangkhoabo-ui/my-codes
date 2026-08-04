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