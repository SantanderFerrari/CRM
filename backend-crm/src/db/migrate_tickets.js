require('dotenv').config();
const { query } = require('../db');

const migrations = [

  // ── ENUMS ──────────────────────────────────────────────────────────
  `
  DO $$ BEGIN
    CREATE TYPE ticket_status AS ENUM (
      'NEW',
      'ASSIGNED',
      'IN_PROGRESS',
      'CLOSED_CUST_PICKUP',
      'CLOSED',
      'REOPENED',
      'ESCALATED'
    );
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  `,

  `
  DO $$ BEGIN
    CREATE TYPE device_condition AS ENUM (
      'GOOD',
      'FAIR',
      'DAMAGED',
      'CRITICAL'
    );
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  `,

  // ── CUSTOMERS ──────────────────────────────────────────────────────
  `
  CREATE TABLE IF NOT EXISTS customers (
    customer_id    UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    name           VARCHAR(150) NOT NULL,
    phone          VARCHAR(30),
    email          VARCHAR(255),
    address        TEXT,
    qb_customer_id VARCHAR(100),
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
  CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
  `,

  // ── DEVICES ────────────────────────────────────────────────────────
  `
  CREATE TABLE IF NOT EXISTS devices (
    device_id     UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id   UUID         NOT NULL REFERENCES customers(customer_id) ON DELETE RESTRICT,
    serial_number VARCHAR(100) UNIQUE,
    brand         VARCHAR(100),
    model         VARCHAR(100),
    device_type   VARCHAR(100),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_devices_customer      ON devices(customer_id);
  CREATE INDEX IF NOT EXISTS idx_devices_serial_number ON devices(serial_number);
  `,

  // ── TICKETS ────────────────────────────────────────────────────────
  `
  CREATE TABLE IF NOT EXISTS tickets (
    ticket_id        UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_type      VARCHAR(100),
    customer_id      UUID          NOT NULL REFERENCES customers(customer_id) ON DELETE RESTRICT,
    device_id        UUID          REFERENCES devices(device_id) ON DELETE SET NULL,
    assigned_user_id UUID          REFERENCES users(user_id) ON DELETE SET NULL,
    status           ticket_status NOT NULL DEFAULT 'NEW',
    reopen_count     INTEGER       NOT NULL DEFAULT 0,
    escalation_flag  BOOLEAN       NOT NULL DEFAULT FALSE,
    duplicate_flag   BOOLEAN       NOT NULL DEFAULT FALSE,
    linked_ticket_id UUID          REFERENCES tickets(ticket_id) ON DELETE SET NULL,
    notes            TEXT,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    closed_at        TIMESTAMPTZ
  );

  CREATE INDEX IF NOT EXISTS idx_tickets_customer    ON tickets(customer_id);
  CREATE INDEX IF NOT EXISTS idx_tickets_status      ON tickets(status);
  CREATE INDEX IF NOT EXISTS idx_tickets_assigned    ON tickets(assigned_user_id);
  CREATE INDEX IF NOT EXISTS idx_tickets_device      ON tickets(device_id);
  CREATE INDEX IF NOT EXISTS idx_tickets_created     ON tickets(created_at);
  `,

  // ── TICKET ACCESSORIES ─────────────────────────────────────────────
  `
  CREATE TABLE IF NOT EXISTS ticket_accessories (
    accessory_id UUID             PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id    UUID             NOT NULL REFERENCES tickets(ticket_id) ON DELETE CASCADE,
    description  VARCHAR(255)     NOT NULL,
    condition    device_condition NOT NULL DEFAULT 'GOOD',
    notes        TEXT,
    created_at   TIMESTAMPTZ      NOT NULL DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_accessories_ticket ON ticket_accessories(ticket_id);
  `,

  // ── DEVICE CONDITION REPORT ────────────────────────────────────────
  `
  CREATE TABLE IF NOT EXISTS device_condition_report (
    report_id         UUID             PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id         UUID             NOT NULL REFERENCES tickets(ticket_id) ON DELETE CASCADE,
    accessory_id      UUID             REFERENCES ticket_accessories(accessory_id) ON DELETE SET NULL,
    condition_summary device_condition NOT NULL DEFAULT 'GOOD',
    condition_notes   TEXT,
    inspection_name   VARCHAR(150),
    created_at        TIMESTAMPTZ      NOT NULL DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_condition_report_ticket ON device_condition_report(ticket_id);
  `,

  // ── updated_at TRIGGERS ────────────────────────────────────────────
  `
  DROP TRIGGER IF EXISTS trg_customers_updated_at ON customers;
  CREATE TRIGGER trg_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

  DROP TRIGGER IF EXISTS trg_devices_updated_at ON devices;
  CREATE TRIGGER trg_devices_updated_at
    BEFORE UPDATE ON devices
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

  DROP TRIGGER IF EXISTS trg_tickets_updated_at ON tickets;
  CREATE TRIGGER trg_tickets_updated_at
    BEFORE UPDATE ON tickets
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  `,

  // ── ESCALATION TRIGGER ─────────────────────────────────────────────
  `
  CREATE OR REPLACE FUNCTION check_ticket_escalation()
  RETURNS TRIGGER LANGUAGE plpgsql AS $$
  DECLARE
    escalation_threshold CONSTANT INTEGER := 3;
  BEGIN
    IF NEW.status = 'REOPENED' THEN
      NEW.reopen_count := OLD.reopen_count + 1;
      IF NEW.reopen_count >= escalation_threshold THEN
        NEW.status          := 'ESCALATED';
        NEW.escalation_flag := TRUE;
      END IF;
    END IF;
    RETURN NEW;
  END;
  $$;

  DROP TRIGGER IF EXISTS trg_ticket_escalation ON tickets;
  CREATE TRIGGER trg_ticket_escalation
    BEFORE UPDATE ON tickets
    FOR EACH ROW
    WHEN (NEW.status = 'REOPENED')
    EXECUTE FUNCTION check_ticket_escalation();
  `,
];

(async () => {
  console.log('Running tickets migration...');
  for (const sql of migrations) {
    await query(sql);
  }
  console.log('✅ Tickets migration complete.');
  process.exit(0);
})().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});