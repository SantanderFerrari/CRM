const { Router } = require('express');
const ctrl = require('./funds.controller');
const v    = require('./funds.validators');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');

const router = Router();
router.use(authenticate);

router.get( '/categories',          ctrl.getCategories);
router.get( '/',      v.listRules,  validate, ctrl.getAll);
router.get( '/:id',   v.idRules,    validate, ctrl.getById);
router.post('/',      v.createRules,validate, ctrl.create);
router.patch('/:id/submit',  v.idRules, validate, ctrl.submit);

router.patch('/:id/supervisor-approve',
  authorize('SUPERVISOR','HEAD_OF_DEPARTMENT','ADMIN'),
  v.idRules, validate, ctrl.supervisorApprove
);
router.patch('/:id/finance-approve',
  authorize('HEAD_OF_DEPARTMENT','ADMIN','HUMAN_RESOURCES'),
  v.idRules, validate, ctrl.financeApprove
);
router.patch('/:id/reject',
  authorize('SUPERVISOR','HEAD_OF_DEPARTMENT','ADMIN','HUMAN_RESOURCES'),
  v.rejectRules, validate, ctrl.reject
);

module.exports = router;