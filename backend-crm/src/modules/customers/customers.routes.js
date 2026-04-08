const { Router } = require('express');
const ctrl = require('./customers.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');
const { createRules, updateRules, listRules, idRules } = require('./customers.validate');


const router = Router();
router.use(authenticate);

router.get(   '/',           listRules, validate, ctrl.getAll);
router.get(   '/:id',        idRules, validate, ctrl.getById);
router.get(   '/:id/devices',idRules, validate, ctrl.getDevices);
router.post(  '/',           authorize('CUSTOMER_CARE', 'ADMIN'), createRules, validate, ctrl.create);
router.patch( '/:id',        authorize('CUSTOMER_CARE', 'ADMIN'), updateRules, validate, ctrl.update);
router.delete('/:id',        authorize('ADMIN'), idRules, validate, ctrl.remove);

module.exports = router;