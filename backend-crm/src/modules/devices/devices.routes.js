const { Router } = require('express');
const ctrl = require('./devices.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

const router = Router();
router.use(authenticate);

router.get(  '/',     ctrl.getAll);
router.get(  '/:id',  ctrl.getById);
router.post( '/',     authorize('CUSTOMER_CARE', 'ADMIN'), ctrl.create);
router.patch('/:id',  authorize('CUSTOMER_CARE', 'ADMIN'), ctrl.update);

module.exports = router;.0