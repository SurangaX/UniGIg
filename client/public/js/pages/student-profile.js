/**
 * pages/student-profile.js
 */
import api      from '../api.js';
import { requireAuth, refreshUser } from '../auth.js';
import { initPage, showToast, setLoading, escHtml } from '../ui.js';

initPage();
const user = requireAuth('STUDENT');
if (!user) throw new Error('redirect');

// Pre-fill form
document.getElementById('name').value    = user.name;
document.getElementById('uni').value     = user.university_or_business || '';
document.getElementById('skills').value  = (user.skills || []).join(', ');

document.getElementById('profile-form').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  const skillsRaw = document.getElementById('skills').value;
  const skills = skillsRaw ? skillsRaw.split(',').map(s => s.trim()).filter(Boolean) : [];

  setLoading(btn, true);
  try {
    await api.put('/users/me', {
      name:                   document.getElementById('name').value.trim(),
      university_or_business: document.getElementById('uni').value.trim(),
      skills,
    });
    await refreshUser();
    showToast('Profile updated!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    setLoading(btn, false);
  }
});
