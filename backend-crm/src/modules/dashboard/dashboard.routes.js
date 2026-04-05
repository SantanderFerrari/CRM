const { Router } = require('express');
const ctrl = require('./dashboard.controller');
const { authenticate } = require('../../middleware/auth.middleware');

const router = Router();
router.use(authenticate);

router.get('/stats', ctrl.getStats);

module.exports = router;