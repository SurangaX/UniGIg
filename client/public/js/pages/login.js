/**
 * pages/login.js
 */
import { login, redirectIfLoggedIn } from '../auth.js';
import { initPage, showToast, setLoading } from '../ui.js';

initPage();
redirectIfLoggedIn();

const form         = document.getElementById('login-form');
const inlineError  = document.getElementById('inline-error');
const signupBanner = document.getElementById('signup-banner');
const footerLink   = document.getElementById('auth-footer-link');

function clearError() {
  inlineError.style.display = 'none';
  inlineError.textContent   = '';
  document.getElementById('email').classList.remove('field-error');
  document.getElementById('password').classList.remove('field-error');
}

function showInlineError(msg) {
  inlineError.textContent   = msg;
  inlineError.style.display = 'block';
  // Shake the form
  form.classList.remove('shake');
  void form.offsetWidth; // reflow to restart animation
  form.classList.add('shake');
}

function revealSignupBanner() {
  signupBanner.style.display = 'flex';
  // Smoothly hide the plain footer link since banner replaces it
  if (footerLink) footerLink.style.display = 'none';
  signupBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  clearError();

  const btn   = form.querySelector('button[type="submit"]');
  const email = document.getElementById('email').value.trim();
  const pass  = document.getElementById('password').value;

  if (!email) {
    document.getElementById('email').classList.add('field-error');
    showInlineError('Please enter your email address.');
    return;
  }
  if (!pass) {
    document.getElementById('password').classList.add('field-error');
    showInlineError('Please enter your password.');
    return;
  }

  setLoading(btn, true);
  try {
    const user = await login(email, pass);
    // Hide any previously shown error/banner
    signupBanner.style.display = 'none';
    showToast(`Welcome back, ${user.name}! 👋`, 'success');
    setTimeout(() => {
      window.location.href = user.role === 'EMPLOYER'
        ? '/employer-dashboard.html'
        : '/student-dashboard.html';
    }, 600);
  } catch (err) {
    // 401 = wrong credentials – could be wrong password OR no account
    if (err.status === 401) {
      document.getElementById('email').classList.add('field-error');
      document.getElementById('password').classList.add('field-error');
      showInlineError('Incorrect email or password.');
      revealSignupBanner();
    } else {
      showInlineError(err.message || 'Something went wrong. Please try again.');
    }
  } finally {
    setLoading(btn, false);
  }

  // Hide banner again if user edits the email field
  document.getElementById('email').addEventListener('input', () => {
    signupBanner.style.display = 'none';
    if (footerLink) footerLink.style.display = '';
    clearError();
  }, { once: true });
});
