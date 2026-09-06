const crypto = require('crypto');
const http = require('https');
const { readStore, writeStore } = require('../../utils');

exports.handler = async function(event) {
  // /api/shopify/callback - exchange code for access token
  if (!process.env.SHOPIFY_API_KEY || !process.env.SHOPIFY_API_SECRET) return { statusCode: 501, body: JSON.stringify({ error: 'Not configured' }) };
  const qs = event.queryStringParameters || {};
  const { shop, code, hmac } = qs;
  if (!shop || !code) return { statusCode: 400, body: JSON.stringify({ error: 'Missing shop or code' }) };
  // Verify HMAC if present
  if (hmac) {
    const message = Object.keys(qs).filter(k=>k!=='hmac').map(k=>`${k}=${qs[k]}`).sort().join('&');
    const digest = crypto.createHmac('sha256', process.env.SHOPIFY_API_SECRET).update(message).digest('hex');
    if (digest !== hmac) return { statusCode: 400, body: JSON.stringify({ error: 'Invalid HMAC' }) };
  }
  // Exchange code
  const tokenUrl = `https://${shop}/admin/oauth/access_token`;
  const payload = JSON.stringify({ client_id: process.env.SHOPIFY_API_KEY, client_secret: process.env.SHOPIFY_API_SECRET, code });
  const options = { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } };
  const req = http.request(tokenUrl, options, res => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        const store = readStore();
        store.shopify = store.shopify || {};
        store.shopify[shop] = parsed;
        writeStore(store);
      } catch (e) {}
    });
  });
  req.on('error', () => {});
  req.write(payload); req.end();
  return { statusCode: 200, headers: { 'Content-Type': 'text/html' }, body: `<html><body>Shopify connected for ${shop}. You may close this window.</body></html>` };
};