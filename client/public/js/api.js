/**
 * api.js – Fetch wrapper with JWT token handling
 * All methods return parsed JSON or throw an Error with a message.
 */

const BASE_URL = 'https://unigig-1.onrender.com/api';

function getToken() {
  return localStorage.getItem('ug_token');
}

function setToken(token) {
  localStorage.setItem('ug_token', token);
}

function removeToken() {
  localStorage.removeItem('ug_token');
  localStorage.removeItem('ug_user');
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('ug_user'));
  } catch { return null; }
}

function setUser(user) {
  localStorage.setItem('ug_user', JSON.stringify(user));
}

// ── Page spinner (no import needed – manipulates DOM by id) ──
let _spinCount = 0;
function _spinnerIn() {
  _spinCount++;
  document.getElementById('page-spinner')?.classList.add('active');
}
function _spinnerOut() {
  if (--_spinCount <= 0) {
    _spinCount = 0;
    document.getElementById('page-spinner')?.classList.remove('active');
  }
}

async function request(method, path, body = null, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const config = {
    method,
    headers,
    ...options,
  };
  if (body !== null) {
    config.body = JSON.stringify(body);
  }

  _spinnerIn();
  try {
    const res = await fetch(`${BASE_URL}${path}`, config);

    // No body for 204 responses
    if (res.status === 204) return null;

    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.error || `HTTP ${res.status}`);
      err.status = res.status;
      // Auto-logout if server says the account no longer exists
      if (res.status === 401 && getToken() && !path.startsWith('/auth')) {
        removeToken();
        window.location.href = '/login.html';
      }
      throw err;
    }
    return data;
  } finally {
    _spinnerOut();
  }
}

// Convenience helpers
const api = {
  get:    (path)        => request('GET',    path),
  post:   (path, body)  => request('POST',   path, body),
  put:    (path, body)  => request('PUT',    path, body),
  patch:  (path, body)  => request('PATCH',  path, body),
  delete: (path, body)  => request('DELETE', path, body || null),

  // Auth helpers
  getToken, setToken, removeToken, getUser, setUser,
};

export default api;
