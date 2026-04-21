require('dotenv').config();
const { query } = require('../db');

const migrations = [
  // ── ENUMS ──────────────────────────────────────────────────────────
  `
  DO $$ BEGIN
    CREATE TYPE job_card_status AS ENUM (
      'CREATED',
      'CHECKLIST_PENDING',
      'IN_PROGRESS',
      'COMPLETED',
      'PENDING_APPROVAL',
      'CLOSED'
    );
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  `,

  `
  DO $$ BEGIN
    CREATE TYPE requisition_status AS ENUM (
      'PENDING',
      'APPROVED',
      'REJECTED'
    );
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  `,

  // ── JOB CARDS ──────────────────────────────────────────────────────
  `
  CREATE TABLE IF NOT EXISTS job_cards (
    job_card_id       UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id         UUID            NOT NULL REFERENCES tickets(ticket_id) ON DELETE RESTRICT,
    technician_id     UUID            NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    supervisor_id     UUID            REFERENCES users(user_id) ON DELETE SET NULL,
    status            job_card_status NOT NULL DEFAULT 'CREATED',
    diagnosis_notes   TEXT,
    repair_notes      TEXT,
    approval_deferred BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    closed_at         TIMESTAMPTZ
  );

  CREATE INDEX IF NOT EXISTS idx_job_cards_ticket     ON job_cards(ticket_id);
  CREATE INDEX IF NOT EXISTS idx_job_cards_technician ON job_cards(technician_id);
  CREATE INDEX IF NOT EXISTS idx_job_cards_status     ON job_cards(status);
  `,

  // ── JOB CARD CHECKLIST ─────────────────────────────────────────────
  `
  CREATE TABLE IF NOT EXISTS job_card_checklist (
    checklist_id UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_card_id  UUID        NOT NULL REFERENCES job_cards(job_card_id) ON DELETE CASCADE,
    item_name    VARCHAR(255) NOT NULL,
    is_completed BOOLEAN     NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_checklist_job_card ON job_card_checklist(job_card_id);
  `,

  // ── TIME LOGS ──────────────────────────────────────────────────────
  `
  CREATE TABLE IF NOT EXISTS time_logs (
    time_log_id   UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_card_id   UUID        NOT NULL REFERENCES job_cards(job_card_id) ON DELETE CASCADE,
    technician_id UUID        NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    start_time    TIMESTAMPTZ NOT NULL,
    end_time      TIMESTAMPTZ,
    notes         TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_time_order CHECK (end_time IS NULL OR end_time > start_time)
  );

  CREATE INDEX IF NOT EXISTS idx_time_logs_job_card ON time_logs(job_card_id);
  `,

  // ── INVENTORY ─────────────────────────────────────────────────────
  `
  CREATE TABLE IF NOT EXISTS inventory (
    inventory_id  UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    part_name     VARCHAR(150) NOT NULL,
    sku           VARCHAR(100) UNIQUE,
    quantity      INTEGER      NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    reorder_level INTEGER      NOT NULL DEFAULT 5,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  );
  `,

  // ── PARTS USED ─────────────────────────────────────────────────────
  `
  CREATE TABLE IF NOT EXISTS parts_used (
    parts_used_id UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_card_id   UUID        NOT NULL REFERENCES job_cards(job_card_id) ON DELETE CASCADE,
    inventory_id  UUID        NOT NULL REFERENCES inventory(inventory_id) ON DELETE RESTRICT,
    quantity_used INTEGER     NOT NULL CHECK (quantity_used > 0),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_parts_used_job_card ON parts_used(job_card_id);
  `,

  // ── STOCK REQUISITIONS ─────────────────────────────────────────────
  `
  CREATE TABLE IF NOT EXISTS stock_requisitions (
    requisition_id     UUID               PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_card_id        UUID               NOT NULL REFERENCES job_cards(job_card_id) ON DELETE RESTRICT,
    requested_by       UUID               NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    approved_by        UUID               REFERENCES users(user_id) ON DELETE SET NULL,
    inventory_id       UUID               NOT NULL REFERENCES inventory(inventory_id) ON DELETE RESTRICT,
    quantity_requested INTEGER            NOT NULL CHECK (quantity_requested > 0),
    status             requisition_status NOT NULL DEFAULT 'PENDING',
    created_at         TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ        NOT NULL DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_requisitions_job_card ON stock_requisitions(job_card_id);
  CREATE INDEX IF NOT EXISTS idx_requisitions_status   ON stock_requisitions(status);
  `,

  // ── INCIDENT LOGS ─────────────────────────────────────────────────
  `
  CREATE TABLE IF NOT EXISTS incident_logs (
    incident_id UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_card_id UUID        NOT NULL REFERENCES job_cards(job_card_id) ON DELETE CASCADE,
    reported_by UUID        NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    description TEXT        NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
 
  CREATE TABLE IF NOT EXISTS devices (
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  `,

  // ── TRIGGERS ──────────────────────────────────────────────────────
  `
  DROP TRIGGER IF EXISTS trg_job_cards_updated_at ON job_cards;
  CREATE TRIGGER trg_job_cards_updated_at
    BEFORE UPDATE ON job_cards
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

  DROP TRIGGER IF EXISTS trg_inventory_updated_at ON inventory;
  CREATE TRIGGER trg_inventory_updated_at
    BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

  DROP TRIGGER IF EXISTS trg_requisitions_updated_at ON stock_requisitions;
  CREATE TRIGGER trg_requisitions_updated_at
    BEFORE UPDATE ON stock_requisitions
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  `,

  // ── DEDUCT INVENTORY TRIGGER ───────────────────────────────────────
  `
  CREATE OR REPLACE FUNCTION deduct_inventory()
  RETURNS TRIGGER LANGUAGE plpgsql AS $$
  BEGIN
    UPDATE inventory
    SET quantity = quantity - NEW.quantity_used
    WHERE inventory_id = NEW.inventory_id;

    IF (SELECT quantity FROM inventory WHERE inventory_id = NEW.inventory_id) < 0 THEN
      RAISE EXCEPTION 'Insufficient stock for inventory_id %', NEW.inventory_id;
    END IF;
    RETURN NEW;
  END;
  $$;

  DROP TRIGGER IF EXISTS trg_deduct_inventory ON parts_used;
  CREATE TRIGGER trg_deduct_inventory
    AFTER INSERT ON parts_used
    FOR EACH ROW EXECUTE FUNCTION deduct_inventory();
  `,
];

(async () => {
  console.log('Running job cards migration...');
  for (const sql of migrations) await query(sql);
  console.log('✅ Job cards migration complete.');
  process.exit(0);
})().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});