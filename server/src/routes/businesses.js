const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/businessController');

router.get('/me/dashboard', authenticate, requireRole('business'), ctrl.businessDashboard);
router.patch('/me', authenticate, requireRole('business'), ctrl.updateMyProfile);
router.get('/:id', ctrl.getBusinessProfile);

module.exports = router;
