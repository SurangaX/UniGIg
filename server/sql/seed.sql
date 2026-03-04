-- UniGig Seed Data
-- Passwords are all: Password123!
-- bcrypt hash for "Password123!" (cost 10):
-- $2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.

-- Demo accounts
INSERT INTO users (id, role, name, email, password_hash, university_or_business, skills) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'STUDENT',  'Alice Student',   'alice@uni.edu',
   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
   'State University', ARRAY['JavaScript','Python','Design']),

  ('a0000000-0000-0000-0000-000000000002', 'STUDENT',  'Bob Learner',     'bob@uni.edu',
   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
   'City College', ARRAY['Marketing','Social Media']),

  ('b0000000-0000-0000-0000-000000000001', 'EMPLOYER', 'TechCorp HR',     'techcorp@biz.com',
   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
   'TechCorp Inc.', ARRAY[]::TEXT[]),

  ('b0000000-0000-0000-0000-000000000002', 'EMPLOYER', 'Campus Cafe',     'cafe@campus.com',
   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
   'Campus Cafe LLC', ARRAY[]::TEXT[]);

-- Demo jobs
INSERT INTO jobs (id, employer_id, title, category, description, location, pay_amount, pay_type, schedule_text, status) VALUES
  ('c0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000001',
   'Junior Web Developer', 'Technology',
   'Help build internal tools using React and Node.js. Great for students with coding experience.',
   'Remote', 18.00, 'hour', 'Flexible – 10-15 hrs/week', 'open'),

  ('c0000000-0000-0000-0000-000000000002',
   'b0000000-0000-0000-0000-000000000001',
   'Data Entry Specialist', 'Administration',
   'Enter and validate data in spreadsheets. Attention to detail required.',
   'Downtown Office', 14.00, 'hour', 'Mon-Wed 2pm-6pm', 'open'),

  ('c0000000-0000-0000-0000-000000000003',
   'b0000000-0000-0000-0000-000000000002',
   'Barista (Part-Time)', 'Food & Beverage',
   'Serve coffee and food, keep counter clean. Training provided.',
   'Campus Cafe, Main Campus', 13.50, 'hour', 'Weekends 8am-2pm', 'open'),

  ('c0000000-0000-0000-0000-000000000004',
   'b0000000-0000-0000-0000-000000000002',
   'Social Media Creator', 'Marketing',
   'Create short-form video and posts for our café Instagram and TikTok.',
   'Remote / On-site', 250.00, 'job', '2 posts per week', 'open');
