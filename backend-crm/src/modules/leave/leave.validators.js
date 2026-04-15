const { body, param, query } = require('express-validator');

const CATEGORIES = ['ANNUAL_LEAVE','SICK_LEAVE','MATERNITY_LEAVE','PATERNITY_LEAVE','COMPASSIONATE_LEAVE'];
const STATUSES   = ['PENDING','APPROVED','REJECTED','CANCELLED'];

const uuidParam = (name) => param(name).isUUID(4).withMessage(`${name} must be a valid UUID.`);

const createRules = [
  body('category')
    .notEmpty().isIn(CATEGORIES)
    .withMessage(`category must be one of: ${CATEGORIES.join(', ')}.`),
  body('start_date')
    .notEmpty().isISO8601().withMessage('start_date must be a valid date (YYYY-MM-DD).'),
  body('end_date')
    .notEmpty().isISO8601().withMessage('end_date must be a valid date (YYYY-MM-DD).'),
  body('duty_resume_date')
    .notEmpty().isISO8601().withMessage('duty_resume_date must be a valid date.'),
  body('days_requested')
    .notEmpty().isFloat({ min: 0.5 }).withMessage('days_requested must be at least 0.5.'),
  body('reason')
    .optional({ nullable: true }).trim(),
  body('sick_certificate')
    .optional().isBoolean(),
];

const reviewRules = [
  uuidParam('id'),
  body('action').notEmpty().isIn(['APPROVED','REJECTED']).withMessage('action must be APPROVED or REJECTED.'),
  body('review_notes').optional({ nullable: true }).trim(),
];

const listRules = [
  query('status').optional().isIn(STATUSES),
  query('category').optional().isIn(CATEGORIES),
  query('user_id').optional().isUUID(4),
  query('limit').optional().isInt({ min: 1, max: 200 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
];

module.exports = { createRules, reviewRules, listRules, idRules: [uuidParam('id')] };