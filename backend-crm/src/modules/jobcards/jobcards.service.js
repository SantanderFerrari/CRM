const db = require('../../db');

// ── Valid transitions from job card state diagram ──────────────────────────
const TRANSITIONS = {
  CREATED:          ['CHECKLIST_PENDING'],
  CHECKLIST_PENDING:['IN_PROGRESS'],
  IN_PROGRESS:      ['COMPLETED'],
  COMPLETED:        ['PENDING_APPROVAL', 'CLOSED'],
  PENDING_APPROVAL: ['CLOSED', 'IN_PROGRESS'],  // IN_PROGRESS = rework required
};

// ── Create job card ────────────────────────────────────────────────────────
const create = async ({ ticket_id, technician_id, supervisor_id, diagnosis_notes }) => {
  // Verify ticket is IN_PROGRESS
  const { rows: tx } = await db.query(
    `SELECT status FROM tickets WHERE ticket_id = $1`, [ticket_id]
  );
  if (!tx.length) throw { status: 404, message: 'Ticket not found.' };
  if (tx[0].status !== 'IN_PROGRESS') {
    throw { status: 400, message: `Ticket must be IN_PROGRESS to create a job card. Current: ${tx[0].status}` };
  }

  const { rows } = await db.query(
    `INSERT INTO job_cards (ticket_id, technician_id, supervisor_id, diagnosis_notes)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [ticket_id, technician_id, supervisor_id || null, diagnosis_notes || null]
  );
  return rows[0];
};

// ── Get all job cards ──────────────────────────────────────────────────────
const getAll = async ({ ticket_id, technician_id, status, limit = 50, offset = 0 }) => {
  const conditions = [];
  const params     = [];

  if (ticket_id)     { params.push(ticket_id);     conditions.push(`jc.ticket_id = $${params.length}`); }
  if (technician_id) { params.push(technician_id); conditions.push(`jc.technician_id = $${params.length}`); }
  if (status)        { params.push(status);         conditions.push(`jc.status = $${params.length}`); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  params.push(limit, offset);

  const { rows } = await db.query(
    `SELECT
       jc.*,
       t.name   AS technician_name,
       s.name   AS supervisor_name,
       tk.status AS ticket_status,
       c.name   AS customer_name,
       (SELECT COUNT(*) FROM job_card_checklist WHERE job_card_id = jc.job_card_id)::int AS checklist_total,
       (SELECT COUNT(*) FROM job_card_checklist WHERE job_card_id = jc.job_card_id AND is_completed = TRUE)::int AS checklist_done
     FROM job_cards jc
     JOIN users t       ON t.user_id     = jc.technician_id
     LEFT JOIN users s  ON s.user_id     = jc.supervisor_id
     JOIN tickets tk    ON tk.ticket_id  = jc.ticket_id
     JOIN customers c   ON c.customer_id = tk.customer_id
     ${where}
     ORDER BY jc.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return rows;
};

// ── Get single job card with all detail ───────────────────────────────────
const getById = async (id) => {
  const { rows } = await db.query(
    `SELECT
       jc.*,
       t.name  AS technician_name,
       t.email AS technician_email,
       s.name  AS supervisor_name,
       tk.status AS ticket_status,
       c.name  AS customer_name,
       d.brand AS device_brand,
       d.model AS device_model,
       d.serial_number AS device_serial
     FROM job_cards jc
     JOIN users t        ON t.user_id     = jc.technician_id
     LEFT JOIN users s   ON s.user_id     = jc.supervisor_id
     JOIN tickets tk     ON tk.ticket_id  = jc.ticket_id
     JOIN customers c    ON c.customer_id = tk.customer_id
     LEFT JOIN devices d ON d.device_id   = tk.device_id
     WHERE jc.job_card_id = $1`,
    [id]
  );
  if (!rows.length) throw { status: 404, message: 'Job card not found.' };

  const jc = rows[0];

  // Fetch all sub-resources in parallel
  const [checklist, timeLogs, partsUsed, requisitions, incidents] = await Promise.all([
    db.query(`SELECT * FROM job_card_checklist WHERE job_card_id = $1 ORDER BY created_at`, [id]),
    db.query(`SELECT tl.*, u.name AS technician_name FROM time_logs tl
              JOIN users u ON u.user_id = tl.technician_id
              WHERE tl.job_card_id = $1 ORDER BY tl.start_time`, [id]),
    db.query(`SELECT pu.*, i.part_name, i.sku FROM parts_used pu
              JOIN inventory i ON i.inventory_id = pu.inventory_id
              WHERE pu.job_card_id = $1 ORDER BY pu.created_at`, [id]),
    db.query(`SELECT sr.*, u.name AS requested_by_name, a.name AS approved_by_name,
                     i.part_name
              FROM stock_requisitions sr
              JOIN users u      ON u.user_id      = sr.requested_by
              LEFT JOIN users a ON a.user_id      = sr.approved_by
              JOIN inventory i  ON i.inventory_id = sr.inventory_id
              WHERE sr.job_card_id = $1 ORDER BY sr.created_at`, [id]),
    db.query(`SELECT il.*, u.name AS reported_by_name FROM incident_logs il
              JOIN users u ON u.user_id = il.reported_by
              WHERE il.job_card_id = $1 ORDER BY il.created_at`, [id]),
  ]);

  return {
    ...jc,
    checklist:    checklist.rows,
    time_logs:    timeLogs.rows,
    parts_used:   partsUsed.rows,
    requisitions: requisitions.rows,
    incidents:    incidents.rows,
  };
};

// ── Update status ──────────────────────────────────────────────────────────
const updateStatus = async (id, newStatus, { repair_notes, diagnosis_notes, approval_deferred }) => {
  const { rows } = await db.query(
    `SELECT status FROM job_cards WHERE job_card_id = $1`, [id]
  );
  if (!rows.length) throw { status: 404, message: 'Job card not found.' };

  const current = rows[0].status;
  const allowed = TRANSITIONS[current] || [];

  if (!allowed.includes(newStatus)) {
    throw {
      status: 400,
      message: `Invalid transition: ${current} → ${newStatus}. Allowed: ${allowed.join(', ') || 'none'}.`,
    };
  }

  const extra = newStatus === 'CLOSED' ? `, closed_at = NOW()` : '';
  const { rows: updated } = await db.query(
    `UPDATE job_cards
     SET status = $1,
         repair_notes      = COALESCE($2, repair_notes),
         diagnosis_notes   = COALESCE($3, diagnosis_notes),
         approval_deferred = COALESCE($4, approval_deferred)
         ${extra}
     WHERE job_card_id = $5
     RETURNING *`,
    [newStatus, repair_notes || null, diagnosis_notes || null, approval_deferred ?? null, id]
  );
  return updated[0];
};

// ── Checklist ──────────────────────────────────────────────────────────────
const addChecklistItem = async (jobCardId, { item_name }) => {
  const { rows } = await db.query(
    `INSERT INTO job_card_checklist (job_card_id, item_name) VALUES ($1, $2) RETURNING *`,
    [jobCardId, item_name]
  );
  return rows[0];
};

const toggleChecklistItem = async (checklistId, is_completed) => {
  const { rows } = await db.query(
    `UPDATE job_card_checklist
     SET is_completed = $1, completed_at = CASE WHEN $1 THEN NOW() ELSE NULL END
     WHERE checklist_id = $2 RETURNING *`,
    [is_completed, checklistId]
  );
  if (!rows.length) throw { status: 404, message: 'Checklist item not found.' };
  return rows[0];
};

// ── Time logs ──────────────────────────────────────────────────────────────
const addTimeLog = async (jobCardId, { technician_id, start_time, end_time, notes }) => {
  const { rows } = await db.query(
    `INSERT INTO time_logs (job_card_id, technician_id, start_time, end_time, notes)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [jobCardId, technician_id, start_time, end_time || null, notes || null]
  );
  return rows[0];
};

// ── Parts used ─────────────────────────────────────────────────────────────
const addPartsUsed = async (jobCardId, { inventory_id, quantity_used }) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO parts_used (job_card_id, inventory_id, quantity_used)
       VALUES ($1, $2, $3) RETURNING *`,
      [jobCardId, inventory_id, quantity_used]
    );
    await client.query('COMMIT');
    return rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.message?.includes('Insufficient stock')) {
      throw { status: 400, message: err.message };
    }
    throw err;
  } finally {
    client.release();
  }
};

// ── Stock requisitions ─────────────────────────────────────────────────────
const createRequisition = async (jobCardId, { requested_by, inventory_id, quantity_requested }) => {
  const { rows } = await db.query(
    `INSERT INTO stock_requisitions (job_card_id, requested_by, inventory_id, quantity_requested)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [jobCardId, requested_by, inventory_id, quantity_requested]
  );
  return rows[0];
};

const approveRequisition = async (requisitionId, approvedBy) => {
  const { rows } = await db.query(
    `UPDATE stock_requisitions
     SET status = 'APPROVED', approved_by = $1
     WHERE requisition_id = $2 AND status = 'PENDING'
     RETURNING *`,
    [approvedBy, requisitionId]
  );
  if (!rows.length) throw { status: 400, message: 'Requisition not found or already processed.' };
  return rows[0];
};

const rejectRequisition = async (requisitionId, approvedBy) => {
  const { rows } = await db.query(
    `UPDATE stock_requisitions
     SET status = 'REJECTED', approved_by = $1
     WHERE requisition_id = $2 AND status = 'PENDING'
     RETURNING *`,
    [approvedBy, requisitionId]
  );
  if (!rows.length) throw { status: 400, message: 'Requisition not found or already processed.' };
  return rows[0];
};

// ── Incidents ──────────────────────────────────────────────────────────────
const addIncident = async (jobCardId, { reported_by, description }) => {
  const { rows } = await db.query(
    `INSERT INTO incident_logs (job_card_id, reported_by, description)
     VALUES ($1, $2, $3) RETURNING *`,
    [jobCardId, reported_by, description]
  );
  return rows[0];
};

// ── Inventory list ─────────────────────────────────────────────────────────
const getInventory = async () => {
  const { rows } = await db.query(
    `SELECT * FROM inventory ORDER BY part_name`
  );
  return rows;
};

module.exports = {
  create, getAll, getById, updateStatus,
  addChecklistItem, toggleChecklistItem,
  addTimeLog, addPartsUsed,
  createRequisition, approveRequisition, rejectRequisition,
  addIncident, getInventory,
};