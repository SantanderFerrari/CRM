const { body } = require('express-validator');
 
const requestOtpRules = [
  body('email')
    .if((value, { req }) => !req.body.phone)
    .notEmpty().withMessage('Provide either email or phone.')
    .isEmail().withMessage('Must be a valid email address.')
    .normalizeEmail(),
  body('phone')
    .if((value, { req }) => !req.body.email)
    .notEmpty().withMessage('Provide either email or phone.')
    .trim(),
];
 
const resetPasswordRules = [
  body('otp')
    .notEmpty().withMessage('OTP is required.')
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits.')
    .isNumeric().withMessage('OTP must be numeric.'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain a number.'),
  body('email')
    .optional({ nullable: true })
    .isEmail().normalizeEmail(),
  body('phone')
    .optional({ nullable: true })
    .trim(),
];
 
module.exports = { requestOtpRules, resetPasswordRules };