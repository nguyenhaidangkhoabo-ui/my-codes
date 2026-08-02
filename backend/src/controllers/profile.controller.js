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