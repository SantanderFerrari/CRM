const svc = require('./devices.service');
const { asyncHandler } = require('../../utils/asyncHandler');

module.exports = {
  getAll: asyncHandler(async (req, res) => { res.json({ devices: await svc.getAll(req.query) }); }),
  getById: asyncHandler(async (req, res) => { res.json({ device: await svc.getById(req.params.id) }); }),
  create: asyncHandler(async (req, res) => { res.status(201).json({ message: 'Device created.', device: await svc.create(req.body) }); }),
  update: asyncHandler(async (req, res) => { res.json({ message: 'Device updated.', device: await svc.update(req.params.id, req.body) }); })
};
