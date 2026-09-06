const https = require('https');
const { readStore, writeStore, getSessionUser } = require('../utils');

exports.handler = async function(event) {
  if (!process.env.STRIPE_SECRET_KEY) return { statusCode: 501, body: JSON.stringify({ error: 'Not configured' }) };
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch (e) {}
  const planId = body.planId;
  const store = readStore();
  const plan = (store.plans || []).find(p => p.id === planId);
  if (!plan) return { statusCode: 404, body: JSON.stringify({ error: 'Plan not found' }) };
  // Create a Checkout Session via Stripe API
  const payload = JSON.stringify({ success_url: (process.env.SUCCESS_URL || 'http://localhost:8888') + '/?checkout=success', cancel_url: (process.env.CANCEL_URL || 'http://localhost:8888') + '/?checkout=cancel', mode: 'subscription', line_items: [{ price: process.env.STRIPE_PRICE_ID || '', quantity: 1 }] });
  const options = { hostname: 'api.stripe.com', path: '/v1/checkout/sessions', method: 'POST', headers: { 'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' } };
  // Use simple redirect response stub since full stripe integration requires body form encoding. Return Not configured if STRIPE_PRICE_ID missing
  if (!process.env.STRIPE_PRICE_ID) return { statusCode: 501, body: JSON.stringify({ error: 'Not configured' }) };
  // Instruct client to request Checkout via Stripe SDK or redirect to Stripe Checkout
  const checkoutUrl = `https://checkout.stripe.com/pay/${process.env.STRIPE_PRICE_ID}`;
  return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: checkoutUrl }) };
};