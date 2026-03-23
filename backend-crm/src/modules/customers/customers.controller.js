const svc = require('./customers.service');

const getAll   = async (req, res, next) => { try { res.json({ customers: await svc.getAll(req.query) }); } catch(e) { next(e); } };
const getById  = async (req, res, next) => { try { res.json({ customer: await svc.getById(req.params.id) }); } catch(e) { next(e); } };
const create   = async (req, res, next) => { try { res.status(201).json({ message: 'Customer created.', customer: await svc.create(req.body) }); } catch(e) { next(e); } };
const update   = async (req, res, next) => { try { res.json({ message: 'Customer updated.', customer: await svc.update(req.params.id, req.body) }); } catch(e) { next(e); } };
const remove   = async (req, res, next) => { try { await svc.remove(req.params.id); res.json({ message: 'Customer deleted.' }); } catch(e) { next(e); } };
const getDevices = async (req, res, next) => { try { res.json({ devices: await svc.getDevices(req.params.id) }); } catch(e) { next(e); } };

module.exports = { getAll, getById, create, update, remove, getDevices };