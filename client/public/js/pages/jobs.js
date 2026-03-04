/**
 * pages/jobs.js – Job listing with filters
 */
import api       from '../api.js';
import { initPage, renderSkeletons, jobCardHTML, showToast } from '../ui.js';

initPage();

const grid        = document.getElementById('jobs-grid');
const count       = document.getElementById('jobs-count');
const form        = document.getElementById('filter-form');
const filterPanel = document.querySelector('.filter-panel');

// ── Pre-fill from URL params FIRST (before attaching listeners) ──────
// e.g. arriving from the homepage search bar: /jobs.html?search=barista
const _urlParams = new URLSearchParams(window.location.search);
const _urlSearch   = _urlParams.get('search');
const _urlCategory = _urlParams.get('category');
const _urlLocation = _urlParams.get('location');
if (_urlSearch)   document.getElementById('f-search').value   = _urlSearch;
if (_urlCategory) document.getElementById('f-category').value = _urlCategory;
if (_urlLocation) document.getElementById('f-location').value = _urlLocation;

// On mobile, open filter panel so the pre-filled search is visible
if ((_urlSearch || _urlCategory || _urlLocation) && window.innerWidth <= 600) {
  filterPanel?.classList.add('open');
}

// ── Mobile filter toggle ──────────────────────────────────────────────
if (filterPanel) {
  filterPanel.querySelector('h2')?.addEventListener('click', () => {
    if (window.innerWidth <= 600) filterPanel.classList.toggle('open');
  });
}

let debounceTimer;

// ── Sync the URL bar so the current filters are bookmarkable ──────────
function syncURL() {
  const p = new URLSearchParams();
  const s = document.getElementById('f-search').value.trim();
  const c = document.getElementById('f-category').value;
  const l = document.getElementById('f-location').value.trim();
  const mn = document.getElementById('f-pay-min').value;
  const mx = document.getElementById('f-pay-max').value;
  if (s)  p.set('search',   s);
  if (c)  p.set('category', c);
  if (l)  p.set('location', l);
  if (mn) p.set('payMin',   mn);
  if (mx) p.set('payMax',   mx);
  const qs = p.toString();
  history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
}

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

  syncURL();
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

// ── Event listeners ───────────────────────────────────────────────────
document.getElementById('f-search').addEventListener('input', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(loadJobs, 350);
});

form.addEventListener('change', loadJobs);
form.addEventListener('submit', e => {
  e.preventDefault();
  clearTimeout(debounceTimer);
  loadJobs();
  if (window.innerWidth <= 600) filterPanel?.classList.remove('open');
});

document.getElementById('clear-filters').addEventListener('click', () => {
  form.reset();
  history.replaceState(null, '', window.location.pathname);
  loadJobs();
});

// ── Initial load ──────────────────────────────────────────────────────
loadJobs();
