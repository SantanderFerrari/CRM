-- ============================================================
-- CRM System - PostgreSQL Schema
-- Generated from: ERD, State Diagrams, Use Case & Sequence Diagrams
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE ticket_status AS ENUM (
    'NEW',
    'ASSIGNED',
    'IN_PROGRESS',
    'CLOSED_CUST_PICKUP',
    'CLOSED',
    'REOPENED',
    'ESCALATED'
);

CREATE TYPE job_card_status AS ENUM (
    'CREATED',
    'CHECKLIST_PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'PENDING_APPROVAL',
    'CLOSED'
);

CREATE TYPE requisition_status AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);

CREATE TYPE leave_status AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);

CREATE TYPE user_role AS ENUM (
    'CUSTOMER_CARE',
    'TECHNICIAN',
    'SUPERVISOR',
    'SALES_REPRESENTATIVE',
    'HEAD_OF_DEPARTMENT',
    'HUMAN_RESOURCES',
    'ADMIN'
);

CREATE TYPE device_condition AS ENUM (
    'GOOD',
    'FAIR',
    'DAMAGED',
    'CRITICAL'
);

-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE users (
    user_id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(150) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    role            user_role NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CUSTOMERS
-- ============================================================

CREATE TABLE customers (
    customer_id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(150) NOT NULL,
    phone           VARCHAR(30),
    email           VARCHAR(255),
    address         TEXT,
    kra_pin         VARCHAR(11),            -- KRA PIN (2 letters + 9 digits)
    qb_customer_id  VARCHAR(100),           -- QuickBooks reference
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- DEVICES
-- ============================================================

CREATE TABLE devices (
    device_id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id         UUID NOT NULL REFERENCES customers(customer_id) ON DELETE RESTRICT,
    serial_number       VARCHAR(100) UNIQUE,
    brand               VARCHAR(100),
    model               VARCHAR(100),
    device_type         VARCHAR(100),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INVENTORY / PARTS
-- ============================================================

CREATE TABLE inventory (
    inventory_id    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    part_name       VARCHAR(150) NOT NULL,
    sku             VARCHAR(100) UNIQUE,
    quantity        INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    reorder_level   INTEGER NOT NULL DEFAULT 5,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TICKETS
-- ============================================================

CREATE TABLE tickets (
    ticket_id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_type         VARCHAR(100),
    customer_id         UUID NOT NULL REFERENCES customers(customer_id) ON DELETE RESTRICT,
    device_id           UUID REFERENCES devices(device_id) ON DELETE SET NULL,
    assigned_user_id    UUID REFERENCES users(user_id) ON DELETE SET NULL,
    status              ticket_status NOT NULL DEFAULT 'NEW',
    reopen_count        INTEGER NOT NULL DEFAULT 0,
    escalation_flag     BOOLEAN NOT NULL DEFAULT FALSE,
    duplicate_flag      BOOLEAN NOT NULL DEFAULT FALSE,
    linked_ticket_id    UUID REFERENCES tickets(ticket_id) ON DELETE SET NULL,  -- duplicate link
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at           TIMESTAMPTZ
);

-- ============================================================
-- TICKET ACCESSORIES (logged at intake)
-- ============================================================

CREATE TABLE ticket_accessories (
    accessory_id    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id       UUID NOT NULL REFERENCES tickets(ticket_id) ON DELETE CASCADE,
    description     VARCHAR(255) NOT NULL,
    condition       device_condition NOT NULL DEFAULT 'GOOD',
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- DEVICE CONDITION REPORT (logged per ticket)
-- ============================================================

CREATE TABLE device_condition_report (
    report_id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id           UUID NOT NULL REFERENCES tickets(ticket_id) ON DELETE CASCADE,
    accessory_id        UUID REFERENCES ticket_accessories(accessory_id) ON DELETE SET NULL,
    condition_notes     TEXT,
    inspection_name     VARCHAR(150),
    condition_summary   device_condition NOT NULL DEFAULT 'GOOD',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- JOB CARDS
-- ============================================================

CREATE TABLE job_cards (
    job_card_id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id           UUID NOT NULL REFERENCES tickets(ticket_id) ON DELETE RESTRICT,
    technician_id       UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    supervisor_id       UUID REFERENCES users(user_id) ON DELETE SET NULL,
    status              job_card_status NOT NULL DEFAULT 'CREATED',
    diagnosis_notes     TEXT,
    repair_notes        TEXT,
    approval_deferred   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at           TIMESTAMPTZ
);

-- ============================================================
-- JOB CARD CHECKLIST
-- ============================================================

CREATE TABLE job_card_checklist (
    checklist_id    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_card_id     UUID NOT NULL REFERENCES job_cards(job_card_id) ON DELETE CASCADE,
    item_name       VARCHAR(255) NOT NULL,
    is_completed    BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TIME LOGS (technician time tracking per job card)
-- ============================================================

CREATE TABLE time_logs (
    time_log_id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_card_id     UUID NOT NULL REFERENCES job_cards(job_card_id) ON DELETE CASCADE,
    technician_id   UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    start_time      TIMESTAMPTZ NOT NULL,
    end_time        TIMESTAMPTZ,
    duration_mins   INTEGER GENERATED ALWAYS AS (
                        CASE WHEN end_time IS NOT NULL
                             THEN EXTRACT(EPOCH FROM (end_time - start_time))::INTEGER / 60
                             ELSE NULL END
                    ) STORED,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_time_order CHECK (end_time IS NULL OR end_time > start_time)
);

-- ============================================================
-- PARTS USED (per job card)
-- ============================================================

CREATE TABLE parts_used (
    parts_used_id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_card_id     UUID NOT NULL REFERENCES job_cards(job_card_id) ON DELETE CASCADE,
    inventory_id    UUID NOT NULL REFERENCES inventory(inventory_id) ON DELETE RESTRICT,
    quantity_used   INTEGER NOT NULL CHECK (quantity_used > 0),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- STOCK REQUISITIONS
-- ============================================================

CREATE TABLE stock_requisitions (
    requisition_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_card_id         UUID NOT NULL REFERENCES job_cards(job_card_id) ON DELETE RESTRICT,
    requested_by        UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    approved_by         UUID REFERENCES users(user_id) ON DELETE SET NULL,
    inventory_id        UUID NOT NULL REFERENCES inventory(inventory_id) ON DELETE RESTRICT,
    quantity_requested  INTEGER NOT NULL CHECK (quantity_requested > 0),
    status              requisition_status NOT NULL DEFAULT 'PENDING',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INCIDENT LOGS (accessory damage / anomalies)
-- ============================================================

CREATE TABLE incident_logs (
    incident_id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_card_id     UUID NOT NULL REFERENCES job_cards(job_card_id) ON DELETE CASCADE,
    reported_by     UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    description     TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INVOICES / PAYMENTS (QuickBooks sync)
-- ============================================================

CREATE TABLE invoices (
    invoice_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id       UUID NOT NULL REFERENCES tickets(ticket_id) ON DELETE RESTRICT,
    customer_id     UUID NOT NULL REFERENCES customers(customer_id) ON DELETE RESTRICT,
    qb_invoice_id   VARCHAR(100),               -- QuickBooks reference
    amount          NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    paid            BOOLEAN NOT NULL DEFAULT FALSE,
    paid_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- LEAVE REQUESTS (HR Module)
-- ============================================================

CREATE TABLE leave_requests (
    leave_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    leave_type      VARCHAR(50) NOT NULL,       -- e.g. SICK, ANNUAL, UNPAID
    status          leave_status NOT NULL DEFAULT 'PENDING',
    reviewed_by     UUID REFERENCES users(user_id) ON DELETE SET NULL,
    sick_days_used  INTEGER,
    overlap_flag    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_leave_dates CHECK (end_date >= start_date)
);

-- ============================================================
-- AUDIT LOG
-- ============================================================

CREATE TABLE audit_log (
    audit_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name      VARCHAR(100) NOT NULL,
    record_id       UUID NOT NULL,
    action          VARCHAR(20) NOT NULL,       -- INSERT, UPDATE, DELETE
    changed_by      UUID REFERENCES users(user_id) ON DELETE SET NULL,
    old_values      JSONB,
    new_values      JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
    notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    message         TEXT NOT NULL,
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    related_table   VARCHAR(100),
    related_id      UUID,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Tickets
CREATE INDEX idx_tickets_customer     ON tickets(customer_id);
CREATE INDEX idx_tickets_status       ON tickets(status);
CREATE INDEX idx_tickets_assigned     ON tickets(assigned_user_id);
CREATE INDEX idx_tickets_device       ON tickets(device_id);
CREATE INDEX idx_tickets_created      ON tickets(created_at);

-- Job Cards
CREATE INDEX idx_job_cards_ticket     ON job_cards(ticket_id);
CREATE INDEX idx_job_cards_tech       ON job_cards(technician_id);
CREATE INDEX idx_job_cards_status     ON job_cards(status);

-- Parts Used
CREATE INDEX idx_parts_used_jobcard   ON parts_used(job_card_id);
CREATE INDEX idx_parts_used_inv       ON parts_used(inventory_id);

-- Audit
CREATE INDEX idx_audit_table_record   ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_created        ON audit_log(created_at);

-- Notifications
CREATE INDEX idx_notif_user           ON notifications(user_id);
CREATE INDEX idx_notif_unread         ON notifications(user_id) WHERE is_read = FALSE;

-- Leave
CREATE INDEX idx_leave_user           ON leave_requests(user_id);
CREATE INDEX idx_leave_status         ON leave_requests(status);

-- ============================================================
-- MATERIALIZED VIEWS (for dashboards / reporting)
-- ============================================================

-- Technician performance (used in technician_performance_sequence_diagram)
CREATE MATERIALIZED VIEW mv_technician_performance AS
SELECT
    u.user_id,
    u.name                                          AS technician_name,
    COUNT(DISTINCT jc.job_card_id)                  AS total_job_cards,
    COUNT(DISTINCT jc.job_card_id) FILTER (
        WHERE jc.status = 'CLOSED')                 AS closed_job_cards,
    ROUND(AVG(tl.duration_mins), 1)                 AS avg_time_per_job_mins,
    COUNT(DISTINCT il.incident_id)                  AS total_incidents,
    COUNT(DISTINCT sr.requisition_id)               AS total_requisitions
FROM users u
LEFT JOIN job_cards    jc ON jc.technician_id = u.user_id
LEFT JOIN time_logs    tl ON tl.job_card_id   = jc.job_card_id
LEFT JOIN incident_logs il ON il.job_card_id  = jc.job_card_id
LEFT JOIN stock_requisitions sr ON sr.job_card_id = jc.job_card_id
WHERE u.role = 'TECHNICIAN'
GROUP BY u.user_id, u.name;

CREATE UNIQUE INDEX ON mv_technician_performance(user_id);

-- General KPI view (used in reporting_dashboard sequence diagram)
CREATE MATERIALIZED VIEW mv_dashboard_kpis AS
SELECT
    COUNT(*) FILTER (WHERE t.status = 'NEW')                AS tickets_new,
    COUNT(*) FILTER (WHERE t.status = 'IN_PROGRESS')        AS tickets_in_progress,
    COUNT(*) FILTER (WHERE t.status = 'CLOSED')             AS tickets_closed,
    COUNT(*) FILTER (WHERE t.status = 'ESCALATED')          AS tickets_escalated,
    COUNT(*) FILTER (WHERE t.status = 'REOPENED')           AS tickets_reopened,
    COUNT(*) FILTER (
        WHERE t.created_at >= date_trunc('month', NOW()))    AS tickets_this_month,
    ROUND(AVG(
        EXTRACT(EPOCH FROM (t.closed_at - t.created_at))/3600
    ) FILTER (WHERE t.closed_at IS NOT NULL), 2)            AS avg_resolution_hrs
FROM tickets t;

-- ============================================================
-- TRIGGER: auto-update updated_at on tickets
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_tickets_updated_at
    BEFORE UPDATE ON tickets
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_job_cards_updated_at
    BEFORE UPDATE ON job_cards
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_requisitions_updated_at
    BEFORE UPDATE ON stock_requisitions
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_leave_updated_at
    BEFORE UPDATE ON leave_requests
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TRIGGER: enforce ticket reopen → ESCALATED threshold
-- ============================================================

CREATE OR REPLACE FUNCTION check_ticket_escalation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    escalation_threshold CONSTANT INTEGER := 3;
BEGIN
    IF NEW.status = 'REOPENED' THEN
        NEW.reopen_count := NEW.reopen_count + 1;
        IF NEW.reopen_count >= escalation_threshold THEN
            NEW.status := 'ESCALATED';
            NEW.escalation_flag := TRUE;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_ticket_escalation
    BEFORE UPDATE ON tickets
    FOR EACH ROW
    WHEN (NEW.status = 'REOPENED')
    EXECUTE FUNCTION check_ticket_escalation();

-- ============================================================
-- TRIGGER: deduct inventory when parts are used
-- ============================================================

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

CREATE TRIGGER trg_deduct_inventory
    AFTER INSERT ON parts_used
    FOR EACH ROW EXECUTE FUNCTION deduct_inventory();

-- ============================================================
-- TRIGGER: prevent overlapping leave requests for same user
-- ============================================================

CREATE OR REPLACE FUNCTION check_leave_overlap()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM leave_requests
        WHERE user_id   = NEW.user_id
          AND leave_id != COALESCE(NEW.leave_id, uuid_generate_v4())
          AND status   != 'REJECTED'
          AND (NEW.start_date, NEW.end_date) OVERLAPS (start_date, end_date)
    ) THEN
        NEW.overlap_flag := TRUE;
        NEW.status := 'REJECTED';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_leave_overlap
    BEFORE INSERT OR UPDATE ON leave_requests
    FOR EACH ROW EXECUTE FUNCTION check_leave_overlap();

-- ============================================================
-- END OF SCHEMA
-- ============================================================
