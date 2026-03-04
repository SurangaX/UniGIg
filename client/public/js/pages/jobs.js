/**
 * pages/jobs.js – Job listing with filters
 */
import api       from '../api.js';
import { initPage, renderSkeletons, jobCardHTML, showToast, escHtml } from '../ui.js';

initPage();

const grid   = document.getElementById('jobs-grid');
const count  = document.getElementById('jobs-count');
const form   = document.getElementById('filter-form');

// ── Mobile filter toggle ──────────────────────────────────────
// Default collapsed state is handled by CSS; JS only toggles .open
const filterPanel = document.querySelector('.filter-panel');
if (filterPanel) {
  const heading = filterPanel.querySelector('h2');
  heading?.addEventListener('click', () => {
    if (window.innerWidth <= 600) {
      filterPanel.classList.toggle('open');
    }
  });
}

let debounceTimer;

async function loadJobs() {
  const params = new URLSearchParams();
  const search   = document.getElementById('f-search').value.trim();
  const category = document.getElementById('f-category').value;
  const location = document.getElementById('f-location').value.trim();
  const payMin   = document.getElementById('f-pay-min').value;
  const payMax   = document.getElementById('f-pay-max').value;

  if (search)   params.set('search',   search);
  if (category) params.set('category', category);
  if (location) params.set('location', location);
  if (payMin)   params.set('payMin',   payMin);
  if (payMax)   params.set('payMax',   payMax);

  renderSkeletons(grid, 6);
  try {
    const jobs = await api.get(`/jobs?${params.toString()}`);
    if (!jobs.length) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <h3>No jobs found</h3>
          <p>Try adjusting your filters or check back later.</p>
        </div>`;
      count.textContent = '0 jobs found';
      return;
    }
    count.textContent = `${jobs.length} job${jobs.length !== 1 ? 's' : ''} found`;
    grid.innerHTML = jobs.map(jobCardHTML).join('');
  } catch (err) {
    showToast(err.message, 'error');
    grid.innerHTML = '<p class="text-muted text-center">Failed to load jobs.</p>';
  }
}

// Search with debounce
document.getElementById('f-search').addEventListener('input', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(loadJobs, 350);
});

form.addEventListener('change', loadJobs);
form.addEventListener('submit', e => {
  e.preventDefault();
  loadJobs();
  // Collapse filter panel on mobile after applying so grid is visible
  if (window.innerWidth <= 600) filterPanel?.classList.remove('open');
});
document.getElementById('clear-filters').addEventListener('click', () => {
  form.reset();
  loadJobs();
});

loadJobs();
