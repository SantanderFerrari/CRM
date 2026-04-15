const svc = require('./leave.service');
const { asyncHandler } = require('../../utils/asyncHandler');

const controller = {
  create: asyncHandler(async (req, res) => {
    const result = await svc.create(req.user.user_id, req.body);
    const response = { message: 'Leave request submitted.', leave: result };
    if (result.warning) response.warning = result.warning;
    res.status(201).json(response);
  }),

  getAll: asyncHandler(async (req, res) => {
    const leaves = await svc.getAll(req.query, req.user.user_id, req.user.role);
    res.json({ leaves });
  }),

  getById: asyncHandler(async (req, res) => {
    const leave = await svc.getById(req.params.id);
    res.json({ leave });
  }),

  review: asyncHandler(async (req, res) => {
    const leave = await svc.review(req.params.id, req.user.user_id, req.body);
    res.json({ message: `Leave request ${req.body.action.toLowerCase()}.`, leave });
  }),

  cancel: asyncHandler(async (req, res) => {
    const leave = await svc.cancel(req.params.id, req.user.user_id);
    res.json({ message: 'Leave request cancelled.', leave });
  }),

  getBalance: asyncHandler(async (req, res) => {
    const userId = req.params.userId || req.user.user_id;
    const balance = await svc.getBalance(userId);
    res.json({ balance });
  }),

  getEntitlements: asyncHandler(async (req, res) => {
    res.json({ entitlements: svc.ENTITLEMENTS });
  }),
};

module.exports = controller;