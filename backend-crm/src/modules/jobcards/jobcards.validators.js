const { body, param, query } = require('express-validator');

const JC_STATUSES = ['CREATED','CHECKLIST_PENDING','IN_PROGRESS','COMPLETED','PENDING_APPROVAL','CLOSED'];

const uuidParam = (name) =>
  param(name).isUUID(4).withMessage(`${name} must be a valid UUID.`);

const createRules = [
  body('ticket_id').notEmpty().isUUID(4).withMessage('ticket_id must be a valid UUID.'),
  body('technician_id').notEmpty().isUUID(4).withMessage('technician_id must be a valid UUID.'),
  body('supervisor_id').optional({ nullable: true }).isUUID(4),
  body('diagnosis_notes').optional({ nullable: true }).trim(),
];

const updateStatusRules = [
  uuidParam('id'),
  body('status').notEmpty().isIn(JC_STATUSES)
    .withMessage(`status must be one of: ${JC_STATUSES.join(', ')}.`),
  body('repair_notes').optional({ nullable: true }).trim(),
  body('diagnosis_notes').optional({ nullable: true }).trim(),
  body('approval_deferred').optional({ nullable: true }).isBoolean(),
];

const checklistItemRules = [
  uuidParam('id'),
  body('item_name').trim().notEmpty().withMessage('item_name is required.').isLength({ max: 255 }),
];

const toggleChecklistRules = [
  uuidParam('id'),
  uuidParam('checklistId'),
  body('is_completed').isBoolean().withMessage('is_completed must be true or false.'),
];

const timeLogRules = [
  uuidParam('id'),
  body('start_time').notEmpty().isISO8601().withMessage('start_time must be a valid ISO date.'),
  body('end_time').optional({ nullable: true }).isISO8601().withMessage('end_time must be a valid ISO date.'),
  body('notes').optional({ nullable: true }).trim(),
];

const partsUsedRules = [
  uuidParam('id'),
  body('inventory_id').notEmpty().isUUID(4).withMessage('inventory_id must be a valid UUID.'),
  body('quantity_used').isInt({ min: 1 }).withMessage('quantity_used must be at least 1.'),
];

const requisitionRules = [
  uuidParam('id'),
  body('inventory_id').notEmpty().isUUID(4).withMessage('inventory_id must be a valid UUID.'),
  body('quantity_requested').isInt({ min: 1 }).withMessage('quantity_requested must be at least 1.'),
];

const incidentRules = [
  uuidParam('id'),
  body('description').trim().notEmpty().withMessage('description is required.'),
];

const listRules = [
  query('ticket_id').optional().isUUID(4),
  query('technician_id').optional().isUUID(4),
  query('status').optional().isIn(JC_STATUSES),
  query('limit').optional().isInt({ min: 1, max: 200 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
];

const idRules = [uuidParam('id')];

module.exports = {
  createRules, updateStatusRules, checklistItemRules, toggleChecklistRules,
  timeLogRules, partsUsedRules, requisitionRules, incidentRules, listRules, idRules,
};