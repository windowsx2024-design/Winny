const Stripe = require('stripe');
const { readStore } = require('../utils');

exports.handler = async function(event) {
  if (!process.env.STRIPE_SECRET_KEY) return { statusCode: 501, body: JSON.stringify({ error: 'Stripe not configured' }) };
  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  let body = {};
  try { body = JSON.parse(event.body); } catch (e) {}
  const { planId, success_url, cancel_url, customer_email } = body;
  try {
    const session = await stripe.checkout.sessions.create({ payment_method_types: ['card'], mode: 'subscription', line_items: [{ price: planId, quantity: 1 }], success_url: success_url || `${process.env.APP_URL || 'https://example.com'}/?success=true`, cancel_url: cancel_url || `${process.env.APP_URL || 'https://example.com'}/?canceled=true`, customer_email });
    return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Stripe error', detail: err.message }) };
  }
};
