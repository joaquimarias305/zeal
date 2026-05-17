const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/workerController');

router.get('/me/dashboard', authenticate, requireRole('worker'), ctrl.workerDashboard);
router.patch('/me', authenticate, requireRole('worker'), ctrl.updateMyProfile);
router.patch('/me/availability', authenticate, requireRole('worker'), [
  body('slots').isArray({ min: 0 }),
  validate,
], ctrl.updateAvailability);
router.get('/:id', ctrl.getWorkerProfile);

module.exports = router;
