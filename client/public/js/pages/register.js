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

  const skillsRaw = role === 'STUDENT' ? document.getElementById('skills').value : '';
  const skills = skillsRaw
    ? skillsRaw.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const university_or_business = role === 'STUDENT'
    ? document.getElementById('university').value.trim()
    : document.getElementById('business_name').value.trim();

  const payload = {
    role,
    name:  document.getElementById('name').value.trim(),
    email: document.getElementById('email').value.trim(),
    nic:   document.getElementById('nic').value.trim(),
    password: document.getElementById('password').value,
    university_or_business,
    skills,
  };

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    showToast('Please enter a valid email address.', 'error');
    return;
  }

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
