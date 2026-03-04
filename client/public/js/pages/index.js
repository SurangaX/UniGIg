/**
 * pages/index.js – Landing page: search redirect + recent jobs
 */
import api from '../api.js';
import { initPage, renderSkeletons, jobCardHTML, showToast } from '../ui.js';

initPage();

// ── Hero search – redirect to jobs.html with query ────────────
const searchForm  = document.getElementById('hero-search-form');
const searchInput = document.getElementById('hero-search-input');

function doSearch() {
  const q = (searchInput?.value || '').trim();
  location.href = q ? `/search.html?search=${encodeURIComponent(q)}` : '/search.html';
}

searchForm?.addEventListener('submit', e => {
  e.preventDefault();
  doSearch();
});

// Also trigger on Enter key directly on the input
searchInput?.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    doSearch();
  }
});

// ── Recently Added Jobs ───────────────────────────────────────
const grid = document.getElementById('recent-jobs-grid');

async function loadRecentJobs() {
  renderSkeletons(grid, 6);
  try {
    const jobs = await api.get('/jobs');
    const recent = jobs.slice(0, 6);
    if (!recent.length) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <h3>No jobs yet</h3>
          <p>Check back soon – new gigs are posted daily!</p>
        </div>`;
      return;
    }
    grid.innerHTML = recent.map(jobCardHTML).join('');
  } catch (err) {
    showToast(err.message, 'error');
    grid.innerHTML = '<p class="text-muted text-center" style="grid-column:1/-1">Failed to load jobs.</p>';
  }
}

loadRecentJobs();
