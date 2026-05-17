const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/adminController');

router.use(authenticate, requireRole('admin'));

router.get('/stats',               ctrl.getStats);
router.get('/users',               ctrl.listUsers);
router.patch('/users/:id/status',  [body('is_active').isBoolean(), validate], ctrl.toggleUserStatus);
router.patch('/workers/:id/verify',    ctrl.verifyWorker);
router.patch('/businesses/:id/verify', ctrl.verifyBusiness);
router.get('/shifts',              ctrl.listShifts);
router.patch('/shifts/:id/complete',   ctrl.completeShift);

module.exports = router;
