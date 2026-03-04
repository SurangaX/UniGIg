/**
 * pages/student-dashboard.js
 */
import api      from '../api.js';
import { requireAuth } from '../auth.js';
import { initPage, showToast, escHtml, formatPay, timeAgo, renderStars } from '../ui.js';

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
