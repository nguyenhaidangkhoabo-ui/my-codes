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