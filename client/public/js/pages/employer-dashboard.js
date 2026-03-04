/**
 * pages/employer-dashboard.js
 */
import api      from '../api.js';
import { requireAuth } from '../auth.js';
import { initPage, showToast, escHtml, timeAgo, renderStars } from '../ui.js';

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
