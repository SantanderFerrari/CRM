const db = require('../../db');

// ── Valid state transitions from the ticket state diagram ──────────────────
const TRANSITIONS = {
  NEW:                ['ASSIGNED'],
  ASSIGNED:           ['IN_PROGRESS'],
  IN_PROGRESS:        ['CLOSED_CUST_PICKUP'],
  CLOSED_CUST_PICKUP: ['CLOSED', 'REOPENED'],
  CLOSED:             ['REOPENED'],
  REOPENED:           ['IN_PROGRESS', 'ESCALATED'],
  ESCALATED:          ['IN_PROGRESS'],
};

// ── Duplicate detection ────────────────────────────────────────────────────
// A duplicate = same device serial number with an open ticket (not CLOSED/ESCALATED)
const findDuplicates = async (deviceId) => {
  if (!deviceId) return [];
  const { rows } = await db.query(
    `SELECT t.ticket_id, t.status, t.created_at, c.name AS customer_name
     FROM tickets t
     JOIN customers c ON c.customer_id = t.customer_id
     WHERE t.device_id = $1
       AND t.status NOT IN ('CLOSED', 'ESCALATED')
     ORDER BY t.created_at DESC`,
    [deviceId]
  );
  return rows;
};

// ── Create ticket ──────────────────────────────────────────────────────────
const create = async ({ ticket_type, customer_id, device_id, notes }, createdBy) => {
  // Check for duplicates before inserting
  const duplicates = await findDuplicates(device_id);

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `INSERT INTO tickets (ticket_type, customer_id, device_id, notes, duplicate_flag)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [ticket_type, customer_id, device_id, notes, duplicates.length > 0]
    );
    const ticket = rows[0];

    // Auto-link to the most recent open duplicate
    if (duplicates.length > 0) {
      await client.query(
        `UPDATE tickets SET linked_ticket_id = $1 WHERE ticket_id = $2`,
        [duplicates[0].ticket_id, ticket.ticket_id]
      );
      ticket.linked_ticket_id = duplicates[0].ticket_id;
    }

    await client.query('COMMIT');
    return { ticket, duplicates };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// ── Get all tickets ────────────────────────────────────────────────────────
const getAll = async ({ status, assigned_user_id, customer_id, limit = 50, offset = 0 }) => {
  const conditions = [];
  const params     = [];

  if (status)           { params.push(status);           conditions.push(`t.status = $${params.length}`); }
  if (assigned_user_id) { params.push(assigned_user_id); conditions.push(`t.assigned_user_id = $${params.length}`); }
  if (customer_id)      { params.push(customer_id);      conditions.push(`t.customer_id = $${params.length}`); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  params.push(limit, offset);

  const { rows } = await db.query(
    `SELECT
       t.*,
       c.name            AS customer_name,
       c.phone           AS customer_phone,
       d.brand           AS device_brand,
       d.model           AS device_model,
       d.serial_number   AS device_serial,
       u.name            AS assigned_to
     FROM tickets t
     JOIN customers c ON c.customer_id = t.customer_id
     LEFT JOIN devices d ON d.device_id = t.device_id
     LEFT JOIN users u   ON u.user_id   = t.assigned_user_id
     ${where}
     ORDER BY t.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return rows;
};

// ── Get single ticket with full detail ────────────────────────────────────
const getById = async (id) => {
  const { rows } = await db.query(
    `SELECT
       t.*,
       c.name          AS customer_name,
       c.phone         AS customer_phone,
       c.email         AS customer_email,
       d.brand         AS device_brand,
       d.model         AS device_model,
       d.serial_number AS device_serial,
       d.device_type   AS device_type,
       u.name          AS assigned_to
     FROM tickets t
     JOIN customers c ON c.customer_id = t.customer_id
     LEFT JOIN devices d ON d.device_id = t.device_id
     LEFT JOIN users u   ON u.user_id   = t.assigned_user_id
     WHERE t.ticket_id = $1`,
    [id]
  );
  if (!rows.length) throw { status: 404, message: 'Ticket not found.' };

  const ticket = rows[0];

  // Fetch accessories
  const { rows: accessories } = await db.query(
    `SELECT * FROM ticket_accessories WHERE ticket_id = $1 ORDER BY created_at`,
    [id]
  );

  // Fetch condition report
  const { rows: conditionReports } = await db.query(
    `SELECT * FROM device_condition_report WHERE ticket_id = $1 ORDER BY created_at`,
    [id]
  );

  return { ...ticket, accessories, condition_reports: conditionReports };
};

// ── Update ticket status (enforces state machine) ─────────────────────────
const updateStatus = async (ticketId, newStatus, userId) => {
  const { rows } = await db.query(
    `SELECT status, reopen_count FROM tickets WHERE ticket_id = $1`, [ticketId]
  );
  if (!rows.length) throw { status: 404, message: 'Ticket not found.' };

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
    `UPDATE tickets
     SET status = $1, assigned_user_id = COALESCE($2, assigned_user_id) ${extra}
     WHERE ticket_id = $3
     RETURNING *`,
    [newStatus, userId || null, ticketId]
  );
  return updated[0];
};

// ── Assign ticket to a technician ─────────────────────────────────────────
const assign = async (ticketId, assignedUserId) => {
  const { rows } = await db.query(
    `UPDATE tickets
     SET assigned_user_id = $1, status = 'ASSIGNED'
     WHERE ticket_id = $2 AND status = 'NEW'
     RETURNING *`,
    [assignedUserId, ticketId]
  );
  if (!rows.length) throw { status: 400, message: 'Ticket not found or not in NEW status.' };
  return rows[0];
};

// ── Add accessory to ticket ────────────────────────────────────────────────
const addAccessory = async (ticketId, { description, condition, notes }) => {
  // Verify ticket exists
  const { rows: tx } = await db.query(
    `SELECT ticket_id FROM tickets WHERE ticket_id = $1`, [ticketId]
  );
  if (!tx.length) throw { status: 404, message: 'Ticket not found.' };

  const { rows } = await db.query(
    `INSERT INTO ticket_accessories (ticket_id, description, condition, notes)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [ticketId, description, condition || 'GOOD', notes]
  );
  return rows[0];
};

// ── Get accessories for a ticket ───────────────────────────────────────────
const getAccessories = async (ticketId) => {
  const { rows } = await db.query(
    `SELECT * FROM ticket_accessories WHERE ticket_id = $1 ORDER BY created_at`,
    [ticketId]
  );
  return rows;
};

// ── Add device condition report ────────────────────────────────────────────
const addConditionReport = async (ticketId, { accessory_id, condition_summary, condition_notes, inspection_name }) => {
  const { rows: tx } = await db.query(
    `SELECT ticket_id FROM tickets WHERE ticket_id = $1`, [ticketId]
  );
  if (!tx.length) throw { status: 404, message: 'Ticket not found.' };

  const { rows } = await db.query(
    `INSERT INTO device_condition_report
       (ticket_id, accessory_id, condition_summary, condition_notes, inspection_name)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [ticketId, accessory_id || null, condition_summary || 'GOOD', condition_notes, inspection_name]
  );
  return rows[0];
};

// ── Get condition reports for a ticket ────────────────────────────────────
const getConditionReports = async (ticketId) => {
  const { rows } = await db.query(
    `SELECT dcr.*, ta.description AS accessory_description
     FROM device_condition_report dcr
     LEFT JOIN ticket_accessories ta ON ta.accessory_id = dcr.accessory_id
     WHERE dcr.ticket_id = $1
     ORDER BY dcr.created_at`,
    [ticketId]
  );
  return rows;
};

module.exports = {
  create,
  getAll,
  getById,
  updateStatus,
  assign,
  addAccessory,
  getAccessories,
  addConditionReport,
  getConditionReports,
  findDuplicates,
};