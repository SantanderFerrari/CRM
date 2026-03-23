const svc = require('./tickets.service');

// POST /api/tickets
const create = async (req, res, next) => {
  try {
    const { ticket, duplicates } = await svc.create(req.body, req.user.user_id);

    const response = { message: 'Ticket created.', ticket };

    // Warn caller if duplicates were found
    if (duplicates.length > 0) {
      response.warning  = `${duplicates.length} open ticket(s) found for this device. Ticket auto-linked.`;
      response.duplicates = duplicates;
    }

    res.status(201).json(response);
  } catch (err) { next(err); }
};

// GET /api/tickets
const getAll = async (req, res, next) => {
  try {
    const tickets = await svc.getAll(req.query);
    res.json({ tickets });
  } catch (err) { next(err); }
};

// GET /api/tickets/:id
const getById = async (req, res, next) => {
  try {
    const ticket = await svc.getById(req.params.id);
    res.json({ ticket });
  } catch (err) { next(err); }
};

// PATCH /api/tickets/:id/status
const updateStatus = async (req, res, next) => {
  try {
    const ticket = await svc.updateStatus(req.params.id, req.body.status, req.user.user_id);
    res.json({ message: `Ticket status updated to ${ticket.status}.`, ticket });
  } catch (err) { next(err); }
};

// PATCH /api/tickets/:id/assign
const assign = async (req, res, next) => {
  try {
    const ticket = await svc.assign(req.params.id, req.body.assigned_user_id);
    res.json({ message: 'Ticket assigned.', ticket });
  } catch (err) { next(err); }
};

// POST /api/tickets/:id/accessories
const addAccessory = async (req, res, next) => {
  try {
    const accessory = await svc.addAccessory(req.params.id, req.body);
    res.status(201).json({ message: 'Accessory logged.', accessory });
  } catch (err) { next(err); }
};

// GET /api/tickets/:id/accessories
const getAccessories = async (req, res, next) => {
  try {
    const accessories = await svc.getAccessories(req.params.id);
    res.json({ accessories });
  } catch (err) { next(err); }
};

// POST /api/tickets/:id/condition-report
const addConditionReport = async (req, res, next) => {
  try {
    const report = await svc.addConditionReport(req.params.id, req.body);
    res.status(201).json({ message: 'Condition report saved.', report });
  } catch (err) { next(err); }
};

// GET /api/tickets/:id/condition-report
const getConditionReports = async (req, res, next) => {
  try {
    const reports = await svc.getConditionReports(req.params.id);
    res.json({ reports });
  } catch (err) { next(err); }
};

module.exports = {
  create, getAll, getById, updateStatus, assign,
  addAccessory, getAccessories,
  addConditionReport, getConditionReports,
};