const { readStore } = require('../utils');

exports.handler = async function(event) {
  const path = event.path || '';
  const parts = path.split('/').filter(Boolean);
  const apiIndex = parts.findIndex(p => p === 'api');
  const sub = apiIndex >= 0 ? parts.slice(apiIndex + 1) : parts;

  // GET /api/payments/plans -> return array
  if (event.httpMethod === 'GET' && sub.length === 2 && sub[0] === 'payments' && sub[1] === 'plans') {
    const store = readStore();
    return { statusCode: 200, body: JSON.stringify(store.plans || []) };
  }

  // POST /api/payments/checkout
  if (event.httpMethod === 'POST' && sub.length === 2 && sub[0] === 'payments' && sub[1] === 'checkout') {
    let body = {};
    try { body = JSON.parse(event.body); } catch (e) {}
    const { planId } = body;
    const store = readStore();
    const plan = (store.plans || []).find(p => p.id === planId);
    if (!plan) return { statusCode: 404, body: JSON.stringify({ error: 'Plan not found.' }) };
    if (!process.env.STRIPE_SECRET_KEY) return { statusCode: 501, body: JSON.stringify({ message: `${plan.name} is selected. Connect Stripe or another payment provider to take a live payment.` }) };
    return { statusCode: 200, body: JSON.stringify({ message: 'Stripe configured — implement checkout flow.' }) };
  }

  return { statusCode: 404, body: JSON.stringify({ error: 'Not found' }) };
};
