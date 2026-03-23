const authService = require('./auth.service');
const { asyncHandler } = require('../../utils/asyncHandler');

// POST /api/auth/register
module.exports={
register : asyncHandler(async (req, res, ) => {
  const user = await authService.register(req.body);
  res.status(201).json({ message: 'User registered successfully.', user });
}),

// POST /api/auth/login
login : async (req, res, next) => {
  try {
    const data = await authService.login(req.body);
    res.json(data);
  } catch (err) {
    next(err);
  }
},

// POST /api/auth/refresh
refresh : async (req, res, next) => {
  try {
    const tokens = await authService.refresh(req.body.refreshToken);
    res.json(tokens);
  } catch (err) {
    next(err);
  }
},

// POST /api/auth/logout
logout : async (req, res, next) => {
  try {
    await authService.logout(req.body.refreshToken);
    res.json({ message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
},

// POST /api/auth/logout-all  (requires authentication)
logoutAll : async (req, res, next) => {
  try {
    await authService.logoutAll(req.user.user_id);
    res.json({ message: 'All sessions revoked.' });
  } catch (err) {
    next(err);
  }
},

// GET /api/auth/me
 me : (req, res) => {
  res.json({ user: req.user });
},

};