const { Router } = require('express');
const ctrl = require('./leave.controller');
const v    = require('./leave.validators');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');

const router = Router();
router.use(authenticate);

router.get( '/entitlements',            ctrl.getEntitlements);
router.get( '/balance',                 ctrl.getBalance);
router.get( '/balance/:userId',
  authorize('SUPERVISOR','HEAD_OF_DEPARTMENT','HUMAN_RESOURCES','ADMIN'),
  ctrl.getBalance
);
router.get( '/',      v.listRules,  validate, ctrl.getAll);
router.get( '/:id',   v.idRules,    validate, ctrl.getById);
router.post('/',      v.createRules,validate, ctrl.create);
router.patch('/:id/review',
  authorize('SUPERVISOR','HEAD_OF_DEPARTMENT','HUMAN_RESOURCES','ADMIN'),
  v.reviewRules, validate, ctrl.review
);
router.patch('/:id/cancel', v.idRules, validate, ctrl.cancel);

module.exports = router;