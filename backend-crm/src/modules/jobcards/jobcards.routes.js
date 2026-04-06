const { Router } = require('express');
const ctrl = require('./jobcards.controller');
const v    = require('./jobcards.validators');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');

const router = Router();
router.use(authenticate);

// ── Core ───────────────────────────────────────────────────────────────────
router.get( '/',    v.listRules, validate, ctrl.getAll);
router.get( '/:id', v.idRules,   validate, ctrl.getById);
router.post('/',
  authorize('TECHNICIAN', 'SUPERVISOR', 'ADMIN'),
  v.createRules, validate, ctrl.create
);
router.patch('/:id/status',
  v.updateStatusRules, validate, ctrl.updateStatus
);

// ── Checklist ─────────────────────────────────────────────────────────────
router.post(  '/:id/checklist',
  authorize('TECHNICIAN', 'ADMIN'),
  v.checklistItemRules, validate, ctrl.addChecklistItem
);
router.patch( '/:id/checklist/:checklistId',
  authorize('TECHNICIAN', 'ADMIN'),
  v.toggleChecklistRules, validate, ctrl.toggleChecklistItem
);

// ── Time logs ──────────────────────────────────────────────────────────────
router.post('/:id/time-logs',
  authorize('TECHNICIAN', 'ADMIN'),
  v.timeLogRules, validate, ctrl.addTimeLog
);

// ── Parts used ─────────────────────────────────────────────────────────────
router.post('/:id/parts',
  authorize('TECHNICIAN', 'ADMIN'),
  v.partsUsedRules, validate, ctrl.addPartsUsed
);

// ── Requisitions ───────────────────────────────────────────────────────────
router.post('/:id/requisitions',
  authorize('TECHNICIAN', 'ADMIN'),
  v.requisitionRules, validate, ctrl.createRequisition
);
router.patch('/:id/requisitions/:requisitionId/approve',
  authorize('SUPERVISOR', 'ADMIN'),
  ctrl.approveRequisition
);
router.patch('/:id/requisitions/:requisitionId/reject',
  authorize('SUPERVISOR', 'ADMIN'),
  ctrl.rejectRequisition
);

// ── Incidents ──────────────────────────────────────────────────────────────
router.post('/:id/incidents',
  authorize('TECHNICIAN', 'CUSTOMER_CARE', 'ADMIN'),
  v.incidentRules, validate, ctrl.addIncident
);

// ── Inventory lookup ───────────────────────────────────────────────────────
router.get('/inventory/list', ctrl.getInventory);

module.exports = router;