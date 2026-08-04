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