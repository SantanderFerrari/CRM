const db = require('../../db');

const getAll = async ({ customer_id, limit = 50, offset = 0 }) => {
  const params = [];
  let where = '';

  if (customer_id) {
    params.push(customer_id);
    where = `WHERE d.customer_id = $1`;
  }

  params.push(limit, offset);
  const { rows } = await db.query(
    `SELECT d.*, c.name AS customer_name
     FROM devices d
     JOIN customers c ON c.customer_id = d.customer_id
     ${where}
     ORDER BY d.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return rows;
};

const getById = async (id) => {
  const { rows } = await db.query(
    `SELECT d.*, c.name AS customer_name
     FROM devices d
     JOIN customers c ON c.customer_id = d.customer_id
     WHERE d.device_id = $1`,
    [id]
  );
  if (!rows.length) throw { status: 404, message: 'Device not found.' };
  return rows[0];
};

const create = async ({ customer_id, serial_number, brand, model, device_type }) => {
  // Verify customer exists
  const { rows: cx } = await db.query(
    `SELECT customer_id FROM customers WHERE customer_id = $1`, [customer_id]
  );
  if (!cx.length) throw { status: 404, message: 'Customer not found.' };

  const { rows } = await db.query(
    `INSERT INTO devices (customer_id, serial_number, brand, model, device_type)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [customer_id, serial_number, brand, model, device_type]
  );
  return rows[0];
};

const update = async (id, { serial_number, brand, model, device_type }) => {
  const fields = [];
  const params = [];

  if (serial_number !== undefined) { params.push(serial_number); fields.push(`serial_number = $${params.length}`); }
  if (brand         !== undefined) { params.push(brand);         fields.push(`brand         = $${params.length}`); }
  if (model         !== undefined) { params.push(model);         fields.push(`model         = $${params.length}`); }
  if (device_type   !== undefined) { params.push(device_type);   fields.push(`device_type   = $${params.length}`); }

  if (!fields.length) throw { status: 400, message: 'No fields to update.' };

  params.push(id);
  const { rows } = await db.query(
    `UPDATE devices SET ${fields.join(', ')}
     WHERE device_id = $${params.length} RETURNING *`,
    params
  );
  if (!rows.length) throw { status: 404, message: 'Device not found.' };
  return rows[0];
};

module.exports = { getAll, getById, create, update };