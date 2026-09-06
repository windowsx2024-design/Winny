const { readStore } = require('../utils');

exports.handler = async function(event) {
  if (!process.env.SHOPIFY_API_SECRET) return { statusCode: 501, body: JSON.stringify({ error: 'Shopify not configured' }) };
  // In production you would verify HMAC and process webhook topics
  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
