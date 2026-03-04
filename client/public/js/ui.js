/**
 * ui.js – Navbar rendering, toasts, modals, skeletons, utilities
 */
import api from './api.js';
import { logout } from './auth.js';

// ── Theme toggle ──────────────────────────────────────────────
export function initTheme() {
  const stored = localStorage.getItem('ug_theme');
  // Default to dark when no preference is stored so the toggle
  // button reflects the correct state on first load.
  const theme = stored || 'dark';
  document.documentElement.setAttribute('data-theme', theme);
}

export function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('ug_theme', next);
}

// ── Navbar ────────────────────────────────────────────────────
export function renderNavbar() {
  const nav = document.getElementById('navbar');
  if (!nav) return;

  const user = api.getUser();

  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const isHome = currentPage === 'index.html' || currentPage === '';
  const homeLink = isHome ? '' : `<a href="/index.html">Home</a>`;

  let links = '';
  let actions = '';

  if (!user) {
    links = `
      ${homeLink}
      <a href="/search.html">Search Jobs</a>
      <a href="/jobs.html">Browse All</a>
    `;
    actions = `
      <a href="/login.html"    class="btn btn--ghost btn--sm">Log in</a>
      <a href="/register.html" class="btn btn--primary btn--sm">Sign up</a>
    `;
  } else if (user.role === 'STUDENT') {
    links = `
      ${homeLink}
      <a href="/search.html">Search Jobs</a>
      <a href="/jobs.html">Browse All</a>
      <a href="/student-applications.html">My Applications</a>
    `;
    actions = `
      <a href="/student-dashboard.html" class="btn btn--ghost btn--sm">Dashboard</a>
      <button id="logout-btn" class="btn btn--outline btn--sm">Logout</button>
    `;
  } else if (user.role === 'EMPLOYER') {
    links = `
      ${homeLink}
      <a href="/employer-jobs.html">My Jobs</a>
      <a href="/employer-new-job.html">Post a Job</a>
    `;
    actions = `
      <a href="/employer-dashboard.html" class="btn btn--ghost btn--sm">Dashboard</a>
      <button id="logout-btn" class="btn btn--outline btn--sm">Logout</button>
    `;
  }

  // Mobile versions of action buttons (larger, no --sm)
  const mobileActions = actions
    .replace(/btn--ghost btn--sm/g, 'btn--ghost')
    .replace(/btn--primary btn--sm/g, 'btn--primary')
    .replace(/btn--outline btn--sm/g, 'btn--outline')
    .replace(/id="logout-btn"/g, 'id="logout-btn-mobile"');

  nav.innerHTML = `
    <nav class="navbar">
      <div class="container navbar__inner">
        <a href="/index.html" class="navbar__brand">Uni<span>Gig</span></a>
        <div class="navbar__links" id="nav-links">
          ${links}
          <div class="navbar__mobile-actions">${mobileActions}</div>
        </div>
        <div class="navbar__actions">
          <button class="theme-toggle" id="theme-toggle" aria-label="Toggle dark mode">
            <!-- moon icon on the left (visible in light mode) -->
            <svg class="icon-moon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
            <!-- sun icon on the right (visible in dark mode) -->
            <svg class="icon-sun" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1"  x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22"  y1="4.22"  x2="5.64"  y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1"  y1="12" x2="3"  y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22"  y1="19.78" x2="5.64"  y2="18.36"/>
              <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22"/>
            </svg>
          </button>
          <div class="navbar__action-btns">${actions}</div>
          <button class="navbar__hamburger" id="hamburger" aria-label="Toggle menu" aria-expanded="false">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
    </nav>
  `;

  // Highlight active link
  const path = window.location.pathname.split('/').pop() || 'index.html';
  nav.querySelectorAll('.navbar__links a').forEach(a => {
    if (a.getAttribute('href') === `/${path}`) a.classList.add('active');
  });

  // Theme toggle
  document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);

  // Logout (desktop + mobile) — show spinner before navigating
  function handleLogout() {
    showPageSpinner();
    setTimeout(logout, 150);
  }
  document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
  document.getElementById('logout-btn-mobile')?.addEventListener('click', handleLogout);

  // Hamburger
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('nav-links');

  function closeMenu() {
    navLinks.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
  }

  hamburger?.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    hamburger.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', String(open));
  });

  // Close menu when any link or button inside the dropdown is clicked
  navLinks?.addEventListener('click', e => {
    if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON') {
      closeMenu();
    }
  });

  // Close menu when clicking outside
  document.addEventListener('click', e => {
    if (!nav.contains(e.target)) closeMenu();
  });
}

// ── Toasts ────────────────────────────────────────────────────
let toastContainer = null;

function getToastContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

/**
 * @param {string} message
 * @param {'success'|'error'|'warning'|'info'} type
 */
export function showToast(message, type = 'info') {
  const container = getToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  toast.innerHTML = `<span>${icons[type] || ''}</span><span class="toast__msg">${escHtml(message)}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// ── Modal ─────────────────────────────────────────────────────
/**
 * Show a confirm modal and return a promise resolving true/false.
 */
export function showConfirm(title, message) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <h2 id="modal-title">${escHtml(title)}</h2>
        <p>${escHtml(message)}</p>
        <div class="modal__actions">
          <button class="btn btn--ghost" id="modal-cancel">Cancel</button>
          <button class="btn btn--primary" id="modal-confirm">Confirm</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('#modal-confirm').addEventListener('click', () => {
      overlay.remove(); resolve(true);
    });
    overlay.querySelector('#modal-cancel').addEventListener('click', () => {
      overlay.remove(); resolve(false);
    });
    overlay.addEventListener('click', e => {
      if (e.target === overlay) { overlay.remove(); resolve(false); }
    });
  });
}

// ── Skeletons ─────────────────────────────────────────────────
/** Create n skeleton job cards */
export function renderSkeletons(container, count = 6) {
  container.innerHTML = Array.from({ length: count }).map(() => `
    <div class="card">
      <div class="card__body">
        <div class="skeleton" style="height:14px;width:60%;margin-bottom:8px"></div>
        <div class="skeleton" style="height:20px;width:85%;margin-bottom:6px"></div>
        <div class="skeleton" style="height:14px;width:50%"></div>
        <div style="display:flex;gap:8px;margin-top:16px">
          <div class="skeleton" style="height:12px;width:80px"></div>
          <div class="skeleton" style="height:12px;width:80px"></div>
        </div>
      </div>
    </div>
  `).join('');
}

// ── Job card ──────────────────────────────────────────────────
export function jobCardHTML(job) {
  return `
    <article class="card job-card fade-up" role="link" tabindex="0"
             data-id="${job.id}"
             onclick="location.href='/job.html?id=${job.id}'"
             onkeydown="if(event.key==='Enter')location.href='/job.html?id=${job.id}'">
      <div class="card__body">
        <div class="job-card__category">${escHtml(job.category)}</div>
        <h3 class="job-card__title">${escHtml(job.title)}</h3>
        <p class="job-card__employer">${escHtml(job.employer_name)}</p>
        <div class="job-card__meta">
          <span>📍 ${escHtml(job.location)}</span>
          <span>💰 $${Number(job.pay_amount).toFixed(2)} / ${escHtml(job.pay_type)}</span>
          ${job.schedule_text ? `<span>🕐 ${escHtml(job.schedule_text)}</span>` : ''}
        </div>
      </div>
      <div class="card__footer">
        <span class="badge badge--${job.status}">${job.status}</span>
        <span class="text-muted" style="font-size:var(--fs-xs);margin-left:auto">${timeAgo(job.created_at)}</span>
      </div>
    </article>
  `;
}

// ── Star display ──────────────────────────────────────────────
export function renderStars(rating) {
  const r = Math.round(Number(rating));
  return '★'.repeat(r) + '☆'.repeat(5 - r);
}

// ── Helpers ───────────────────────────────────────────────────
export function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30)  return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function formatPay(amount, type) {
  return `$${Number(amount).toFixed(2)} / ${type}`;
}

/** Set all named form fields from an object */
export function populateForm(form, data) {
  Object.entries(data).forEach(([key, val]) => {
    const el = form.elements[key];
    if (!el) return;
    if (el.type === 'checkbox') el.checked = Boolean(val);
    else el.value = val ?? '';
  });
}

/** Read form as plain object */
export function readForm(form) {
  const fd = new FormData(form);
  const obj = {};
  fd.forEach((v, k) => { obj[k] = v; });
  return obj;
}

/** Show/hide a loading overlay on a button */
export function setLoading(btn, loading) {
  btn.disabled = loading;
  btn.classList.toggle('btn--loading', loading);
}

// ── Page spinner helpers ─────────────────────────────────────
export function showPageSpinner() {
  document.getElementById('page-spinner')?.classList.add('active');
}
export function hidePageSpinner() {
  document.getElementById('page-spinner')?.classList.remove('active');
}

/** Init page: theme + navbar + spinner overlay */
export function initPage() {
  initTheme();
  // Inject the spinner overlay once
  if (!document.getElementById('page-spinner')) {
    const el = document.createElement('div');
    el.id = 'page-spinner';
    el.innerHTML = '<div class="spinner-ring"></div>';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-label', 'Loading');
    document.body.appendChild(el);
  }
  renderNavbar();
}
