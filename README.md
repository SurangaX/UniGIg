# UniGig 🎓

> Uber-style part-time job platform for university students.  
> Employers post gigs → Students browse & apply → One gets accepted → Both leave reviews.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3 (custom properties, grid, flex, `clamp()`), Vanilla JS (ES Modules) |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Auth | JWT (access token) + bcrypt password hashing |

---

## Repository Structure

```
/
  client/
    public/          ← HTML pages
    css/
      base.css       ← tokens, reset, utilities, skeleton, animations
      components.css ← navbar, buttons, forms, cards, toasts, modals
      pages/         ← page-specific styles
    js/
      api.js         ← fetch wrapper + token helpers
      auth.js        ← login / register / logout / requireAuth
      ui.js          ← navbar, toasts, modals, skeletons, utilities
      pages/         ← page-specific logic (ES Modules)
  server/
    src/
      app.js         ← Express app
      db.js          ← pg Pool wrapper
      middleware/    ← auth, role, validate
      routes/        ← REST routes
      controllers/   ← business logic
    sql/
      schema.sql     ← DDL
      seed.sql       ← demo data
    .env.example
    package.json
  README.md
```

---

## Step-by-Step Setup

### Prerequisites

- **Node.js** ≥ 18
- **PostgreSQL** ≥ 14 running locally (or a cloud DB)
- A static file server (e.g. VS Code **Live Server** extension, `npx serve`, or `python -m http.server`)

---

### 1  Create the Database

```bash
# Connect to postgres and create the DB
psql -U postgres
```

```sql
CREATE DATABASE unigig;
\q
```

---

### 2  Run schema.sql + seed.sql

```bash
psql -U postgres -d unigig -f server/sql/schema.sql
psql -U postgres -d unigig -f server/sql/seed.sql
```

---

### 3  Configure Environment Variables

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:

```env
PORT=4000
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/unigig
JWT_SECRET=replace_me_with_a_long_random_secret
CLIENT_ORIGIN=http://localhost:5500
```

> `CLIENT_ORIGIN` must match the origin your static file server uses.  
> VS Code Live Server defaults to `http://localhost:5500`.

---

### 4  Install Server Dependencies & Start

```bash
cd server
npm install
npm run dev        # nodemon auto-restarts on changes
# or: npm start   # without nodemon
```

The API will be available at `http://localhost:4000`.

---

### 5  Serve the Client

**Option A – VS Code Live Server** (recommended)

1. Install the *Live Server* extension (`ritwickdey.liveserver`).
2. Right-click `client/public/index.html` → **Open with Live Server**.
3. Your browser opens at `http://localhost:5500/index.html`.

**Option B – `serve` (npm)**

```bash
npx serve client/public -p 5500
```

**Option C – Python**

```bash
cd client/public
python -m http.server 5500
```

---

### 6  Open the App

Navigate to `http://localhost:5500/index.html`.

---

## Demo Accounts (from seed.sql)

All passwords are: **`Password123!`**

| Role | Email | Name |
|------|-------|------|
| Student | `alice@uni.edu` | Alice Student |
| Student | `bob@uni.edu` | Bob Learner |
| Employer | `techcorp@biz.com` | TechCorp HR |
| Employer | `cafe@campus.com` | Campus Cafe |

---

## API Reference

### Auth

| Method | Path | Auth | Body |
|--------|------|------|------|
| POST | `/api/auth/register` | – | `role, name, email, password, university_or_business?, skills?[]` |
| POST | `/api/auth/login` | – | `email, password` → `{token, user}` |
| GET | `/api/auth/me` | ✓ | – |

### Jobs

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/api/jobs` | – | Query: `search, category, location, payMin, payMax` |
| GET | `/api/jobs/:id` | – | Closed jobs visible to owner only |
| POST | `/api/jobs` | EMPLOYER | Create job |
| PUT | `/api/jobs/:id` | EMPLOYER | Update own job |
| PATCH | `/api/jobs/:id/close` | EMPLOYER | Close own job |

### Applications

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/api/jobs/:id/apply` | STUDENT | `{message?}` |
| GET | `/api/student/applications` | STUDENT | List own applications |
| GET | `/api/employer/jobs/:id/applicants` | EMPLOYER | List applicants for own job |
| PATCH | `/api/applications/:id` | EMPLOYER | `{status: accepted|rejected}` – accepting auto-closes job |

### Reviews

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/api/reviews` | ✓ | `{jobId, toUserId, rating 1–5, comment?}` |
| GET | `/api/users/:id/reviews` | – | Returns reviews + average rating |

### Users

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/api/users/:id` | – | Public profile |
| PUT | `/api/users/me` | ✓ | Update own profile |
| GET | `/api/employer/jobs` | EMPLOYER | List own jobs with app counts |

---

## Key Business Rules

1. **Only EMPLOYER** can create/update/close their own jobs.  
2. **Only STUDENT** can apply to open jobs. One application per student per job.  
3. **Only one acceptance per job**: accepting sets job `status = 'closed'` and rejects all remaining pending applicants.  
4. **Reviews** are only allowed when an accepted application exists connecting both users on that job.

---

## Dark Mode

UniGig supports dark mode automatically via `prefers-color-scheme`. Toggle manually with the pill button in the navbar (state saved to `localStorage`).

---

## Security Notes

- All SQL queries use **parameterized placeholders** (`$1, $2, …`) – no string interpolation.
- JWT secret must be at least 32 random characters in production.
- Passwords are hashed with bcrypt (cost factor 10).
- CORS is restricted to `CLIENT_ORIGIN`.
- For production: use HTTPS, set stricter CORS, consider `httpOnly` cookies instead of `localStorage`.
"# UniGIg" 
