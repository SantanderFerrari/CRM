const { body, param, query } = require('express-validator');

const uuidParam = (name) =>
  param(name).isUUID(4).withMessage(`${name} must be a valid UUID.`);

const createRules = [
  body('customer_id')
    .notEmpty().withMessage('customer_id is required.')
    .isUUID(4).withMessage('customer_id must be a valid UUID.'),
  body('serial_number')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 }).withMessage('serial_number must be at most 100 characters.'),
  body('brand')
    .optional({ nullable: true })
    .trim().isLength({ max: 100 }),
  body('model')
    .optional({ nullable: true })
    .trim().isLength({ max: 100 }),
  body('device_type')
    .optional({ nullable: true })
    .trim().isLength({ max: 100 }),
];

const updateRules = [
  uuidParam('id'),
  body('serial_number').optional({ nullable: true }).trim().isLength({ max: 100 }),
  body('brand').optional({ nullable: true }).trim().isLength({ max: 100 }),
  body('model').optional({ nullable: true }).trim().isLength({ max: 100 }),
  body('device_type').optional({ nullable: true }).trim().isLength({ max: 100 }),
];

const listRules = [
  query('customer_id').optional().isUUID(4).withMessage('customer_id must be a valid UUID.'),
  query('limit').optional().isInt({ min: 1, max: 200 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
];

const idRules = [uuidParam('id')];

module.exports = { createRules, updateRules, listRules, idRules };