const { query, getClient } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');
const stripe = require('../services/stripeService');
const logger = require('../config/logger');

// POST /api/payments/intent – business initiates payment for a shift
const createPaymentIntent = async (req, res, next) => {
  try {
    const { shift_id, application_id } = req.body;

    const { rows: shiftRows } = await query(
      `SELECT s.*, bp.stripe_customer_id
       FROM shifts s JOIN business_profiles bp ON bp.user_id = s.business_id
       WHERE s.id = $1 AND s.business_id = $2`,
      [shift_id, req.user.id]
    );
    if (!shiftRows[0]) throw new AppError('Shift not found or unauthorized', 404);

    const shift = shiftRows[0];

    // Determine amount: hours * pay_rate
    const grossAmount = parseFloat(shift.hours) * parseFloat(shift.pay_rate);
    const platformFee = grossAmount * stripe.PLATFORM_FEE;
    const workerAmount = grossAmount - platformFee;

    const intent = await stripe.createPaymentIntent({
      amount: grossAmount,
      metadata: {
        shift_id,
        application_id: application_id || '',
        business_id: req.user.id,
      },
    });

    // Record pending payment
    const { rows } = await query(
      `INSERT INTO payments (shift_id, application_id, business_id, worker_id,
         gross_amount, platform_fee, worker_amount, stripe_payment_intent)
       VALUES ($1, $2, $3,
         (SELECT worker_id FROM applications WHERE id = $4),
         $5, $6, $7, $8)
       RETURNING id`,
      [shift_id, application_id, req.user.id, application_id,
       grossAmount, platformFee, workerAmount, intent.id]
    );

    res.json({
      clientSecret: intent.client_secret,
      payment_id: rows[0]?.id,
      gross_amount: grossAmount,
      platform_fee: platformFee,
      worker_amount: workerAmount,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/payments/webhook – Stripe events
const handleWebhook = async (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.constructWebhookEvent(req.body, sig);
  } catch (err) {
    logger.error(`Webhook signature failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object;
      const { rows } = await client.query(
        `UPDATE payments SET status = 'succeeded', paid_at = NOW()
         WHERE stripe_payment_intent = $1 RETURNING *`,
        [pi.id]
      );

      if (rows[0]) {
        const payment = rows[0];

        // Get worker stripe account
        const { rows: workerRows } = await client.query(
          'SELECT stripe_account_id, stripe_onboarded FROM worker_profiles WHERE user_id = $1',
          [payment.worker_id]
        );

        if (workerRows[0]?.stripe_onboarded) {
          const transfer = await stripe.transferToWorker({
            workerStripeId: workerRows[0].stripe_account_id,
            amount: payment.worker_amount,
            paymentIntentId: pi.id,
          });

          await client.query(
            'UPDATE payments SET stripe_transfer_id = $1 WHERE id = $2',
            [transfer.id, payment.id]
          );
        }

        // Update shift status
        await client.query(
          `UPDATE shifts SET status = 'in_progress' WHERE id = $1 AND status = 'filled'`,
          [payment.shift_id]
        );

        // Update worker earnings
        await client.query(
          `UPDATE worker_profiles SET total_earnings = total_earnings + $1 WHERE user_id = $2`,
          [payment.worker_amount, payment.worker_id]
        );
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const pi = event.data.object;
      await client.query(
        `UPDATE payments SET status = 'failed' WHERE stripe_payment_intent = $1`,
        [pi.id]
      );
    }

    await client.query('COMMIT');
    res.json({ received: true });
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Webhook processing error', err);
    next(err);
  } finally {
    client.release();
  }
};

// POST /api/payments/stripe-connect – worker initiates Stripe onboarding
const initStripeConnect = async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT stripe_account_id FROM worker_profiles WHERE user_id = $1',
      [req.user.id]
    );

    let accountId = rows[0]?.stripe_account_id;

    if (!accountId) {
      const account = await stripe.createConnectAccount({ email: req.user.email });
      accountId = account.id;
      await query(
        'UPDATE worker_profiles SET stripe_account_id = $1 WHERE user_id = $2',
        [accountId, req.user.id]
      );
    }

    const link = await stripe.createAccountLink({
      accountId,
      refreshUrl: `${process.env.CLIENT_URL}/worker/settings?stripe=refresh`,
      returnUrl:  `${process.env.CLIENT_URL}/worker/settings?stripe=success`,
    });

    res.json({ url: link.url });
  } catch (err) {
    next(err);
  }
};

// POST /api/payments/instant-pay/:paymentId – worker requests instant pay
const requestInstantPay = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT p.*, wp.stripe_account_id, wp.stripe_onboarded, wp.instant_pay_enabled,
              s.end_time, s.shift_date
       FROM payments p
       JOIN worker_profiles wp ON wp.user_id = p.worker_id
       JOIN shifts s ON s.id = p.shift_id
       WHERE p.id = $1 AND p.worker_id = $2 AND p.status = 'succeeded'`,
      [req.params.paymentId, req.user.id]
    );

    const payment = rows[0];
    if (!payment) throw new AppError('Payment not found or not eligible', 404);
    if (!payment.instant_pay_enabled) throw new AppError('Instant pay not enabled on your account', 400);

    const payout = await stripe.createInstantPayout({
      workerStripeId: payment.stripe_account_id,
      amount: payment.worker_amount,
    });

    await query(
      'UPDATE payments SET instant_pay = TRUE WHERE id = $1',
      [req.params.paymentId]
    );

    res.json({ payout_id: payout.id, status: payout.status });
  } catch (err) {
    next(err);
  }
};

// GET /api/payments/business/history
const businessPaymentHistory = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT p.*, s.role, s.title, s.shift_date, u.name AS worker_name
       FROM payments p
       JOIN shifts s ON s.id = p.shift_id
       JOIN users u ON u.id = p.worker_id
       WHERE p.business_id = $1
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

// GET /api/payments/worker/history
const workerPaymentHistory = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT p.*, s.role, s.title, s.shift_date, bp.company_name
       FROM payments p
       JOIN shifts s ON s.id = p.shift_id
       JOIN business_profiles bp ON bp.user_id = p.business_id
       WHERE p.worker_id = $1
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createPaymentIntent, handleWebhook, initStripeConnect,
  requestInstantPay, businessPaymentHistory, workerPaymentHistory,
};
