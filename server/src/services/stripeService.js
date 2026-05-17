const Stripe = require('stripe');
const logger = require('../config/logger');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const PLATFORM_FEE = parseFloat(process.env.PLATFORM_FEE_PERCENT || '15') / 100;

const createPaymentIntent = async ({ amount, currency = 'usd', metadata = {} }) => {
  return stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // cents
    currency,
    metadata,
    automatic_payment_methods: { enabled: true },
  });
};

const confirmPaymentIntent = async (paymentIntentId) => {
  return stripe.paymentIntents.retrieve(paymentIntentId);
};

const createConnectAccount = async ({ email, country = 'US' }) => {
  return stripe.accounts.create({
    type: 'express',
    email,
    country,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });
};

const createAccountLink = async ({ accountId, refreshUrl, returnUrl }) => {
  return stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  });
};

const transferToWorker = async ({ workerStripeId, amount, paymentIntentId }) => {
  const workerAmount = Math.round(amount * (1 - PLATFORM_FEE) * 100);
  return stripe.transfers.create({
    amount: workerAmount,
    currency: 'usd',
    destination: workerStripeId,
    transfer_group: paymentIntentId,
  });
};

const createInstantPayout = async ({ workerStripeId, amount }) => {
  const payoutAmount = Math.round(amount * (1 - PLATFORM_FEE) * 100);
  return stripe.payouts.create(
    {
      amount: payoutAmount,
      currency: 'usd',
      method: 'instant',
    },
    { stripeAccount: workerStripeId }
  );
};

const constructWebhookEvent = (payload, sig) => {
  return stripe.webhooks.constructEvent(
    payload,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET
  );
};

const createInvoice = async ({ customerId, description, amount, metadata = {} }) => {
  const invoiceItem = await stripe.invoiceItems.create({
    customer: customerId,
    amount: Math.round(amount * 100),
    currency: 'usd',
    description,
  });

  const invoice = await stripe.invoices.create({
    customer: customerId,
    auto_advance: true,
    metadata,
  });

  return stripe.invoices.finalizeInvoice(invoice.id);
};

const createCustomer = async ({ email, name }) => {
  return stripe.customers.create({ email, name });
};

module.exports = {
  stripe,
  createPaymentIntent,
  confirmPaymentIntent,
  createConnectAccount,
  createAccountLink,
  transferToWorker,
  createInstantPayout,
  constructWebhookEvent,
  createInvoice,
  createCustomer,
  PLATFORM_FEE,
};
