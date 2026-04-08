const { body, param, query } = require('express-validator');

const uuidParam = (name) =>
  param(name).isUUID(4).withMessage(`${name} must be a valid UUID.`);

const createRules = [
  body('name')
    .trim().notEmpty().withMessage('Name is required.')
    .isLength({ max: 150 }).withMessage('Name must be at most 150 characters.'),
  body('phone')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 30 }).withMessage('Phone must be at most 30 characters.'),
  body('email')
    .optional({ nullable: true })
    .trim().isEmail().withMessage('Must be a valid email address.')
    .normalizeEmail(),
  body('address')
    .optional({ nullable: true })
    .trim(),
  body('kra_pin')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 11 }).withMessage('KRA PIN must be at most 11 characters. With 2 letters and 9 digits in between.')
       

  ];

const updateRules = [
  uuidParam('id'),
  body('name')
    .optional()
    .trim().notEmpty().withMessage('Name cannot be blank.')
    .isLength({ max: 150 }),
  body('phone')
    .optional({ nullable: true })
    .trim().isLength({ max: 30 }),
  body('email')
    .optional({ nullable: true })
    .trim().isEmail().withMessage('Must be a valid email address.')
    .normalizeEmail(),
  body('address')
    .optional({ nullable: true })
    .trim(),
  body('kra_pin')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 11 }).withMessage('KRA PIN must be  11 characters. With 2 letters and 9 digits in between.')
      

  ];

const listRules = [
  query('limit').optional().isInt({ min: 1, max: 200 }).withMessage('limit must be 1–200.').toInt(),
  query('offset').optional().isInt({ min: 0 }).withMessage('offset must be >= 0.').toInt(),
];

const idRules = [uuidParam('id')];

module.exports = { createRules, updateRules, listRules, idRules };