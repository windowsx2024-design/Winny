const { readStore, writeStore } = require('./utils');

exports.handler = async function(event) {
  // This endpoint is a placeholder for Shopify connect/disconnect flows.
  if (!process.env.SHOPIFY_API_KEY || !process.env.SHOPIFY_API_SECRET) {
    return { statusCode: 501, body: JSON.stringify({ error: 'Shopify not configured' }) };
  }

  // A minimal placeholder response
  return { statusCode: 200, body: JSON.stringify({ ok: true, message: 'Shopify integration scaffolded' }) };
};
