/**
 * pages/job.js – Single job detail + apply
 */
import api    from '../api.js';
import { initPage, showToast, escHtml, formatPay, timeAgo, setLoading } from '../ui.js';

initPage();

const jobId = new URLSearchParams(window.location.search).get('id');
if (!jobId) window.location.href = '/jobs.html';

const user = api.getUser();

async function loadJob() {
  try {
    const job = await api.get(`/jobs/${jobId}`);
    renderJob(job);

    if (user?.role === 'STUDENT') {
      await checkExistingApplication(job);
    } else if (!user) {
      document.getElementById('apply-section').innerHTML = `
        <div class="alert">
          <a href="/login.html">Log in</a> or <a href="/register.html">register</a> as a student to apply.
        </div>`;
    } else if (user.role === 'EMPLOYER') {
      document.getElementById('apply-section').innerHTML = `
        <div class="alert">Employer accounts cannot apply to jobs.</div>`;
    }
  } catch (err) {
    document.getElementById('job-content').innerHTML =
      `<div class="empty-state"><h3>Job not found</h3><p>${escHtml(err.message)}</p></div>`;
  }
}

function renderJob(job) {
  document.title = `${job.title} – UniGig`;

  document.getElementById('job-category').textContent  = job.category;
  document.getElementById('job-title').textContent     = job.title;
  document.getElementById('job-employer').textContent  = job.employer_name;
  document.getElementById('job-location').textContent  = `📍 ${job.location}`;
  document.getElementById('job-pay').textContent       = formatPay(job.pay_amount, job.pay_type);
  document.getElementById('job-schedule').textContent  = job.schedule_text || '—';
  document.getElementById('job-status').className      = `badge badge--${job.status}`;
  document.getElementById('job-status').textContent    = job.status;
  document.getElementById('job-posted').textContent    = timeAgo(job.created_at);
  document.getElementById('job-description').textContent = job.description;
  document.getElementById('pay-display').innerHTML     =
    `<span class="pay-display">$${Number(job.pay_amount).toFixed(2)}<span> / ${job.pay_type}</span></span>`;
}

async function checkExistingApplication(job) {
  const section = document.getElementById('apply-section');

  if (job.status === 'closed') {
    section.innerHTML = `<div class="alert alert--warning">This job is no longer accepting applications.</div>`;
    return;
  }

  try {
    const apps = await api.get('/student/applications');
    const existing = apps.find(a => a.job_id === jobId);
    if (existing) {
      section.innerHTML = `
        <div class="alert alert--${existing.status === 'accepted' ? 'success' : existing.status === 'rejected' ? 'error' : ''}">
          You already applied – status: <strong>${existing.status}</strong>
        </div>`;
      return;
    }
  } catch { /* not logged in or network error */ }

  section.innerHTML = `
    <form id="apply-form" class="flex-col gap-4">
      <div class="form-group">
        <label for="msg">Cover message (optional)</label>
        <textarea id="msg" name="message" rows="4" placeholder="Tell the employer why you're a great fit…"></textarea>
      </div>
      <button type="submit" class="btn btn--primary btn--lg">Apply Now</button>
    </form>
  `;

  document.getElementById('apply-form').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    setLoading(btn, true);
    try {
      await api.post(`/jobs/${jobId}/apply`, { message: document.getElementById('msg').value });
      showToast('Application submitted!', 'success');
      section.innerHTML = `<div class="alert alert--success">Application submitted successfully!</div>`;
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(btn, false);
    }
  });
}

loadJob();
