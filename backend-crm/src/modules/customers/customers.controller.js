const svc = require('./customers.service');
const { asyncHandler } = require('../../utils/asyncHandler');

module.exports={
getAll   : asyncHandler(async (req, res) => { res.json({ customers: await svc.getAll(req.query) }); }),
getById  : asyncHandler(async (req, res) => { res.json({ customer: await svc.getById(req.params.id) }); }),
create   : asyncHandler(async (req, res) => { res.status(201).json({ message: 'Customer created.', customer: await svc.create(req.body) }); }),
update   : asyncHandler(async (req, res) => { res.json({ message: 'Customer updated.', customer: await svc.update(req.params.id, req.body) }); }),
remove   : asyncHandler(async (req, res) => { res.json({ message: 'Customer deleted.' }); }),
getDevices : asyncHandler(async (req, res) => { res.json({ devices: await svc.getDevices(req.params.id) }); })
};

