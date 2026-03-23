const { Router } = require('express');
const controller = require('./users.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

const router = Router();

// All users routes require authentication
router.use(authenticate);

router.get(  '/',                    authorize('ADMIN', 'SUPERVISOR', 'HEAD_OF_DEPARTMENT'), controller.getAll);
router.get(  '/:id',                 controller.getById);
router.patch('/:id',                 controller.update);
router.post( '/change-password',     controller.changePassword);
router.patch('/:id/deactivate',      authorize('ADMIN'),                                    controller.deactivate);
router.patch('/:id/activate',        authorize('ADMIN'),                                    controller.activate);

module.exports = router;