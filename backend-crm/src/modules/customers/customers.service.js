const db = require('../../db');

const getAll = async ({ search, limit = 50, offset = 0 }) => {
  const params = [];
  let where = '';

  if (search) {
    params.push(`%${search}%`);
    where = `WHERE name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1`;
  }

  params.push(limit, offset);
  const { rows } = await db.query(
    `SELECT * FROM customers ${where}
     ORDER BY created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return rows;
};

const getById = async (id) => {
  const { rows } = await db.query(
    `SELECT * FROM customers WHERE customer_id = $1`, [id]
  );
  if (!rows.length) throw { status: 404, message: 'Customer not found.' };
  return rows[0];
};

const create = async ({ name, phone, email, address }) => {
  const { rows } = await db.query(
    `INSERT INTO customers (name, phone, email, address)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [name, phone, email, address]
  );
  return rows[0];
};

const update = async (id, { name, phone, email, address }) => {
  const fields = [];
  const params = [];

  if (name    !== undefined) { params.push(name);    fields.push(`name    = $${params.length}`); }
  if (phone   !== undefined) { params.push(phone);   fields.push(`phone   = $${params.length}`); }
  if (email   !== undefined) { params.push(email);   fields.push(`email   = $${params.length}`); }
  if (address !== undefined) { params.push(address); fields.push(`address = $${params.length}`); }

  if (!fields.length) throw { status: 400, message: 'No fields to update.' };

  params.push(id);
  const { rows } = await db.query(
    `UPDATE customers SET ${fields.join(', ')}
     WHERE customer_id = $${params.length} RETURNING *`,
    params
  );
  if (!rows.length) throw { status: 404, message: 'Customer not found.' };
  return rows[0];
};

const remove = async (id) => {
  const { rowCount } = await db.query(
    `DELETE FROM customers WHERE customer_id = $1`, [id]
  );
  if (!rowCount) throw { status: 404, message: 'Customer not found.' };
};

// Get all devices belonging to a customer
const getDevices = async (customerId) => {
  const { rows } = await db.query(
    `SELECT * FROM devices WHERE customer_id = $1 ORDER BY created_at DESC`,
    [customerId]
  );
  return rows;
};

module.exports = { getAll, getById, create, update, remove, getDevices };