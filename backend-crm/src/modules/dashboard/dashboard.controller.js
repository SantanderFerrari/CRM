const { asyncHandler } = require('../../utils/asyncHandler');
const { getStats }     = require('./dashboard.service');

const controller = {
  getStats: asyncHandler(async (req, res) => {
    const stats = await getStats();
    res.json(stats);
  }),
};

module.exports = controller;