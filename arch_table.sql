-- ============================================================
-- NARAYANI TRADERS + HARIOM STUDIO
-- Architecture CRM Tables
-- Run in Supabase SQL Editor
-- ============================================================


-- ── 1. CLIENTS ───────────────────────────────────────────────

CREATE TABLE arch_clients (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  phone         TEXT NOT NULL,
  email         TEXT,
  address       TEXT,
  city          TEXT,
  state         TEXT,
  gstin         TEXT,
  notes         TEXT,                        -- referral source, personal notes
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);


-- ── 2. PROJECTS ──────────────────────────────────────────────

CREATE TABLE arch_projects (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id           UUID NOT NULL REFERENCES arch_clients(id),

  title               TEXT NOT NULL,
  project_number      TEXT UNIQUE NOT NULL,  -- PROJ-2024-001 (auto from app)

  type                TEXT NOT NULL
                        CHECK (type IN (
                          'residential',
                          'commercial',
                          'interior',
                          'visualization_only',
                          'renovation'
                        )),

  location            TEXT,                  -- site address
  city                TEXT,
  state               TEXT,

  area_sqft           NUMERIC(10,2),
  rate_per_sqft       NUMERIC(10,2),
  base_fee            NUMERIC(10,2),         -- area × rate (auto-calc in app)
  agreed_fee          NUMERIC(10,2),         -- final negotiated number

  status              TEXT NOT NULL DEFAULT 'inquiry'
                        CHECK (status IN (
                          'inquiry',
                          'quoted',
                          'active',
                          'on_hold',
                          'completed',
                          'cancelled'
                        )),

  start_date          DATE,
  estimated_end_date  DATE,
  actual_end_date     DATE,

  scope_notes         TEXT,                  -- client brief, visible on docs
  internal_notes      TEXT,                  -- private, never on documents

  is_published        BOOLEAN DEFAULT FALSE, -- push to public portfolio

  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);


-- ── 3. PROJECT SERVICES ──────────────────────────────────────
-- Which services are included in this project
-- Created automatically when project is created
-- Owner toggles on/off per project

CREATE TABLE arch_project_services (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES arch_projects(id) ON DELETE CASCADE,

  service_type    TEXT NOT NULL
                    CHECK (service_type IN (
                      'design_drawings',
                      'visualization_3d',
                      'construction_supervision',
                      'interior_design',
                      'renovation'
                    )),

  is_included     BOOLEAN DEFAULT TRUE,
  fee_for_service NUMERIC(10,2),             -- fee allocated to this service
  notes           TEXT,                      -- e.g. "exterior only, no interior"

  created_at      TIMESTAMPTZ DEFAULT NOW()
);


-- ── 4. PROJECT PHASES ────────────────────────────────────────
-- Individual work phases within each service
-- Can be removed if client doesn't need them

CREATE TABLE arch_project_phases (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES arch_projects(id) ON DELETE CASCADE,
  service_id      UUID NOT NULL REFERENCES arch_project_services(id) ON DELETE CASCADE,

  name            TEXT NOT NULL,             -- "Concept Floor Plan", "Foundation"
  description     TEXT,
  phase_order     INTEGER NOT NULL,          -- sequence within service

  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN (
                      'pending',
                      'in_progress',
                      'review',
                      'revision',
                      'completed'
                    )),

  is_included     BOOLEAN DEFAULT TRUE,      -- false = removed from scope

  started_at      DATE,
  completed_at    DATE,
  notes           TEXT,                      -- revision notes, client feedback

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);


-- ── 5. PROJECT EXTRAS ────────────────────────────────────────
-- Scope changes mid-project
-- Additions, removals, extra revisions
-- Every change logged here with fee impact

CREATE TABLE arch_project_extras (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID NOT NULL REFERENCES arch_projects(id) ON DELETE CASCADE,

  type                TEXT NOT NULL
                        CHECK (type IN (
                          'addition',    -- client asked for extra work
                          'removal',     -- client removed something
                          'revision'     -- extra revision beyond agreed rounds
                        )),

  description         TEXT NOT NULL,         -- "Kitchen render added"
  fee_impact          NUMERIC(10,2) DEFAULT 0,
                                             -- positive = extra charge
                                             -- negative = deduction
                                             -- zero = no financial impact

  approved_by_client  BOOLEAN DEFAULT FALSE,
  date                DATE NOT NULL DEFAULT CURRENT_DATE,
  notes               TEXT,

  created_at          TIMESTAMPTZ DEFAULT NOW()
);


-- ── 6. PROJECT PAYMENTS ──────────────────────────────────────
-- All payments received for a project
-- Optionally linked to a specific phase

CREATE TABLE arch_project_payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES arch_projects(id) ON DELETE CASCADE,
  phase_id        UUID REFERENCES arch_project_phases(id),
                                             -- nullable: advance has no phase

  payment_number  TEXT UNIQUE NOT NULL,      -- PAY-2024-001 (auto from app)

  type            TEXT NOT NULL
                    CHECK (type IN (
                      'advance',
                      'milestone',
                      'final',
                      'extra'                -- payment for an extra/revision
                    )),

  amount          NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  method          TEXT NOT NULL
                    CHECK (method IN (
                      'cash',
                      'upi',
                      'bank_transfer',
                      'cheque'
                    )),

  reference       TEXT,                      -- UPI txn id, cheque number
  payment_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  note            TEXT,

  created_at      TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_arch_projects_client     ON arch_projects(client_id);
CREATE INDEX idx_arch_projects_status     ON arch_projects(status);
CREATE INDEX idx_arch_services_project    ON arch_project_services(project_id);
CREATE INDEX idx_arch_phases_project      ON arch_project_phases(project_id);
CREATE INDEX idx_arch_phases_service      ON arch_project_phases(service_id);
CREATE INDEX idx_arch_extras_project      ON arch_project_extras(project_id);
CREATE INDEX idx_arch_payments_project    ON arch_project_payments(project_id);


-- ============================================================
-- AUTO updated_at TRIGGER
-- Keeps updated_at fresh on every row update
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_arch_clients_updated
  BEFORE UPDATE ON arch_clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_arch_projects_updated
  BEFORE UPDATE ON arch_projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_arch_phases_updated
  BEFORE UPDATE ON arch_project_phases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- DEFAULT PHASE TEMPLATES
-- When a project service is created, these phases are
-- auto-inserted by the app. Listed here for reference.
-- ============================================================

-- design_drawings phases (in order):
--   1  Site measurement & survey
--   2  Concept floor plan
--   3  Final floor plan
--   4  Elevation drawings (front / side / back)
--   5  Section drawings
--   6  Electrical layout
--   7  Plumbing layout
--   8  Structural drawings

-- visualization_3d phases:
--   1  Exterior 3D render
--   2  Living room render
--   3  Master bedroom render
--   4  Kitchen render
--   5  Other interior renders
--   6  Walkthrough video

-- construction_supervision phases:
--   1  Foundation
--   2  Structure / RCC
--   3  Brickwork / masonry
--   4  Plaster
--   5  Flooring
--   6  Electrical & plumbing rough-in
--   7  Finishing & painting
--   8  Final handover & inspection

-- interior_design phases:
--   1  Space planning
--   2  Material & finish selection
--   3  Furniture layout
--   4  Lighting design
--   5  Final interior renders
--   6  Execution & supervision

-- renovation phases:
--   1  Site assessment
--   2  Demolition plan
--   3  New layout drawings
--   4  Material selection
--   5  Execution & supervision
--   6  Final inspection


-- ============================================================
-- FEE CALCULATION REFERENCE (done in app, not in DB)
-- ============================================================

-- base_fee          = area_sqft × rate_per_sqft
-- agreed_fee        = negotiated total (stored on project)

-- approved_extras   = SUM(fee_impact) FROM arch_project_extras
--                     WHERE project_id = ? AND approved_by_client = TRUE

-- final_total       = agreed_fee + approved_extras

-- pending_extras    = SUM(fee_impact) FROM arch_project_extras
--                     WHERE project_id = ? AND approved_by_client = FALSE

-- total_paid        = SUM(amount) FROM arch_project_payments
--                     WHERE project_id = ?

-- balance_due       = final_total - total_paid