/**
 * pages/register.js
 */
import { register, redirectIfLoggedIn } from '../auth.js';
import { initPage, showToast, setLoading } from '../ui.js';

initPage();
redirectIfLoggedIn();

document.getElementById('register-form').addEventListener('submit', async e => {
  e.preventDefault();
  const btn  = e.target.querySelector('button[type="submit"]');
  const role = document.querySelector('input[name="role"]:checked')?.value;

  if (!role) {
    showToast('Please select a role', 'error');
    return;
  }

  const skillsRaw = document.getElementById('skills').value;
  const skills = skillsRaw
    ? skillsRaw.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const payload = {
    role,
    name:                   document.getElementById('name').value.trim(),
    email:                  document.getElementById('email').value.trim(),
    password:               document.getElementById('password').value,
    university_or_business: document.getElementById('uni_biz').value.trim(),
    skills,
  };

  if (payload.password !== document.getElementById('confirm-password').value) {
    showToast('Passwords do not match', 'error');
    return;
  }

  setLoading(btn, true);
  try {
    const user = await register(payload);
    showToast(`Account created! Welcome, ${user.name}!`, 'success');
    setTimeout(() => {
      window.location.href = user.role === 'EMPLOYER'
        ? '/employer-dashboard.html'
        : '/student-dashboard.html';
    }, 700);
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    setLoading(btn, false);
  }
});
