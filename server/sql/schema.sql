-- UniGig Database Schema
-- Run with: psql -U <user> -d <dbname> -f schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop tables in reverse dependency order for clean re-runs
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Enum-like check constraints are used instead of actual enums for flexibility

CREATE TABLE users (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role                  VARCHAR(10)  NOT NULL CHECK (role IN ('STUDENT','EMPLOYER')),
    name                  VARCHAR(120) NOT NULL,
    email                 VARCHAR(254) NOT NULL UNIQUE,
    password_hash         TEXT         NOT NULL,
    university_or_business VARCHAR(200),
    nic                   VARCHAR(20)  UNIQUE,
    skills                TEXT[]       DEFAULT '{}',
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE jobs (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employer_id   UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title         VARCHAR(200) NOT NULL,
    category      VARCHAR(100) NOT NULL,
    description   TEXT         NOT NULL,
    location      VARCHAR(200) NOT NULL,
    pay_amount    NUMERIC(10,2) NOT NULL CHECK (pay_amount >= 0),
    pay_type      VARCHAR(10)  NOT NULL CHECK (pay_type IN ('hour','day','job')),
    schedule_text VARCHAR(300),
    workers_needed SMALLINT    NOT NULL DEFAULT 1 CHECK (workers_needed >= 1),
    status        VARCHAR(10)  NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_jobs_employer ON jobs(employer_id);
CREATE INDEX idx_jobs_status   ON jobs(status);
CREATE INDEX idx_jobs_category ON jobs(category);

CREATE TABLE applications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id      UUID        NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    student_id  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    employer_id UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message     TEXT,
    status      VARCHAR(10) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_application UNIQUE (job_id, student_id)
);

CREATE INDEX idx_apps_job     ON applications(job_id);
CREATE INDEX idx_apps_student ON applications(student_id);

CREATE TABLE reviews (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id       UUID        NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    from_user_id UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating       SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment      TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_review UNIQUE (job_id, from_user_id, to_user_id)
);

CREATE INDEX idx_reviews_to_user ON reviews(to_user_id);
