/**
 * pages/search.js – Dedicated search results page
 * URL: /search.html?search=delivery&category=Technology&location=Remote
 */
import api from '../api.js';
import { initPage, renderSkeletons, showToast, escHtml, timeAgo } from '../ui.js';

initPage();

// ── DOM refs ────────────────────────────────────────────────────
const queryInput    = document.getElementById('s-query');
const locationInput = document.getElementById('s-location');
const payMinInput   = document.getElementById('s-pay-min');
const payMaxInput   = document.getElementById('s-pay-max');
const sortSelect    = document.getElementById('s-sort');
const chipsEl       = document.getElementById('category-chips');
const catSelect     = document.getElementById('category-select');
const resultsMeta   = document.getElementById('results-meta');
const grid          = document.getElementById('results-grid');
const clearBtn      = document.getElementById('clear-search');
const form          = document.getElementById('search-form');

// ── State ────────────────────────────────────────────────────────
let activeCategory = '';
let debounceTimer;

// ── Read URL params and pre-fill FIRST ─────────────────────────
(function hydrateFromURL() {
  const p = new URLSearchParams(window.location.search);
  if (p.get('search'))   queryInput.value    = p.get('search');
  if (p.get('location')) locationInput.value = p.get('location');
  if (p.get('payMin'))   payMinInput.value   = p.get('payMin');
  if (p.get('payMax'))   payMaxInput.value   = p.get('payMax');
  if (p.get('sort'))     sortSelect.value    = p.get('sort');
  if (p.get('category')) {
    activeCategory = p.get('category');
    chipsEl.querySelectorAll('.chip').forEach(c => {
      c.classList.toggle('chip--active', c.dataset.cat === activeCategory);
    });
    catSelect.value = activeCategory;
  }
})();

// ── Sync URL bar ────────────────────────────────────────────────
function syncURL() {
  const p = new URLSearchParams();
  const q  = queryInput.value.trim();
  const l  = locationInput.value.trim();
  const mn = payMinInput.value;
  const mx = payMaxInput.value;
  const s  = sortSelect.value;
  if (q)              p.set('search',   q);
  if (activeCategory) p.set('category', activeCategory);
  if (l)              p.set('location', l);
  if (mn)             p.set('payMin',   mn);
  if (mx)             p.set('payMax',   mx);
  if (s !== 'newest') p.set('sort',     s);
  history.replaceState(null, '', p.toString() ? `?${p.toString()}` : window.location.pathname);
}

// ── Build a result card ─────────────────────────────────────────
function resultCardHTML(job) {
  return `
    <article class="card job-card search-card fade-up" role="link" tabindex="0"
             data-id="${job.id}"
             onclick="location.href='/job.html?id=${job.id}'"
             onkeydown="if(event.key==='Enter')location.href='/job.html?id=${job.id}'">
      <div class="card__body">
        <div class="job-card__category">${escHtml(job.category)}</div>
        <h3 class="job-card__title">${escHtml(job.title)}</h3>
        <p class="job-card__employer">${escHtml(job.employer_name)}</p>
        <div class="job-card__meta">
          <span>📍 ${escHtml(job.location)}</span>
          <span>💰 $${Number(job.pay_amount).toFixed(2)} / ${escHtml(job.pay_type)}</span>
          ${job.schedule_text ? `<span>🕐 ${escHtml(job.schedule_text)}</span>` : ''}
        </div>
      </div>
      <div class="card__footer">
        <span class="badge badge--${job.status}">${job.status}</span>
        <span class="text-muted" style="font-size:var(--fs-xs);margin-left:auto">${timeAgo(job.created_at)}</span>
      </div>
    </article>
  `;
}

// ── Sort client-side ────────────────────────────────────────────
function sortJobs(jobs) {
  const s = sortSelect.value;
  if (s === 'pay_high') return [...jobs].sort((a, b) => b.pay_amount - a.pay_amount);
  if (s === 'pay_low')  return [...jobs].sort((a, b) => a.pay_amount - b.pay_amount);
  return jobs; // newest: server already returns DESC created_at
}

// ── Fetch + render ──────────────────────────────────────────────
async function doSearch() {
  const params = new URLSearchParams();
  const q  = queryInput.value.trim();
  const l  = locationInput.value.trim();
  const mn = payMinInput.value;
  const mx = payMaxInput.value;

  if (q)              params.set('search',   q);
  if (activeCategory) params.set('category', activeCategory);
  if (l)              params.set('location', l);
  if (mn)             params.set('payMin',   mn);
  if (mx)             params.set('payMax',   mx);

  // Update page title to reflect search
  document.title = q ? `"${q}" – Search – UniGig` : 'Search Jobs – UniGig';

  syncURL();
  renderSkeletons(grid, 6);
  resultsMeta.textContent = 'Searching…';

  try {
    let jobs = await api.get(`/jobs?${params.toString()}`);
    jobs = sortJobs(jobs);

    if (!jobs.length) {
      grid.innerHTML = `
        <div class="empty-state search-empty" style="grid-column:1/-1">
          <div class="search-empty__icon">🔍</div>
          <h3>No results for ${q ? `"${escHtml(q)}"` : 'your search'}</h3>
          <p>Try different keywords, a broader category, or remove pay filters.</p>
          <button class="btn btn--primary btn--sm" onclick="document.getElementById('clear-search').click()">
            Clear filters
          </button>
        </div>`;
      resultsMeta.textContent = '0 results';
      return;
    }

    const n = jobs.length;
    resultsMeta.innerHTML = `<strong>${n}</strong> result${n !== 1 ? 's' : ''}${q ? ` for <em>"${escHtml(q)}"</em>` : ''}`;
    grid.innerHTML = jobs.map(resultCardHTML).join('');
  } catch (err) {
    showToast(err.message, 'error');
    grid.innerHTML = '<p class="text-muted text-center" style="grid-column:1/-1">Failed to load results. Please try again.</p>';
    resultsMeta.textContent = '';
  }
}

// ── Category chip clicks ────────────────────────────────────────
chipsEl.addEventListener('click', e => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  chipsEl.querySelectorAll('.chip').forEach(c => c.classList.remove('chip--active'));
  chip.classList.add('chip--active');
  activeCategory = chip.dataset.cat;
  catSelect.value = activeCategory;
  doSearch();
});

// ── Category dropdown (mobile) ──────────────────────────────────
catSelect.addEventListener('change', () => {
  activeCategory = catSelect.value;
  chipsEl.querySelectorAll('.chip').forEach(c =>
    c.classList.toggle('chip--active', c.dataset.cat === activeCategory)
  );
  doSearch();
});

// ── Search form submit ──────────────────────────────────────────
form.addEventListener('submit', e => {
  e.preventDefault();
  clearTimeout(debounceTimer);
  doSearch();
});

// ── Live debounce on text inputs ────────────────────────────────
function debounce() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(doSearch, 380);
}
queryInput.addEventListener('input', debounce);
locationInput.addEventListener('input', debounce);
payMinInput.addEventListener('input', debounce);
payMaxInput.addEventListener('input', debounce);

// ── Sort change ─────────────────────────────────────────────────
sortSelect.addEventListener('change', doSearch);

// ── Clear all ───────────────────────────────────────────────────
clearBtn.addEventListener('click', () => {
  queryInput.value    = '';
  locationInput.value = '';
  payMinInput.value   = '';
  payMaxInput.value   = '';
  sortSelect.value    = 'newest';
  activeCategory      = '';
  catSelect.value     = '';
  chipsEl.querySelectorAll('.chip').forEach(c =>
    c.classList.toggle('chip--active', c.dataset.cat === '')
  );
  history.replaceState(null, '', window.location.pathname);
  doSearch();
  queryInput.focus();
});

// ── Initial search ──────────────────────────────────────────────
doSearch();

// Focus the input (after small delay so the browser doesn't scroll)
setTimeout(() => queryInput.focus(), 120);
