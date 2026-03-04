/**
 * pages/employer-jobs.js
 */
import api      from '../api.js';
import { requireAuth } from '../auth.js';
import { initPage, showToast, escHtml, timeAgo, formatPay, showConfirm } from '../ui.js';

initPage();
const user = requireAuth('EMPLOYER');
if (!user) throw new Error('redirect');

async function load() {
  const container = document.getElementById('jobs-list');
  container.innerHTML = '<p class="text-muted">Loading…</p>';
  try {
    const jobs = await api.get('/employer/jobs');
    if (!jobs.length) {
      container.innerHTML = `
        <div class="empty-state">
          <h3>No jobs posted yet</h3>
          <p><a href="/employer-new-job.html">Post your first job →</a></p>
        </div>`;
      return;
    }
    container.innerHTML = jobs.map(j => `
      <div class="card fade-up" style="margin-bottom:var(--sp-4)" id="job-${j.id}">
        <div class="card__body">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:var(--sp-4);flex-wrap:wrap">
            <div>
              <div style="font-size:var(--fs-md);font-weight:700">${escHtml(j.title)}</div>
              <div class="text-muted" style="font-size:var(--fs-sm)">
                ${escHtml(j.category)} · ${escHtml(j.location)} · ${formatPay(j.pay_amount, j.pay_type)}
              </div>
              <div class="text-muted" style="font-size:var(--fs-xs)">${j.application_count} applicants · ${timeAgo(j.created_at)}</div>
            </div>
            <span class="badge badge--${j.status}">${j.status}</span>
          </div>
        </div>
        <div class="card__footer">
          <a href="/employer-applicants.html?id=${j.id}" class="btn btn--sm btn--outline">View Applicants</a>
          ${j.status === 'open' ? `<button class="btn btn--sm btn--danger close-btn" data-id="${j.id}">Close Job</button>` : ''}
        </div>
      </div>
    `).join('');

    // Close job handlers
    container.querySelectorAll('.close-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const confirmed = await showConfirm('Close Job', 'Are you sure you want to close this job? No more applications will be accepted.');
        if (!confirmed) return;
        try {
          await api.patch(`/jobs/${btn.dataset.id}/close`);
          showToast('Job closed.', 'success');
          load();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    });

  } catch (err) {
    showToast(err.message, 'error');
    container.innerHTML = '<p class="text-muted">Failed to load jobs.</p>';
  }
}

load();
