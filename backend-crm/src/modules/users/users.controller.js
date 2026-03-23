const usersService = require('./users.service');
const { asyncHandler } = require('../../utils/asyncHandler');

// GET /api/users
module.exports = {
getAll : asyncHandler(async (req, res) => {
  try {
    const { role, is_active, limit, offset } = req.query;
    const users = await usersService.getAll({
      role,
      is_active: is_active !== undefined ? is_active === 'true' : undefined,
      limit:  parseInt(limit,  10) || 50,
      offset: parseInt(offset, 10) || 0,
    });
    res.json({ users });
  } catch (err) { next(err); }
}),

// GET /api/users/:id
getById : asyncHandler(async (req, res) => {
  try {
    const user = await usersService.getById(req.params.id);
    res.json({ user });
  } catch (err) { next(err); }
}),

// PATCH /api/users/:id
update : asyncHandler(async (req, res) => {
  try {
    // Users can edit only themselves; Admins can edit anyone
    if (req.user.role !== 'ADMIN' && req.user.user_id !== req.params.id) {
      return res.status(403).json({ message: 'Forbidden.' });
    }
    const user = await usersService.update(req.params.id, req.body);
    res.json({ message: 'User updated.', user });
  } catch (err) { next(err); }
}),

// POST /api/users/change-password
changePassword : asyncHandler(async (req, res) => {
  try {
    await usersService.changePassword(req.user.user_id, req.body);
    res.json({ message: 'Password changed successfully.' });
  } catch (err) { next(err); }
}),

// PATCH /api/users/:id/deactivate
deactivate : asyncHandler(async (req, res) => {
  try {
    const user = await usersService.setActive(req.params.id, false);
    res.json({ message: 'User deactivated.', user });
  } catch (err) { next(err); }
}),

// PATCH /api/users/:id/activate
activate : asyncHandler(async (req, res) => {
  try {
    const user = await usersService.setActive(req.params.id, true);
    res.json({ message: 'User activated.', user });
  } catch (err) { next(err); }
}),

};