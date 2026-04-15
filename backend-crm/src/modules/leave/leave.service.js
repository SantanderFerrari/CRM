const db = require('../../db');

// ── Leave entitlements per category ───────────────────────────────────────
const ENTITLEMENTS = {
  ANNUAL_LEAVE:        { days: 21,  accrual_per_month: 1.75, fully_paid: true },
  SICK_LEAVE:          { days: 14,  half_pay_after: 7,       min_service_months: 2 },
  MATERNITY_LEAVE:     { days: 90,  fully_paid: true,        notice_days: 7 },
  PATERNITY_LEAVE:     { days: 14,  fully_paid: true },
  COMPASSIONATE_LEAVE: { days: null, deducted_from_annual: true },
};

// ── Get or create leave balance for a user/year ───────────────────────────
const getOrCreateBalance = async (userId, year) => {
  const { rows } = await db.query(
    `INSERT INTO leave_balances (user_id, year, accrued_days)
     VALUES ($1, $2, 0)
     ON CONFLICT (user_id, year) DO UPDATE SET updated_at = NOW()
     RETURNING *`,
    [userId, year]
  );
  return rows[0];
};

// ── Accrue leave for a user based on months worked ────────────────────────
const accrueLeave = async (userId) => {
  const year = new Date().getFullYear();

  // Calculate months worked this year
  const { rows: userRows } = await db.query(
    `SELECT created_at FROM users WHERE user_id = $1`, [userId]
  );
  if (!userRows.length) throw { status: 404, message: 'User not found.' };

  const startOfYear  = new Date(`${year}-01-01`);
  const joinDate     = new Date(userRows[0].created_at);
  const countFrom    = joinDate > startOfYear ? joinDate : startOfYear;
  const now          = new Date();
  const monthsWorked = Math.max(0,
    (now.getFullYear() - countFrom.getFullYear()) * 12 +
    (now.getMonth() - countFrom.getMonth())
  );

  const accrued = Math.min(parseFloat((monthsWorked * 1.75).toFixed(2)), 21);

  await db.query(
    `INSERT INTO leave_balances (user_id, year, accrued_days)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, year)
     DO UPDATE SET accrued_days = $3, updated_at = NOW()`,
    [userId, year, accrued]
  );

  return accrued;
};

// ── Get balance summary for a user ────────────────────────────────────────
const getBalance = async (userId) => {
  const year = new Date().getFullYear();
  await accrueLeave(userId);

  const { rows } = await db.query(
    `SELECT lb.*,
            GREATEST(lb.accrued_days + lb.carried_forward - lb.used_days, 0) AS available_days
     FROM leave_balances lb
     WHERE lb.user_id = $1 AND lb.year = $2`,
    [userId, year]
  );

  if (!rows.length) {
    return { accrued_days: 0, used_days: 0, carried_forward: 0, available_days: 0, year };
  }
  return rows[0];
};

// ── Check for overlapping leave ───────────────────────────────────────────
const checkOverlap = async (userId, startDate, endDate, excludeId = null) => {
  const params = [userId, startDate, endDate];
  let excludeClause = '';
  if (excludeId) {
    params.push(excludeId);
    excludeClause = `AND leave_id != $${params.length}`;
  }
  const { rows } = await db.query(
    `SELECT leave_id FROM leave_requests
     WHERE user_id = $1
       AND status NOT IN ('REJECTED','CANCELLED')
       AND (start_date, end_date) OVERLAPS ($2::date, $3::date)
       ${excludeClause}`,
    params
  );
  return rows.length > 0;
};

// ── Create leave request ──────────────────────────────────────────────────
const create = async (userId, {
  category, start_date, end_date, duty_resume_date,
  days_requested, reason, sick_certificate,
}) => {
  // Validate category-specific rules
  if (category === 'SICK_LEAVE' && !sick_certificate) {
    throw { status: 400, message: 'A medical certificate is required for sick leave.' };
  }
  if (category === 'MATERNITY_LEAVE') {
    const { rows } = await db.query(`SELECT role FROM users WHERE user_id = $1`, [userId]);
    // Can't enforce gender from DB, but note is included in response
  }

  // Check for overlap
  const hasOverlap = await checkOverlap(userId, start_date, end_date);

  const { rows } = await db.query(
    `INSERT INTO leave_requests
       (user_id, category, start_date, end_date, duty_resume_date,
        days_requested, reason, sick_certificate, overlap_flag)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [userId, category, start_date, end_date, duty_resume_date,
     days_requested, reason || null, sick_certificate || false, hasOverlap]
  );

  if (hasOverlap) {
    return { ...rows[0], warning: 'This request overlaps with an existing leave period.' };
  }
  return rows[0];
};

// ── Get leave requests ────────────────────────────────────────────────────
const getAll = async ({ user_id, status, category, limit = 50, offset = 0 }, requesterId, requesterRole) => {
  const conditions = [];
  const params     = [];

  // Non-managers only see their own leave
  const isManager = ['SUPERVISOR','HEAD_OF_DEPARTMENT','ADMIN','HUMAN_RESOURCES'].includes(requesterRole);
  if (!isManager) {
    params.push(requesterId);
    conditions.push(`lr.user_id = $${params.length}`);
  } else if (user_id) {
    params.push(user_id);
    conditions.push(`lr.user_id = $${params.length}`);
  }

  if (status)   { params.push(status);   conditions.push(`lr.status = $${params.length}`); }
  if (category) { params.push(category); conditions.push(`lr.category = $${params.length}`); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  params.push(limit, offset);

  const { rows } = await db.query(
    `SELECT lr.*,
            u.name      AS employee_name,
            u.role      AS employee_role,
            r.name      AS reviewed_by_name
     FROM leave_requests lr
     JOIN users u        ON u.user_id = lr.user_id
     LEFT JOIN users r   ON r.user_id = lr.reviewed_by
     ${where}
     ORDER BY lr.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return rows;
};

// ── Get single leave request ──────────────────────────────────────────────
const getById = async (id) => {
  const { rows } = await db.query(
    `SELECT lr.*,
            u.name  AS employee_name,
            u.email AS employee_email,
            u.role  AS employee_role,
            r.name  AS reviewed_by_name
     FROM leave_requests lr
     JOIN users u       ON u.user_id = lr.user_id
     LEFT JOIN users r  ON r.user_id = lr.reviewed_by
     WHERE lr.leave_id = $1`,
    [id]
  );
  if (!rows.length) throw { status: 404, message: 'Leave request not found.' };
  return rows[0];
};

// ── Approve or reject ─────────────────────────────────────────────────────
const review = async (leaveId, reviewerId, { action, review_notes }) => {
  if (!['APPROVED','REJECTED'].includes(action)) {
    throw { status: 400, message: 'action must be APPROVED or REJECTED.' };
  }

  const { rows: existing } = await db.query(
    `SELECT * FROM leave_requests WHERE leave_id = $1`, [leaveId]
  );
  if (!existing.length) throw { status: 404, message: 'Leave request not found.' };
  if (existing[0].status !== 'PENDING') {
    throw { status: 400, message: `Leave request is already ${existing[0].status}.` };
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `UPDATE leave_requests
       SET status = $1, reviewed_by = $2, reviewed_at = NOW(), review_notes = $3
       WHERE leave_id = $4
       RETURNING *`,
      [action, reviewerId, review_notes || null, leaveId]
    );

    // Deduct from balance when approved
    if (action === 'APPROVED') {
      const lr   = rows[0];
      const year = new Date(lr.start_date).getFullYear();
      await client.query(
        `INSERT INTO leave_balances (user_id, year, used_days)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, year)
         DO UPDATE SET used_days = leave_balances.used_days + $3, updated_at = NOW()`,
        [lr.user_id, year, lr.days_requested]
      );
    }

    await client.query('COMMIT');
    return rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// ── Cancel own leave ──────────────────────────────────────────────────────
const cancel = async (leaveId, userId) => {
  const { rows } = await db.query(
    `UPDATE leave_requests
     SET status = 'CANCELLED'
     WHERE leave_id = $1 AND user_id = $2 AND status = 'PENDING'
     RETURNING *`,
    [leaveId, userId]
  );
  if (!rows.length) throw { status: 400, message: 'Cannot cancel — request not found or already processed.' };
  return rows[0];
};

module.exports = { create, getAll, getById, review, cancel, getBalance, accrueLeave, ENTITLEMENTS };