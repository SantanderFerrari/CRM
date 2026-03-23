const { Router } = require('express');
const controller = require('./auth.controller');
const { validate, registerRules, loginRules, refreshRules } = require('./auth.validators');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

const router = Router();

// Public routes
router.post('/register', registerRules, validate, controller.register);
router.post('/login',    loginRules,    validate, controller.login);
router.post('/refresh',  refreshRules,  validate, controller.refresh);
router.post('/logout',                            controller.logout);

// Protected routes
router.get( '/me',          authenticate,                        controller.me);
router.post('/logout-all',  authenticate,                        controller.logoutAll);

module.exports = router;