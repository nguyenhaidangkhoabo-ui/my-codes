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