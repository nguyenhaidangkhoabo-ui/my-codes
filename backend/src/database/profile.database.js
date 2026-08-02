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