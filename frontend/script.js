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