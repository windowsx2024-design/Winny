const { readStore, writeStore } = require('../utils');

exports.handler = async function(event) {
  // Simple webhook endpoint for Stripe/Shopify; validate signature if configured
  // We'll accept POST and log events to store.json
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  let body = event.body || '';
  try { body = JSON.parse(body); } catch (e) {}
  const store = readStore();
  store.webhooks = store.webhooks || [];
  store.webhooks.push({ receivedAt: new Date().toISOString(), body });
  writeStore(store);
  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};