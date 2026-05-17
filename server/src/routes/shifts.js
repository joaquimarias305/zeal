const router = require('express').Router();
const { body, query } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/shiftController');

// Public browse
router.get('/', ctrl.listShifts);
router.get('/business/mine', authenticate, requireRole('business'), ctrl.businessShifts);
router.get('/worker/mine', authenticate, requireRole('worker'), ctrl.workerApplications);
router.get('/:id', ctrl.getShift);

// Business creates / manages
router.post('/', authenticate, requireRole('business'), [
  body('role').notEmpty().withMessage('Role is required'),
  body('address').notEmpty(),
  body('shift_date').isDate().withMessage('Valid date required'),
  body('start_time').matches(/^\d{2}:\d{2}$/).withMessage('Time format HH:MM required'),
  body('end_time').matches(/^\d{2}:\d{2}$/).withMessage('Time format HH:MM required'),
  body('pay_rate').isFloat({ min: 7.98 }).withMessage('Pay rate must be at least minimum wage'),
  body('workers_needed').optional().isInt({ min: 1, max: 50 }),
  validate,
], ctrl.createShift);

router.patch('/:id', authenticate, requireRole('business'), ctrl.updateShift);
router.delete('/:id', authenticate, requireRole('business'), ctrl.cancelShift);

// Applications
router.post('/:id/apply', authenticate, requireRole('worker'), [
  body('message').optional().isLength({ max: 500 }),
  validate,
], ctrl.applyToShift);

router.get('/:id/applications', authenticate, requireRole('business'), ctrl.getApplications);
router.patch('/:shiftId/applications/:appId', authenticate, requireRole('business'), [
  body('status').isIn(['accepted', 'rejected']),
  validate,
], ctrl.updateApplication);

module.exports = router;
