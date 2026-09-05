const { readStore } = require('./utils');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  let body = {};
  try { body = JSON.parse(event.body); } catch (e) {}
  const { planId } = body;
  const store = readStore();
  const plan = (store.plans || []).find(p => p.id === planId);
  if (!plan) return { statusCode: 404, body: JSON.stringify({ error: 'Plan not found.' }) };
  // Stripe not configured -> return 501 per requirements
  if (!process.env.STRIPE_SECRET_KEY) return { statusCode: 501, body: JSON.stringify({ message: `${plan.name} is selected. Connect Stripe or another payment provider to take a live payment.` }) };
  return { statusCode: 200, body: JSON.stringify({ message: 'Stripe configured — implement checkout flow.' }) };
};
