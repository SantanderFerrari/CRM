const db = require('../../db');

const getStats = async () => {

  // ── Ticket counts by status ──────────────────────────────────────────
  const { rows: statusRows } = await db.query(`
    SELECT status, COUNT(*)::int AS count
    FROM tickets
    GROUP BY status
  `);

  const statusMap = {
    NEW: 0, ASSIGNED: 0, IN_PROGRESS: 0,
    CLOSED_CUST_PICKUP: 0, CLOSED: 0,
    REOPENED: 0, ESCALATED: 0,
  };
  statusRows.forEach(({ status, count }) => { statusMap[status] = count; });

  const totalOpen = statusMap.NEW + statusMap.ASSIGNED +
                    statusMap.IN_PROGRESS + statusMap.REOPENED +
                    statusMap.ESCALATED;

  // ── Tickets created per day (last 14 days) ───────────────────────────
  const { rows: dailyRows } = await db.query(`
    SELECT
      TO_CHAR(created_at AT TIME ZONE 'UTC', 'Mon DD') AS day,
      COUNT(*)::int AS count
    FROM tickets
    WHERE created_at >= NOW() - INTERVAL '14 days'
    GROUP BY DATE_TRUNC('day', created_at), day
    ORDER BY DATE_TRUNC('day', created_at)
  `);

  // ── Average resolution time (closed tickets, in hours) ──────────────
  const { rows: resolutionRows } = await db.query(`
    SELECT ROUND(
      AVG(EXTRACT(EPOCH FROM (closed_at - created_at)) / 3600)::numeric, 1
    ) AS avg_hours
    FROM tickets
    WHERE status = 'CLOSED' AND closed_at IS NOT NULL
  `);
  const avgResolutionHrs = resolutionRows[0]?.avg_hours ?? null;

  // ── Tickets by technician (top 5 by assigned open tickets) ──────────
  const { rows: techRows } = await db.query(`
    SELECT
      u.name,
      u.user_id,
      COUNT(t.ticket_id)::int AS total,
      COUNT(t.ticket_id) FILTER (WHERE t.status = 'IN_PROGRESS')::int  AS in_progress,
      COUNT(t.ticket_id) FILTER (WHERE t.status = 'CLOSED')::int        AS closed
    FROM users u
    LEFT JOIN tickets t ON t.assigned_user_id = u.user_id
    WHERE u.role = 'TECHNICIAN' AND u.is_active = TRUE
    GROUP BY u.user_id, u.name
    ORDER BY total DESC
    LIMIT 5
  `);

  // ── Escalated tickets ────────────────────────────────────────────────
  const { rows: escalatedRows } = await db.query(`
    SELECT
      t.ticket_id,
      t.status,
      t.reopen_count,
      t.created_at,
      c.name AS customer_name,
      d.brand AS device_brand,
      d.model AS device_model,
      u.name  AS assigned_to
    FROM tickets t
    JOIN customers c ON c.customer_id = t.customer_id
    LEFT JOIN devices d ON d.device_id = t.device_id
    LEFT JOIN users u   ON u.user_id   = t.assigned_user_id
    WHERE t.status = 'ESCALATED'
    ORDER BY t.created_at ASC
    LIMIT 5
  `);

  // ── Recent tickets (last 5 created) ─────────────────────────────────
  const { rows: recentRows } = await db.query(`
    SELECT
      t.ticket_id,
      t.status,
      t.ticket_type,
      t.created_at,
      c.name AS customer_name,
      d.brand AS device_brand,
      d.model AS device_model,
      u.name  AS assigned_to
    FROM tickets t
    JOIN customers c ON c.customer_id = t.customer_id
    LEFT JOIN devices d ON d.device_id = t.device_id
    LEFT JOIN users u   ON u.user_id   = t.assigned_user_id
    ORDER BY t.created_at DESC
    LIMIT 5
  `);

  // ── This month vs last month ──────────────────────────────────────────
  const { rows: monthRows } = await db.query(`
    SELECT
      COUNT(*) FILTER (
        WHERE created_at >= DATE_TRUNC('month', NOW())
      )::int AS this_month,
      COUNT(*) FILTER (
        WHERE created_at >= DATE_TRUNC('month', NOW() - INTERVAL '1 month')
          AND created_at <  DATE_TRUNC('month', NOW())
      )::int AS last_month
    FROM tickets
  `);

  const thisMonth = monthRows[0]?.this_month ?? 0;
  const lastMonth = monthRows[0]?.last_month ?? 0;
  const monthChange = lastMonth === 0 ? null
    : Math.round(((thisMonth - lastMonth) / lastMonth) * 100);

  return {
    summary: {
      total_open:          totalOpen,
      new:                 statusMap.NEW,
      assigned:            statusMap.ASSIGNED,
      in_progress:         statusMap.IN_PROGRESS,
      closed:              statusMap.CLOSED,
      reopened:            statusMap.REOPENED,
      escalated:           statusMap.ESCALATED,
      avg_resolution_hrs:  avgResolutionHrs,
      this_month:          thisMonth,
      last_month:          lastMonth,
      month_change_pct:    monthChange,
    },
    daily_tickets:    dailyRows,
    technicians:      techRows,
    escalated_tickets: escalatedRows,
    recent_tickets:   recentRows,
  };
};

module.exports = { getStats };