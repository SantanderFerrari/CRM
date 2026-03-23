const { body, param, query } = require('express-validator');

const TICKET_STATUSES = [
  'NEW', 'ASSIGNED', 'IN_PROGRESS',
  'CLOSED_CUST_PICKUP', 'CLOSED', 'REOPENED', 'ESCALATED',
];

const DEVICE_CONDITIONS = ['GOOD', 'FAIR', 'DAMAGED', 'CRITICAL'];

const uuidParam = (name) =>
  param(name).isUUID(4).withMessage(`${name} must be a valid UUID.`);

// POST /api/tickets
const createRules = [
  body('customer_id')
    .notEmpty().withMessage('customer_id is required.')
    .isUUID(4).withMessage('customer_id must be a valid UUID.'),
  body('device_id')
    .optional({ nullable: true })
    .isUUID(4).withMessage('device_id must be a valid UUID.'),
  body('ticket_type')
    .optional({ nullable: true })
    .trim().isLength({ max: 100 }),
  body('notes')
    .optional({ nullable: true })
    .trim(),
];

// PATCH /api/tickets/:id/status
const updateStatusRules = [
  uuidParam('id'),
  body('status')
    .notEmpty().withMessage('status is required.')
    .isIn(TICKET_STATUSES)
    .withMessage(`status must be one of: ${TICKET_STATUSES.join(', ')}.`),
];

// PATCH /api/tickets/:id/assign
const assignRules = [
  uuidParam('id'),
  body('assigned_user_id')
    .notEmpty().withMessage('assigned_user_id is required.')
    .isUUID(4).withMessage('assigned_user_id must be a valid UUID.'),
];

// POST /api/tickets/:id/accessories
const accessoryRules = [
  uuidParam('id'),
  body('description')
    .trim().notEmpty().withMessage('description is required.')
    .isLength({ max: 255 }),
  body('condition')
    .optional()
    .isIn(DEVICE_CONDITIONS)
    .withMessage(`condition must be one of: ${DEVICE_CONDITIONS.join(', ')}.`),
  body('notes')
    .optional({ nullable: true })
    .trim(),
];

// POST /api/tickets/:id/condition-report
const conditionReportRules = [
  uuidParam('id'),
  body('condition_summary')
    .optional()
    .isIn(DEVICE_CONDITIONS)
    .withMessage(`condition_summary must be one of: ${DEVICE_CONDITIONS.join(', ')}.`),
  body('condition_notes')
    .optional({ nullable: true })
    .trim(),
  body('inspection_name')
    .optional({ nullable: true })
    .trim().isLength({ max: 150 }),
  body('accessory_id')
    .optional({ nullable: true })
    .isUUID(4).withMessage('accessory_id must be a valid UUID.'),
];

// GET /api/tickets (list filters)
const listRules = [
  query('status')
    .optional()
    .isIn(TICKET_STATUSES)
    .withMessage(`status must be one of: ${TICKET_STATUSES.join(', ')}.`),
  query('assigned_user_id').optional().isUUID(4),
  query('customer_id').optional().isUUID(4),
  query('limit').optional().isInt({ min: 1, max: 200 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
];

const idRules = [uuidParam('id')];

module.exports = {
  createRules,
  updateStatusRules,
  assignRules,
  accessoryRules,
  conditionReportRules,
  listRules,
  idRules,
};