const { Router } = require('express');
const ctrl = require('./customers.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

const router = Router();
router.use(authenticate);

router.get(   '/',           ctrl.getAll);
router.get(   '/:id',        ctrl.getById);
router.get(   '/:id/devices',ctrl.getDevices);
router.post(  '/',           authorize('CUSTOMER_CARE', 'ADMIN'), ctrl.create);
router.patch( '/:id',        authorize('CUSTOMER_CARE', 'ADMIN'), ctrl.update);
router.delete('/:id',        authorize('ADMIN'),                  ctrl.remove);

module.exports = router;