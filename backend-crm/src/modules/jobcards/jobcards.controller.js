const svc = require('./jobcards.service');
const { asyncHandler } = require('../../utils/asyncHandler');

module.exports = {
  create: asyncHandler(async (req, res) => {
    const jc = await svc.create(req.body);
    res.status(201).json({ message: 'Job card created.', job_card: jc });
  }),

  getAll: asyncHandler(async (req, res) => {
    const jcs = await svc.getAll(req.query);
    res.json({ job_cards: jcs });
  }),

  getById: asyncHandler(async (req, res) => {
    const jc = await svc.getById(req.params.id);
    res.json({ job_card: jc });
  }),

  updateStatus: asyncHandler(async (req, res) => {
    const jc = await svc.updateStatus(req.params.id, req.body.status, req.body);
    res.json({ message: `Job card status updated to ${jc.status}.`, job_card: jc });
  }),

  // Checklist
  addChecklistItem: asyncHandler(async (req, res) => {
    const item = await svc.addChecklistItem(req.params.id, req.body);
    res.status(201).json({ message: 'Checklist item added.', item });
  }),

  toggleChecklistItem: asyncHandler(async (req, res) => {
    const item = await svc.toggleChecklistItem(req.params.checklistId, req.body.is_completed);
    res.json({ message: 'Checklist item updated.', item });
  }),

  // Time logs
  addTimeLog: asyncHandler(async (req, res) => {
    const log = await svc.addTimeLog(req.params.id, {
      ...req.body, technician_id: req.user.user_id,
    });
    res.status(201).json({ message: 'Time log added.', log });
  }),

  // Parts
  addPartsUsed: asyncHandler(async (req, res) => {
    const part = await svc.addPartsUsed(req.params.id, req.body);
    res.status(201).json({ message: 'Parts logged.', part });
  }),

  // Requisitions
  createRequisition: asyncHandler(async (req, res) => {
    const req_ = await svc.createRequisition(req.params.id, {
      ...req.body, requested_by: req.user.user_id,
    });
    res.status(201).json({ message: 'Requisition raised.', requisition: req_ });
  }),

  approveRequisition: asyncHandler(async (req, res) => {
    const req_ = await svc.approveRequisition(req.params.requisitionId, req.user.user_id);
    res.json({ message: 'Requisition approved.', requisition: req_ });
  }),

  rejectRequisition: asyncHandler(async (req, res) => {
    const req_ = await svc.rejectRequisition(req.params.requisitionId, req.user.user_id);
    res.json({ message: 'Requisition rejected.', requisition: req_ });
  }),

  // Incidents
  addIncident: asyncHandler(async (req, res) => {
    const incident = await svc.addIncident(req.params.id, {
      ...req.body, reported_by: req.user.user_id,
    });
    res.status(201).json({ message: 'Incident logged.', incident });
  }),

  // Inventory
  getInventory: asyncHandler(async (req, res) => {
    const items = await svc.getInventory();
    res.json({ inventory: items });
  }),
};