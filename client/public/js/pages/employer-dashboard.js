/**
 * pages/employer-dashboard.js
 */
import api      from '../api.js';
import { requireAuth, logout } from '../auth.js';
import { initPage, showToast, escHtml, timeAgo, renderStars, showConfirm, setLoading } from '../ui.js';

initPage();
const user = requireAuth('EMPLOYER');
if (!user) throw new Error('redirect');

document.getElementById('sidebar-avatar').textContent = user.name[0].toUpperCase();
document.getElementById('sidebar-name').textContent   = user.name;
document.getElementById('sidebar-biz').textContent    = user.university_or_business || '';

async function load() {
  try {
    const [jobs, reviewsData] = await Promise.all([
      api.get('/employer/jobs'),
      api.get(`/users/${user.id}/reviews`),
    ]);

    const openJobs   = jobs.filter(j => j.status === 'open').length;
    const totalApps  = jobs.reduce((s, j) => s + parseInt(j.application_count || 0, 10), 0);

    document.getElementById('stat-jobs').textContent  = jobs.length;
    document.getElementById('stat-open').textContent  = openJobs;
    document.getElementById('stat-apps').textContent  = totalApps;
    document.getElementById('stat-rating').textContent =
      reviewsData.average_rating ? Number(reviewsData.average_rating).toFixed(1) : '—';

    // Recent jobs
    const recentContainer = document.getElementById('recent-jobs');
    const recent = jobs.slice(0, 5);
    if (!recent.length) {
      recentContainer.innerHTML = `<p class="text-muted">No jobs posted yet. <a href="/employer-new-job.html">Post your first job →</a></p>`;
    } else {
      recentContainer.innerHTML = recent.map(j => `
        <div class="card" style="margin-bottom:var(--sp-3)">
          <div class="card__body" style="display:flex;align-items:center;gap:var(--sp-4);flex-wrap:wrap">
            <div style="flex:1">
              <a href="/employer-applicants.html?id=${j.id}" style="font-weight:700;font-size:var(--fs-md)">${escHtml(j.title)}</a>
              <div class="text-muted" style="font-size:var(--fs-sm)">${j.application_count} applicant${j.application_count != 1 ? 's' : ''} · ${timeAgo(j.created_at)}</div>
            </div>
            <span class="badge badge--${j.status}">${j.status}</span>
          </div>
        </div>
      `).join('');
    }

    // Reviews
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
const editModal  = document.getElementById('edit-account-modal');
const editForm   = document.getElementById('edit-account-form');
const editError  = document.getElementById('edit-error');
const editSubmit = document.getElementById('edit-submit');

function openEditModal() {
  const u = api.getUser();
  document.getElementById('edit-name').value     = u.name || '';
  document.getElementById('edit-email').value    = u.email || '';
  document.getElementById('edit-business').value = u.university_or_business || '';
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
  const business        = document.getElementById('edit-business').value.trim();
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

  const payload = { name, email, university_or_business: business };
  if (newPassword) { payload.current_password = currentPassword; payload.password = newPassword; }

  setLoading(editSubmit, true);
  try {
    const updated = await api.put('/users/me', payload);
    api.setUser({ ...api.getUser(), ...updated });
    document.getElementById('sidebar-name').textContent   = updated.name;
    document.getElementById('sidebar-avatar').textContent = updated.name[0].toUpperCase();
    document.getElementById('sidebar-biz').textContent    = updated.university_or_business || '';
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
