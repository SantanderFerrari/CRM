require('dotenv').config();
const { query } = require('../db');

const migrations = [
  // ── ENUMS ──────────────────────────────────────────────────────────
  `
  DO $$ BEGIN
    CREATE TYPE leave_category AS ENUM (
      'ANNUAL_LEAVE',
      'SICK_LEAVE',
      'MATERNITY_LEAVE',
      'PATERNITY_LEAVE',
      'COMPASSIONATE_LEAVE'
    );
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  `,
  `
  DO $$ BEGIN
    CREATE TYPE leave_status AS ENUM (
      'PENDING',
      'APPROVED',
      'REJECTED',
      'CANCELLED'
    );
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  `,
  `
  DO $$ BEGIN
    CREATE TYPE funds_status AS ENUM (
      'DRAFT',
      'PENDING_SUPERVISOR',
      'PENDING_FINANCE',
      'APPROVED',
      'REJECTED'
    );
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  `,

  // ── LEAVE BALANCE (tracks accrued + used days per user per year) ───
  `
  CREATE TABLE IF NOT EXISTS leave_balances (
    balance_id      UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID        NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    year            INTEGER     NOT NULL,
    accrued_days    NUMERIC(5,2) NOT NULL DEFAULT 0,
    used_days       NUMERIC(5,2) NOT NULL DEFAULT 0,
    carried_forward NUMERIC(5,2) NOT NULL DEFAULT 0,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, year)
  );
  CREATE INDEX IF NOT EXISTS idx_leave_balance_user ON leave_balances(user_id);
  `,

  // ── LEAVE REQUESTS ─────────────────────────────────────────────────
  `
  CREATE TABLE IF NOT EXISTS leave_requests (
    leave_id          UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id           UUID           NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    category          leave_category NOT NULL,
    start_date        DATE           NOT NULL,
    end_date          DATE           NOT NULL,
    duty_resume_date  DATE           NOT NULL,
    days_requested    NUMERIC(5,2)   NOT NULL,
    reason            TEXT,
    status            leave_status   NOT NULL DEFAULT 'PENDING',
    reviewed_by       UUID           REFERENCES users(user_id) ON DELETE SET NULL,
    reviewed_at       TIMESTAMPTZ,
    review_notes      TEXT,
    overlap_flag      BOOLEAN        NOT NULL DEFAULT FALSE,
    sick_certificate  BOOLEAN        NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_leave_dates      CHECK (end_date >= start_date),
    CONSTRAINT chk_resume_date      CHECK (duty_resume_date > end_date),
    CONSTRAINT chk_days_positive    CHECK (days_requested > 0)
  );
  CREATE INDEX IF NOT EXISTS idx_leave_user   ON leave_requests(user_id);
  CREATE INDEX IF NOT EXISTS idx_leave_status ON leave_requests(status);
  `,

  // ── FUNDS REQUISITIONS ─────────────────────────────────────────────
  `
  CREATE TABLE IF NOT EXISTS funds_requisitions (
    requisition_id    UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    requisition_number VARCHAR(20) UNIQUE,
    requested_by      UUID         NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    purpose           TEXT         NOT NULL,
    category          VARCHAR(50)  NOT NULL,
    justification     TEXT         NOT NULL,
    amount_kes        NUMERIC(14,2) NOT NULL CHECK (amount_kes > 0),
    amount_words      VARCHAR(500) NOT NULL,
    department        VARCHAR(150),
    status            funds_status NOT NULL DEFAULT 'DRAFT',
    supervisor_id     UUID         REFERENCES users(user_id) ON DELETE SET NULL,
    supervisor_signed_at TIMESTAMPTZ,
    finance_id        UUID         REFERENCES users(user_id) ON DELETE SET NULL,
    finance_signed_at TIMESTAMPTZ,
    final_approver_id UUID         REFERENCES users(user_id) ON DELETE SET NULL,
    final_signed_at   TIMESTAMPTZ,
    rejection_reason  TEXT,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_funds_requested_by ON funds_requisitions(requested_by);
  CREATE INDEX IF NOT EXISTS idx_funds_status       ON funds_requisitions(status);
  `,

  // ── AUTO-GENERATE REQUISITION NUMBER ───────────────────────────────
  `
  CREATE OR REPLACE FUNCTION generate_requisition_number()
  RETURNS TRIGGER LANGUAGE plpgsql AS $$
  BEGIN
    NEW.requisition_number := 'REQ-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
      LPAD(NEXTVAL('requisition_seq')::TEXT, 4, '0');
    RETURN NEW;
  END;
  $$;

  CREATE SEQUENCE IF NOT EXISTS requisition_seq START 1;

  DROP TRIGGER IF EXISTS trg_requisition_number ON funds_requisitions;
  CREATE TRIGGER trg_requisition_number
    BEFORE INSERT ON funds_requisitions
    FOR EACH ROW EXECUTE FUNCTION generate_requisition_number();
  `,

  // ── UPDATED_AT TRIGGERS ────────────────────────────────────────────
  `
  DROP TRIGGER IF EXISTS trg_leave_updated_at ON leave_requests;
  CREATE TRIGGER trg_leave_updated_at
    BEFORE UPDATE ON leave_requests
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

  DROP TRIGGER IF EXISTS trg_funds_updated_at ON funds_requisitions;
  CREATE TRIGGER trg_funds_updated_at
    BEFORE UPDATE ON funds_requisitions
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

  DROP TRIGGER IF EXISTS trg_balance_updated_at ON leave_balances;
  CREATE TRIGGER trg_balance_updated_at
    BEFORE UPDATE ON leave_balances
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  `,
];

(async () => {
  console.log('Running leave & funds migration...');
  for (const sql of migrations) await query(sql);
  console.log('✅ Leave & funds migration complete.');
  process.exit(0);
})().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});