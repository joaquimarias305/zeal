const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/paymentController');

// Stripe webhook – raw body (mounted before json parser in app.js)
router.post('/webhook', ctrl.handleWebhook);

router.post('/intent', authenticate, requireRole('business'), [
  body('shift_id').isUUID(),
  body('application_id').optional().isUUID(),
  validate,
], ctrl.createPaymentIntent);

router.post('/stripe-connect', authenticate, requireRole('worker'), ctrl.initStripeConnect);
router.post('/instant-pay/:paymentId', authenticate, requireRole('worker'), ctrl.requestInstantPay);

router.get('/business/history', authenticate, requireRole('business'), ctrl.businessPaymentHistory);
router.get('/worker/history', authenticate, requireRole('worker'), ctrl.workerPaymentHistory);

module.exports = router;
