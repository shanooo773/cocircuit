-- Run this once against your Neon (Postgres) database.
-- Neon dashboard → SQL Editor → paste → Run, or:
--   psql "$DATABASE_URL" -f schema.postgres.sql

CREATE TABLE IF NOT EXISTS admins (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS job_applications (
    id               SERIAL PRIMARY KEY,
    full_name        VARCHAR(150) NOT NULL,
    email            VARCHAR(190) NOT NULL,
    phone            VARCHAR(40)  NOT NULL,
    role_interest    VARCHAR(120) NOT NULL,
    experience       VARCHAR(40),
    linkedin_url     VARCHAR(255),
    message          TEXT,
    cv_url           TEXT         NOT NULL,   -- Vercel Blob URL (unguessable)
    cv_original_name VARCHAR(255) NOT NULL,   -- original filename, for display/download
    cv_size          INTEGER      NOT NULL,
    ip_address       VARCHAR(45),
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_applications_created_at
    ON job_applications (created_at DESC);
