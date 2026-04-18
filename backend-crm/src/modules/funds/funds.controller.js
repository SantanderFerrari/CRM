const svc = require('./funds.service');
const { asyncHandler } = require('../../utils/asyncHandler');

module.exports = {
  create: asyncHandler(async (req, res) => {
    const req_ = await svc.create(req.user.user_id, req.body);
    res.status(201).json({ message: 'Requisition created as draft.', requisition: req_ });
  }),

  getAll: asyncHandler(async (req, res) => {
    const list = await svc.getAll(req.query, req.user.user_id, req.user.role);
    res.json({ requisitions: list });
  }),

  getById: asyncHandler(async (req, res) => {
    const req_ = await svc.getById(req.params.id);
    res.json({ requisition: req_ });
  }),

  submit: asyncHandler(async (req, res) => {
    const req_ = await svc.submit(req.params.id, req.user.user_id);
    res.json({ message: 'Requisition submitted for approval.', requisition: req_ });
  }),

  supervisorApprove: asyncHandler(async (req, res) => {
    const req_ = await svc.supervisorApprove(req.params.id, req.user.user_id);
    res.json({ message: 'Approved and forwarded to finance.', requisition: req_ });
  }),

  financeApprove: asyncHandler(async (req, res) => {
    const req_ = await svc.financeApprove(req.params.id, req.user.user_id);
    res.json({ message: 'Requisition fully approved.', requisition: req_ });
  }),

  reject: asyncHandler(async (req, res) => {
    const req_ = await svc.reject(req.params.id, req.user.user_id, req.body.rejection_reason);
    res.json({ message: 'Requisition rejected.', requisition: req_ });
  }),

  getCategories: asyncHandler(async (req, res) => {
    res.json({ categories: svc.CATEGORIES });
  }),
};