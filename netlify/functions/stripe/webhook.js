const Stripe = require('stripe');
const { readStore, writeStore } = require('../utils');

exports.handler = async function(event) {
  if (!process.env.STRIPE_WEBHOOK_SECRET || !process.env.STRIPE_SECRET_KEY) return { statusCode: 501, body: JSON.stringify({ error: 'Stripe not configured' }) };
  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = event.headers['stripe-signature'] || event.headers['Stripe-Signature'];
  let payload = event.body;
  try {
    const evt = stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET);
    if (evt.type === 'checkout.session.completed') {
      const session = evt.data.object;
      const store = readStore();
      const user = (store.users || []).find(u => u.email === session.customer_email);
      if (user) { user.plan = 'paid'; writeStore(store); }
    }
    return { statusCode: 200, body: JSON.stringify({ received: true }) };
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Webhook signature verification failed', detail: err.message }) };
  }
};
