// AgriFlow — shared frontend JS
// (Static demo only. Replace TODO blocks with real API/DB calls.)

// ---------- Demo session helpers ----------
function setSession(role, name) {
  localStorage.setItem('agf_role', role);
  localStorage.setItem('agf_name', name || 'User');
}
function getSession() {
  return {
    role: localStorage.getItem('agf_role'),
    name: localStorage.getItem('agf_name') || 'User',
  };
}
function clearSession() {
  localStorage.removeItem('agf_role');
  localStorage.removeItem('agf_name');
}

function logout() {
  clearSession();
  window.location.href = '../index.html';
}

// ---------- Role picker ----------
function bindRolePicker() {
  const cards = document.querySelectorAll('.role-card');
  const hidden = document.getElementById('role');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      cards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      if (hidden) hidden.value = card.dataset.role;
    });
  });
}

// ---------- Auth handlers (demo) ----------
function bindLoginForm() {
  const form = document.getElementById('loginForm');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const role  = document.getElementById('role').value || 'farmer';
    if (!email) return;
    // TODO: replace with real auth call to your backend
    const name = email.split('@')[0];
    setSession(role, name);
    redirectToDashboard(role);
  });
}

function bindSignupForm() {
  const form = document.getElementById('signupForm');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('fullName').value.trim();
    const role = document.getElementById('role').value || 'farmer';
    if (!name) return;
    // TODO: replace with real INSERT INTO Users(...) call
    setSession(role, name);
    redirectToDashboard(role);
  });
}

function redirectToDashboard(role) {
  const map = {
    farmer:   'pages/farmer-dashboard.html',
    supplier: 'pages/supplier-dashboard.html',
    admin:    'pages/admin-dashboard.html',
  };
  const target = map[role] || map.farmer;
  // adjust prefix when called from /pages/
  const isInPages = window.location.pathname.includes('/pages/');
  window.location.href = isInPages ? '../' + target : target;
}

// ---------- Sidebar nav active state ----------
function bindSidebarLinks() {
  document.querySelectorAll('.sidebar-link').forEach(link => {
    link.addEventListener('click', (e) => {
      // allow real navigation if href is set, else just toggle active
      if (link.getAttribute('href') === '#' || !link.getAttribute('href')) {
        e.preventDefault();
        document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      }
    });
  });
}

// ---------- Inject session info into topbar / sidebar ----------
function paintSession() {
  const s = getSession();
  document.querySelectorAll('[data-session-name]').forEach(el => el.textContent = s.name);
  document.querySelectorAll('[data-session-role]').forEach(el => {
    el.textContent = s.role ? s.role.charAt(0).toUpperCase() + s.role.slice(1) : '';
  });
  document.querySelectorAll('[data-session-initial]').forEach(el => {
    el.textContent = (s.name || 'U').charAt(0).toUpperCase();
  });
}

// ---------- Modal helpers ----------
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('open');
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}

// ---------- Init ----------
document.addEventListener('DOMContentLoaded', () => {
  bindRolePicker();
  bindLoginForm();
  bindSignupForm();
  bindSidebarLinks();
  paintSession();

  document.querySelectorAll('[data-logout]').forEach(b => {
    b.addEventListener('click', logout);
  });

  document.querySelectorAll('[data-modal-open]').forEach(b => {
    b.addEventListener('click', () => openModal(b.dataset.modalOpen));
  });
  document.querySelectorAll('[data-modal-close]').forEach(b => {
    b.addEventListener('click', () => closeModal(b.dataset.modalClose));
  });
});
