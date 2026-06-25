-- ============================================================
-- HARIOM STUDIO — Portfolio CRM
-- Clean schema: record-keeping + public curation
-- 7 tables, no workflow/status/phases
-- Run in Supabase SQL Editor
-- ============================================================


-- ── 1. CLIENTS ───────────────────────────────────────────────
-- People your brother has worked with.
-- A project must belong to a client.

CREATE TABLE arch_clients (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  phone       TEXT        NOT NULL,
  email       TEXT,
  city        TEXT,
  state       TEXT,
  gstin       TEXT,
  notes       TEXT,       -- referral source, personal notes, anything private
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);


-- ── 2. PROJECTS ──────────────────────────────────────────────
-- One row per completed project. Filled in one shot after handover.
-- No status, no phases — just the factual record.

CREATE TABLE arch_projects (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id           UUID        NOT NULL REFERENCES arch_clients(id),

  -- Identity
  title               TEXT        NOT NULL,
  type                TEXT        NOT NULL
                        CHECK (type IN (
                          'residential',
                          'commercial',
                          'interior',
                          'visualization_only',
                          'renovation',
                          'other'
                        )),

  -- Location
  city                TEXT,
  state               TEXT,

  -- Scale
  area_sqft           NUMERIC(10,2),
  floors              INTEGER,               -- total number of floors

  -- Scope summary (BHK-style, e.g. "3BHK", "4BHK + Study")
  configuration       TEXT,

  -- Finance
  rate_per_sqft       NUMERIC(10,2),
  agreed_fee          NUMERIC(10,2),         -- final negotiated number

  -- Dates (just record facts, no forecasting)
  year_completed      INTEGER,               -- e.g. 2024
  start_date          DATE,
  completion_date     DATE,

  -- Content
  description         TEXT,                  -- design approach, scope summary
  internal_notes      TEXT,                  -- private, never shown publicly
  client_testimonial  TEXT,                  -- optional quote from client

  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);


-- ── 3. PROJECT MEDIA ─────────────────────────────────────────
-- All photos/files attached to a project.
-- phase tag lets you label before/during/after without a workflow.

CREATE TABLE arch_project_media (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID        NOT NULL REFERENCES arch_projects(id) ON DELETE CASCADE,

  file_url    TEXT        NOT NULL,          -- Supabase Storage public URL
  public_id   TEXT,                          -- Storage path/key for deletion
  caption     TEXT,                          -- optional label per photo

  phase       TEXT        CHECK (phase IN (
                'before',
                'during',
                'after'
              )),                            -- nullable — just a tag, not a workflow

  sort_order  INTEGER     DEFAULT 0,         -- order within the project media pool

  created_at  TIMESTAMPTZ DEFAULT NOW()
);


-- ── 4. PROJECT EXTRAS ────────────────────────────────────────
-- Scope changes after the project was agreed.
-- Additions, removals, extra revisions — each with a fee impact.

CREATE TABLE arch_project_extras (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID        NOT NULL REFERENCES arch_projects(id) ON DELETE CASCADE,

  type                TEXT        NOT NULL
                        CHECK (type IN (
                          'addition',    -- client asked for extra work
                          'removal',     -- scope item removed
                          'revision'     -- extra revision beyond agreed rounds
                        )),

  description         TEXT        NOT NULL,  -- e.g. "Added kitchen 3D render"
  fee_impact          NUMERIC(10,2) DEFAULT 0,
                                             -- positive = extra charge
                                             -- negative = deduction
                                             -- zero = no financial change

  approved_by_client  BOOLEAN     DEFAULT FALSE,
  date                DATE        NOT NULL DEFAULT CURRENT_DATE,
  notes               TEXT,

  created_at          TIMESTAMPTZ DEFAULT NOW()
);


-- ── 5. PROJECT PAYMENTS ──────────────────────────────────────
-- Every payment received for a project.
-- No phase_id link — payments hang directly off projects.

CREATE TABLE arch_project_payments (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID        NOT NULL REFERENCES arch_projects(id) ON DELETE CASCADE,

  type            TEXT        NOT NULL
                    CHECK (type IN (
                      'advance',
                      'milestone',
                      'final',
                      'extra'            -- payment for a specific extra/revision
                    )),

  amount          NUMERIC(10,2) NOT NULL CHECK (amount > 0),

  method          TEXT        NOT NULL
                    CHECK (method IN (
                      'cash',
                      'upi',
                      'bank_transfer',
                      'cheque'
                    )),

  reference       TEXT,                      -- UPI txn ID, cheque number, etc.
  payment_date    DATE        NOT NULL DEFAULT CURRENT_DATE,
  note            TEXT,                      -- e.g. "advance before site visit"

  created_at      TIMESTAMPTZ DEFAULT NOW()
);


-- ── 6. PUBLIC LISTINGS ───────────────────────────────────────
-- Curated subset of projects chosen for the public portfolio website.
-- One row per project maximum (unique constraint on project_id).
-- Your brother creates this separately, not at project-logging time.

CREATE TABLE arch_public_listings (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID        NOT NULL UNIQUE
                                    REFERENCES arch_projects(id) ON DELETE CASCADE,

  -- Public-facing content (can differ from internal project record)
  slug                TEXT        NOT NULL UNIQUE,   -- URL: /projects/modern-villa-jaipur
  public_title        TEXT,                          -- defaults to project.title in app
  public_description  TEXT,                          -- defaults to project.description in app

  cover_media_id      UUID        REFERENCES arch_project_media(id)
                                    ON DELETE SET NULL,
                                             -- which photo is the thumbnail/hero

  is_featured         BOOLEAN     DEFAULT FALSE,     -- show on homepage
  sort_order          INTEGER     DEFAULT 0,          -- order in /projects grid

  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);


-- ── 7. PUBLIC LISTING MEDIA ──────────────────────────────────
-- Which photos from arch_project_media appear on the public listing,
-- and in what order. A curated subset of the full media pool.

CREATE TABLE arch_public_listing_media (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  public_listing_id   UUID        NOT NULL REFERENCES arch_public_listings(id) ON DELETE CASCADE,
  media_id            UUID        NOT NULL REFERENCES arch_project_media(id)   ON DELETE CASCADE,

  sort_order          INTEGER     DEFAULT 0,

  UNIQUE (public_listing_id, media_id)       -- same photo can't appear twice in one listing
);


-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_projects_client         ON arch_projects(client_id);
CREATE INDEX idx_projects_type           ON arch_projects(type);
CREATE INDEX idx_projects_year           ON arch_projects(year_completed);

CREATE INDEX idx_media_project           ON arch_project_media(project_id);
CREATE INDEX idx_media_phase             ON arch_project_media(phase);

CREATE INDEX idx_extras_project          ON arch_project_extras(project_id);

CREATE INDEX idx_payments_project        ON arch_project_payments(project_id);
CREATE INDEX idx_payments_date           ON arch_project_payments(payment_date);

CREATE INDEX idx_listings_slug           ON arch_public_listings(slug);
CREATE INDEX idx_listings_featured       ON arch_public_listings(is_featured);

CREATE INDEX idx_listing_media_listing   ON arch_public_listing_media(public_listing_id);


-- ============================================================
-- AUTO updated_at TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_clients_updated
  BEFORE UPDATE ON arch_clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_projects_updated
  BEFORE UPDATE ON arch_projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_listings_updated
  BEFORE UPDATE ON arch_public_listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- FEE CALCULATION REFERENCE
-- All math happens in the app, not in the DB.
-- ============================================================

-- base_fee        = area_sqft × rate_per_sqft   (calculated in form, stored as agreed_fee)

-- approved_extras = SUM(fee_impact)
--                   FROM arch_project_extras
--                   WHERE project_id = ? AND approved_by_client = TRUE

-- final_total     = agreed_fee + approved_extras

-- total_paid      = SUM(amount)
--                   FROM arch_project_payments
--                   WHERE project_id = ?

-- balance_due     = final_total - total_paid


-- ============================================================
-- WHAT EACH TABLE IS FOR — QUICK REFERENCE
-- ============================================================

-- arch_clients              Who your brother works with
-- arch_projects             Every completed project, full internal record
-- arch_project_media        All photos attached to a project (before/during/after tag)
-- arch_project_extras       Scope changes + fee impact per project
-- arch_project_payments     Individual payments received per project
-- arch_public_listings      Curated public listing (one per project, created separately)
-- arch_public_listing_media Which photos + order shown on the public site

-- Tables intentionally NOT here (removed vs old schema):
-- arch_project_services     ← was phase/workflow tracking, dropped
-- arch_project_phases       ← was timeline tracking, dropped
-- status field              ← always "completed", useless
-- project_number            ← auto-numbering, not needed for record-keeping