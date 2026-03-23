const { body, validationResult } = require('express-validator');

const VALID_ROLES = [
  'CUSTOMER_CARE',
  'TECHNICIAN',
  'SUPERVISOR',
  'SALES_REPRESENTATIVE',
  'HEAD_OF_DEPARTMENT',
  'HUMAN_RESOURCES',
  'ADMIN',
];

// Middleware to check validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ message: 'Validation failed.', errors: errors.array() });
  }
  next();
};

const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required.').isLength({ max: 150 }),
  body('email').trim().isEmail().withMessage('Valid email is required.').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain a number.'),
  body('role').isIn(VALID_ROLES).withMessage(`Role must be one of: ${VALID_ROLES.join(', ')}.`),
];

const loginRules = [
  body('email').trim().isEmail().withMessage('Valid email is required.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.'),
];

const refreshRules = [
  body('refreshToken').notEmpty().withMessage('Refresh token is required.'),
];

module.exports = { validate, registerRules, loginRules, refreshRules };