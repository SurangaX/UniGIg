/**
 * pages/student-dashboard.js
 */
import api      from '../api.js';
import { requireAuth, logout } from '../auth.js';
import { initPage, showToast, escHtml, formatPay, timeAgo, renderStars, showConfirm, setLoading } from '../ui.js';

initPage();
const user = requireAuth('STUDENT');
if (!user) throw new Error('redirect');

// Populate sidebar
document.getElementById('sidebar-avatar').textContent = user.name[0].toUpperCase();
document.getElementById('sidebar-name').textContent   = user.name;
document.getElementById('sidebar-uni').textContent    = user.university_or_business || '';

async function load() {
  try {
    const [apps, reviewsData] = await Promise.all([
      api.get('/student/applications'),
      api.get(`/users/${user.id}/reviews`),
    ]);

    // Stats
    document.getElementById('stat-applications').textContent = apps.length;
    document.getElementById('stat-accepted').textContent     = apps.filter(a => a.status === 'accepted').length;
    document.getElementById('stat-rating').textContent       =
      reviewsData.average_rating ? Number(reviewsData.average_rating).toFixed(1) : '—';

    // Recent applications (latest 5)
    const recentContainer = document.getElementById('recent-apps');
    const recent = apps.slice(0, 5);
    if (!recent.length) {
      recentContainer.innerHTML = `<p class="text-muted">No applications yet. <a href="/jobs.html">Browse jobs →</a></p>`;
    } else {
      recentContainer.innerHTML = recent.map(a => `
        <div class="card" style="margin-bottom:var(--sp-3)">
          <div class="card__body" style="display:flex;align-items:center;gap:var(--sp-4);flex-wrap:wrap">
            <div style="flex:1">
              <div style="font-weight:700">${escHtml(a.job_title)}</div>
              <div class="text-muted" style="font-size:var(--fs-sm)">${escHtml(a.employer_name)} · ${escHtml(a.location)}</div>
              <div class="text-muted" style="font-size:var(--fs-xs)">${timeAgo(a.created_at)}</div>
            </div>
            <span class="badge badge--${a.status}">${a.status}</span>
            ${a.status === 'accepted' ? `<a href="/review.html?jobId=${a.job_id}&toUserId=${a.employer_id}" class="btn btn--sm btn--outline">Leave Review</a>` : ''}
          </div>
        </div>
      `).join('');
    }

    // Recent reviews received
    const reviewsContainer = document.getElementById('reviews-list');
    if (!reviewsData.reviews.length) {
      reviewsContainer.innerHTML = `<p class="text-muted">No reviews yet.</p>`;
    } else {
      reviewsContainer.innerHTML = reviewsData.reviews.slice(0, 3).map(r => `
        <div class="review-card">
          <div class="review-card__header">
            <span class="stars">${renderStars(r.rating)}</span>
            <span class="review-card__author">${escHtml(r.author_name)}</span>
            <span class="review-card__date">${timeAgo(r.created_at)}</span>
          </div>
          ${r.comment ? `<p class="review-card__comment">${escHtml(r.comment)}</p>` : ''}
        </div>
      `).join('');
    }

  } catch (err) {
    showToast(err.message, 'error');
  }
}

load();

// ── Account Settings ──────────────────────────────────────────
const editModal   = document.getElementById('edit-account-modal');
const editForm    = document.getElementById('edit-account-form');
const editError   = document.getElementById('edit-error');
const editSubmit  = document.getElementById('edit-submit');

function openEditModal() {
  const u = api.getUser();
  document.getElementById('edit-name').value       = u.name || '';
  document.getElementById('edit-email').value      = u.email || '';
  document.getElementById('edit-university').value = u.university_or_business || '';
  document.getElementById('edit-skills').value     = (u.skills || []).join(', ');
  document.getElementById('edit-current-password').value = '';
  document.getElementById('edit-new-password').value     = '';
  editError.style.display = 'none';
  editModal.classList.remove('hidden');
}

function closeEditModal() {
  editModal.classList.add('hidden');
}

document.getElementById('btn-edit-account').addEventListener('click', openEditModal);
document.getElementById('edit-cancel').addEventListener('click', closeEditModal);
editModal.addEventListener('click', e => { if (e.target === editModal) closeEditModal(); });

editForm.addEventListener('submit', async e => {
  e.preventDefault();
  editError.style.display = 'none';

  const name            = document.getElementById('edit-name').value.trim();
  const email           = document.getElementById('edit-email').value.trim();
  const university      = document.getElementById('edit-university').value.trim();
  const skillsRaw       = document.getElementById('edit-skills').value;
  const currentPassword = document.getElementById('edit-current-password').value;
  const newPassword     = document.getElementById('edit-new-password').value;

  if (!name) { editError.textContent = 'Name is required.'; editError.style.display = 'block'; return; }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    editError.textContent = 'Please enter a valid email address.';
    editError.style.display = 'block'; return;
  }
  if (newPassword && !currentPassword) {
    editError.textContent = 'Enter your current password to set a new one.';
    editError.style.display = 'block'; return;
  }

  const skills = skillsRaw ? skillsRaw.split(',').map(s => s.trim()).filter(Boolean) : [];
  const payload = { name, email, university_or_business: university, skills };
  if (newPassword) { payload.current_password = currentPassword; payload.password = newPassword; }

  setLoading(editSubmit, true);
  try {
    const updated = await api.put('/users/me', payload);
    api.setUser({ ...api.getUser(), ...updated });
    document.getElementById('sidebar-name').textContent  = updated.name;
    document.getElementById('sidebar-avatar').textContent = updated.name[0].toUpperCase();
    document.getElementById('sidebar-uni').textContent   = updated.university_or_business || '';
    showToast('Account updated successfully!', 'success');
    closeEditModal();
  } catch (err) {
    editError.textContent   = err.message || 'Failed to update account.';
    editError.style.display = 'block';
  } finally {
    setLoading(editSubmit, false);
  }
});

document.getElementById('btn-delete-account').addEventListener('click', async () => {
  const confirmed = await showConfirm(
    'Delete Account',
    'This will permanently delete your account and all your data. This action cannot be undone. Are you sure?'
  );
  if (!confirmed) return;

  // Ask for password to confirm
  const password = window.prompt('Enter your password to confirm deletion:');
  if (!password) return;

  try {
    await api.delete('/users/me', { password });
    api.removeToken();
    showToast('Your account has been deleted.', 'success');
    setTimeout(() => { window.location.href = '/index.html'; }, 800);
  } catch (err) {
    showToast(err.message || 'Failed to delete account.', 'error');
  }
});
