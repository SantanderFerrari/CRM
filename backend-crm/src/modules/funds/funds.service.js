const db = require('../../db');

const CATEGORIES = [
  'Project Expense',
  'Operational Expense',
  'Emergency Need',
  'Travel & Accommodation',
  'Equipment & Supplies',
  'Training & Development',
  'Other',
];

// ── Create requisition ────────────────────────────────────────────────────
const create = async (userId, {
  purpose, category, justification,
  amount_kes, amount_words, department,
}) => {
  const { rows } = await db.query(
    `INSERT INTO funds_requisitions
       (requested_by, purpose, category, justification,
        amount_kes, amount_words, department)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [userId, purpose, category, justification,
     amount_kes, amount_words, department || null]
  );
  return rows[0];
};

// ── Get all ───────────────────────────────────────────────────────────────
const getAll = async ({ status, limit = 50, offset = 0 }, requesterId, requesterRole) => {
  const conditions = [];
  const params     = [];

  // Non-finance/admin staff only see their own
  const isApprover = ['SUPERVISOR','HEAD_OF_DEPARTMENT','ADMIN','HUMAN_RESOURCES'].includes(requesterRole);
  if (!isApprover) {
    params.push(requesterId);
    conditions.push(`fr.requested_by = $${params.length}`);
  }
  if (status) {
    params.push(status);
    conditions.push(`fr.status = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  params.push(limit, offset);

  const { rows } = await db.query(
    `SELECT fr.*,
            u.name  AS requested_by_name,
            u.role  AS requested_by_role,
            s.name  AS supervisor_name,
            f.name  AS finance_name,
            fa.name AS final_approver_name
     FROM funds_requisitions fr
     JOIN users u          ON u.user_id  = fr.requested_by
     LEFT JOIN users s     ON s.user_id  = fr.supervisor_id
     LEFT JOIN users f     ON f.user_id  = fr.finance_id
     LEFT JOIN users fa    ON fa.user_id = fr.final_approver_id
     ${where}
     ORDER BY fr.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return rows;
};

// ── Get single ────────────────────────────────────────────────────────────
const getById = async (id) => {
  const { rows } = await db.query(
    `SELECT fr.*,
            u.name  AS requested_by_name,
            u.email AS requested_by_email,
            u.role  AS requested_by_role,
            s.name  AS supervisor_name,
            f.name  AS finance_name,
            fa.name AS final_approver_name
     FROM funds_requisitions fr
     JOIN users u          ON u.user_id  = fr.requested_by
     LEFT JOIN users s     ON s.user_id  = fr.supervisor_id
     LEFT JOIN users f     ON f.user_id  = fr.finance_id
     LEFT JOIN users fa    ON fa.user_id = fr.final_approver_id
     WHERE fr.requisition_id = $1`,
    [id]
  );
  if (!rows.length) throw { status: 404, message: 'Funds requisition not found.' };
  return rows[0];
};

// ── Submit (DRAFT → PENDING_SUPERVISOR) ───────────────────────────────────
const submit = async (id, userId) => {
  const { rows } = await db.query(
    `UPDATE funds_requisitions
     SET status = 'PENDING_SUPERVISOR'
     WHERE requisition_id = $1 AND requested_by = $2 AND status = 'DRAFT'
     RETURNING *`,
    [id, userId]
  );
  if (!rows.length) throw { status: 400, message: 'Requisition not found or already submitted.' };
  return rows[0];
};

// ── Supervisor approve (PENDING_SUPERVISOR → PENDING_FINANCE) ─────────────
const supervisorApprove = async (id, supervisorId) => {
  const { rows } = await db.query(
    `UPDATE funds_requisitions
     SET status = 'PENDING_FINANCE', supervisor_id = $1, supervisor_signed_at = NOW()
     WHERE requisition_id = $2 AND status = 'PENDING_SUPERVISOR'
     RETURNING *`,
    [supervisorId, id]
  );
  if (!rows.length) throw { status: 400, message: 'Requisition not found or not awaiting supervisor.' };
  return rows[0];
};

// ── Finance approve (PENDING_FINANCE → APPROVED) ──────────────────────────
const financeApprove = async (id, financeUserId) => {
  const { rows } = await db.query(
    `UPDATE funds_requisitions
     SET status = 'APPROVED', finance_id = $1, finance_signed_at = NOW(),
         final_approver_id = $1, final_signed_at = NOW()
     WHERE requisition_id = $2 AND status = 'PENDING_FINANCE'
     RETURNING *`,
    [financeUserId, id]
  );
  if (!rows.length) throw { status: 400, message: 'Requisition not found or not awaiting finance.' };
  return rows[0];
};

// ── Reject at any stage ────────────────────────────────────────────────────
const reject = async (id, reviewerId, rejection_reason) => {
  const { rows } = await db.query(
    `UPDATE funds_requisitions
     SET status = 'REJECTED', rejection_reason = $1,
         final_approver_id = $2, final_signed_at = NOW()
     WHERE requisition_id = $3
       AND status IN ('PENDING_SUPERVISOR','PENDING_FINANCE')
     RETURNING *`,
    [rejection_reason || null, reviewerId, id]
  );
  if (!rows.length) throw { status: 400, message: 'Requisition not found or cannot be rejected at this stage.' };
  return rows[0];
};

module.exports = { create, getAll, getById, submit, supervisorApprove, financeApprove, reject, CATEGORIES };