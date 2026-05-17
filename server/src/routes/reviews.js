const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/reviewController');

router.post('/', authenticate, [
  body('shift_id').isUUID(),
  body('reviewee_id').isUUID(),
  body('rating').isInt({ min: 1, max: 5 }),
  body('comment').optional().isLength({ max: 1000 }),
  validate,
], ctrl.createReview);

router.get('/worker/:workerId', ctrl.getWorkerReviews);
router.get('/business/:businessId', ctrl.getBusinessReviews);

module.exports = router;
