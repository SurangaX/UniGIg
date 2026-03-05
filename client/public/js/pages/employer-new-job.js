/**
 * pages/employer-new-job.js
 */
import api      from '../api.js';
import { requireAuth } from '../auth.js';
import { initPage, showToast, setLoading } from '../ui.js';

initPage();
requireAuth('EMPLOYER');

document.getElementById('new-job-form').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  const pay_amount     = parseFloat(document.getElementById('pay_amount').value);
  const workers_needed = parseInt(document.getElementById('workers_needed').value, 10);

  if (isNaN(pay_amount) || pay_amount < 0) {
    showToast('Enter a valid pay amount', 'error');
    return;
  }
  if (isNaN(workers_needed) || workers_needed < 1) {
    showToast('Workers needed must be at least 1', 'error');
    return;
  }

  const payload = {
    title:          document.getElementById('title').value.trim(),
    category:       document.getElementById('category').value,
    description:    document.getElementById('description').value.trim(),
    location:       document.getElementById('location').value.trim(),
    pay_amount,
    pay_type:       document.getElementById('pay_type').value,
    schedule_text:  document.getElementById('schedule_text').value.trim() || null,
    workers_needed,
  };

  setLoading(btn, true);
  try {
    const job = await api.post('/jobs', payload);
    showToast('Job posted successfully!', 'success');
    setTimeout(() => {
      window.location.href = `/employer-applicants.html?id=${job.id}`;
    }, 700);
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    setLoading(btn, false);
  }
});
