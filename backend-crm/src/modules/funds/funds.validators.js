// ── validators ────────────────────────────────────────────────────────────
const { body, param, query } = require('express-validator');

const uuidParam = (name) => param(name).isUUID(4).withMessage(`${name} must be a valid UUID.`);

const createRules = [
  body('purpose').trim().notEmpty().withMessage('purpose is required.'),
  body('category').trim().notEmpty().withMessage('category is required.'),
  body('justification').trim().notEmpty().withMessage('justification is required.'),
  body('amount_kes').isFloat({ min: 1 }).withMessage('amount_kes must be a positive number.'),
  body('amount_words').trim().notEmpty().withMessage('amount_words is required.'),
  body('department').optional({ nullable: true }).trim(),
];

const rejectRules = [
  uuidParam('id'),
  body('rejection_reason').trim().notEmpty().withMessage('rejection_reason is required.'),
];

const listRules = [
  query('status').optional().isIn(['DRAFT','PENDING_SUPERVISOR','PENDING_FINANCE','APPROVED','REJECTED']),
  query('limit').optional().isInt({ min: 1, max: 200 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
];

module.exports = { createRules, rejectRules, listRules, idRules: [uuidParam('id')] };