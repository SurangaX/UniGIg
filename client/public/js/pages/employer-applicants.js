/**
 * pages/employer-applicants.js
 */
import api        from '../api.js';
import { requireAuth } from '../auth.js';
import { initPage, showToast, escHtml, timeAgo, showConfirm } from '../ui.js';

initPage();
requireAuth('EMPLOYER');

const jobId = new URLSearchParams(window.location.search).get('id');
if (!jobId) window.location.href = '/employer-jobs.html';

async function load() {
  const container = document.getElementById('applicants-list');
  container.innerHTML = '<p class="text-muted">Loading…</p>';
  try {
    // Load job info + applicants
    const [job, applicants] = await Promise.all([
      api.get(`/jobs/${jobId}`),
      api.get(`/employer/jobs/${jobId}/applicants`),
    ]);

    document.getElementById('job-title').textContent  = job.title;
    document.getElementById('job-status').className   = `badge badge--${job.status}`;
    document.getElementById('job-status').textContent = job.status;
    document.getElementById('app-count').textContent  = `${applicants.length} applicant${applicants.length !== 1 ? 's' : ''}`;

    if (!applicants.length) {
      container.innerHTML = `<div class="empty-state"><h3>No applications yet</h3></div>`;
      return;
    }

    container.innerHTML = applicants.map(a => `
      <div class="applicant-row fade-up" id="app-${a.id}">
        <div class="applicant-row__info">
          <div class="applicant-row__name">${escHtml(a.student_name)}</div>
          <div class="applicant-row__meta">${escHtml(a.student_email)} · ${escHtml(a.university_or_business || '—')}</div>
          ${a.skills?.length ? `
            <div class="applicant-row__skills">
              ${a.skills.map(s => `<span class="skill-tag">${escHtml(s)}</span>`).join('')}
            </div>` : ''}
          ${a.message ? `<p style="font-size:var(--fs-sm);margin-top:var(--sp-2);color:var(--clr-text-muted)">"${escHtml(a.message)}"</p>` : ''}
          <div class="text-muted" style="font-size:var(--fs-xs);margin-top:var(--sp-2)">${timeAgo(a.created_at)}</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:var(--sp-2)">
          <span class="badge badge--${a.status}">${a.status}</span>
          ${a.status === 'pending' && job.status === 'open' ? `
            <button class="btn btn--sm btn--success accept-btn" data-id="${a.id}" data-name="${escHtml(a.student_name)}">Accept</button>
            <button class="btn btn--sm btn--danger reject-btn" data-id="${a.id}" data-name="${escHtml(a.student_name)}">Reject</button>
          ` : ''}
          ${a.status === 'accepted' ? `
            <a href="/review.html?jobId=${jobId}&toUserId=${a.student_id}" class="btn btn--sm btn--outline">Review Student</a>
          ` : ''}
        </div>
      </div>
    `).join('');

    // Accept handlers
    container.querySelectorAll('.accept-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const confirmed = await showConfirm('Accept Applicant',
          `Accept ${btn.dataset.name}? This will close the job and reject all other pending applicants.`);
        if (!confirmed) return;
        await updateApplication(btn.dataset.id, 'accepted');
      });
    });

    // Reject handlers
    container.querySelectorAll('.reject-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const confirmed = await showConfirm('Reject Applicant', `Reject ${btn.dataset.name}?`);
        if (!confirmed) return;
        await updateApplication(btn.dataset.id, 'rejected');
      });
    });

  } catch (err) {
    showToast(err.message, 'error');
    container.innerHTML = '<p class="text-muted">Failed to load.</p>';
  }
}

async function updateApplication(appId, status) {
  try {
    await api.patch(`/applications/${appId}`, { status });
    showToast(`Application ${status}.`, status === 'accepted' ? 'success' : 'warning');
    load(); // reload to reflect changes
  } catch (err) {
    showToast(err.message, 'error');
  }
}

load();
