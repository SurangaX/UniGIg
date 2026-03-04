/**
 * auth.js – Login / register / logout + role-based redirects
 */
import api from './api.js';

/** Redirect if already logged in (for login/register pages) */
export function redirectIfLoggedIn() {
  const user = api.getUser();
  if (!user) return;
  if (user.role === 'EMPLOYER') {
    window.location.href = '/employer-dashboard.html';
  } else {
    window.location.href = '/student-dashboard.html';
  }
}

/** Redirect if NOT logged in */
export function requireAuth(role = null) {
  const user = api.getUser();
  if (!user || !api.getToken()) {
    window.location.href = '/login.html';
    return null;
  }
  if (role && user.role !== role) {
    window.location.href = '/index.html';
    return null;
  }
  return user;
}

export async function login(email, password) {
  const data = await api.post('/auth/login', { email, password });
  api.setToken(data.token);
  api.setUser(data.user);
  return data.user;
}

export async function register(payload) {
  const data = await api.post('/auth/register', payload);
  api.setToken(data.token);
  api.setUser(data.user);
  return data.user;
}

export function logout() {
  api.removeToken();
  window.location.href = '/index.html';
}

/** Refresh stored user from server */
export async function refreshUser() {
  try {
    const user = await api.get('/auth/me');
    api.setUser(user);
    return user;
  } catch {
    return null;
  }
}
