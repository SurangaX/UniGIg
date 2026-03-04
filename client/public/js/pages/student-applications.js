/**
 * pages/student-applications.js
 */
import api      from '../api.js';
import { requireAuth } from '../auth.js';
import { initPage, showToast, escHtml, formatPay, timeAgo } from '../ui.js';

initPage();
const user = requireAuth('STUDENT');
if (!user) throw new Error('redirect');

async function load() {
  const container = document.getElementById('apps-list');
  container.innerHTML = '<p class="text-muted">Loading…</p>';
  try {
    const apps = await api.get('/student/applications');
    if (!apps.length) {
      container.innerHTML = `
        <div class="empty-state">
          <h3>No applications yet</h3>
          <p><a href="/jobs.html">Browse available jobs →</a></p>
        </div>`;
      return;
    }
    container.innerHTML = apps.map(a => `
      <div class="card fade-up" style="margin-bottom:var(--sp-4)">
        <div class="card__body">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:var(--sp-4);flex-wrap:wrap">
            <div>
              <a href="/job.html?id=${a.job_id}" style="font-size:var(--fs-md);font-weight:700">${escHtml(a.job_title)}</a>
              <div class="text-muted" style="font-size:var(--fs-sm)">${escHtml(a.employer_name)} · ${escHtml(a.location)}</div>
              <div class="text-muted" style="font-size:var(--fs-sm)">Pay: ${formatPay(a.pay_amount, a.pay_type)}</div>
              ${a.message ? `<p style="font-size:var(--fs-sm);margin-top:var(--sp-3);color:var(--clr-text-muted)">"${escHtml(a.message)}"</p>` : ''}
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:var(--sp-2)">
              <span class="badge badge--${a.status}">${a.status}</span>
              <span class="text-muted" style="font-size:var(--fs-xs)">${timeAgo(a.created_at)}</span>
              ${a.status === 'accepted' ? `<a href="/review.html?jobId=${a.job_id}&toUserId=${a.employer_id}" class="btn btn--sm btn--outline">Review Employer</a>` : ''}
            </div>
          </div>
        </div>
      </div>
    `).join('');
  } catch (err) {
    showToast(err.message, 'error');
    container.innerHTML = '<p class="text-muted">Failed to load applications.</p>';
  }
}

load();
