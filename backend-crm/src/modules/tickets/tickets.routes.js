const { Router } = require('express');
const ctrl = require('./tickets.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

const router = Router();
router.use(authenticate);

// Core ticket CRUD
router.get( '/',    ctrl.getAll);
router.get( '/:id', ctrl.getById);
router.post('/',    authorize('CUSTOMER_CARE', 'ADMIN'), ctrl.create);

// Status transitions
router.patch('/:id/status', ctrl.updateStatus);

// Assignment (Customer Care or Supervisor)
router.patch('/:id/assign',
  authorize('CUSTOMER_CARE', 'SUPERVISOR', 'ADMIN'),
  ctrl.assign
);

// Accessories
router.get( '/:id/accessories', ctrl.getAccessories);
router.post('/:id/accessories',
  authorize('CUSTOMER_CARE', 'TECHNICIAN', 'ADMIN'),
  ctrl.addAccessory
);

// Device condition reports
router.get( '/:id/condition-report', ctrl.getConditionReports);
router.post('/:id/condition-report',
  authorize('TECHNICIAN', 'CUSTOMER_CARE', 'ADMIN'),
  ctrl.addConditionReport
);

module.exports = router;