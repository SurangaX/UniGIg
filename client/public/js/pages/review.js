/**
 * pages/review.js – Submit a review
 */
import api      from '../api.js';
import { requireAuth } from '../auth.js';
import { initPage, showToast, setLoading, escHtml, renderStars } from '../ui.js';

initPage();
const user = requireAuth();
if (!user) throw new Error('redirect');

const params   = new URLSearchParams(window.location.search);
const jobId    = params.get('jobId');
const toUserId = params.get('toUserId');

if (!jobId || !toUserId) window.location.href = '/index.html';

let selectedRating = 0;

// Star picker
const starBtns = document.querySelectorAll('.star-btn');
starBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    selectedRating = parseInt(btn.dataset.value, 10);
    updateStars();
  });
  btn.addEventListener('mouseenter', () => highlightStars(parseInt(btn.dataset.value, 10)));
  btn.addEventListener('mouseleave',  () => updateStars());
});

function highlightStars(n) {
  starBtns.forEach(b => {
    b.textContent = parseInt(b.dataset.value, 10) <= n ? '★' : '☆';
    b.style.color = parseInt(b.dataset.value, 10) <= n ? '#f59e0b' : 'var(--clr-border)';
  });
}

function updateStars() {
  highlightStars(selectedRating);
}

// Load target user info
async function loadTarget() {
  try {
    const target = await api.get(`/users/${toUserId}`);
    document.getElementById('review-target').textContent =
      `You are reviewing ${target.name} (${target.role === 'EMPLOYER' ? 'Employer' : 'Student'})`;
  } catch { /* ignore */ }
}

document.getElementById('review-form').addEventListener('submit', async e => {
  e.preventDefault();
  if (!selectedRating) {
    showToast('Please select a star rating', 'error');
    return;
  }
  const btn     = e.target.querySelector('button[type="submit"]');
  const comment = document.getElementById('comment').value.trim();

  setLoading(btn, true);
  try {
    await api.post('/reviews', { jobId, toUserId, rating: selectedRating, comment });
    showToast('Review submitted! Thank you.', 'success');
    document.getElementById('review-form').innerHTML =
      `<div class="alert alert--success">Your review has been saved.</div>`;
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    setLoading(btn, false);
  }
});

loadTarget();
