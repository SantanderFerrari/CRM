const authService = require('./auth.service');

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const user = await authService.register(req.body);
    res.status(201).json({ message: 'User registered successfully.', user });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const data = await authService.login(req.body);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/refresh
const refresh = async (req, res, next) => {
  try {
    const tokens = await authService.refresh(req.body.refreshToken);
    res.json(tokens);
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/logout
const logout = async (req, res, next) => {
  try {
    await authService.logout(req.body.refreshToken);
    res.json({ message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/logout-all  (requires authentication)
const logoutAll = async (req, res, next) => {
  try {
    await authService.logoutAll(req.user.user_id);
    res.json({ message: 'All sessions revoked.' });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
const me = (req, res) => {
  res.json({ user: req.user });
};

module.exports = { register, login, refresh, logout, logoutAll, me };