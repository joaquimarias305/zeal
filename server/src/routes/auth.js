const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/authController');

const passwordRules = body('password')
  .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
  .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
  .matches(/[0-9]/).withMessage('Password must contain a number');

router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail(),
  passwordRules,
  body('type').isIn(['worker', 'business']).withMessage('Type must be worker or business'),
  body('language').optional().isIn(['en', 'es', 'both']),
  validate,
], ctrl.register);

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  validate,
], ctrl.login);

router.get('/verify-email', ctrl.verifyEmail);

router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail(),
  validate,
], ctrl.forgotPassword);

router.post('/reset-password', [
  body('token').notEmpty(),
  passwordRules,
  validate,
], ctrl.resetPassword);

router.get('/me', authenticate, ctrl.getMe);

module.exports = router;
