const { asyncHandler } = require('../../utils/asyncHandler');
const resetSvc = require('./password_reset_service.js');
 
module.exports = {
  requestOtp: asyncHandler(async (req, res) => {
    const result = await resetSvc.requestOtp(req.body);
    res.json(result);
  }),
 
  resetPassword: asyncHandler(async (req, res) => {
    const result = await resetSvc.resetPassword(req.body);
    res.json(result);
  }),
};