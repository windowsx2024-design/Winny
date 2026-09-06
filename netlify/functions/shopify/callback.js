const fetch = require('node-fetch');
const { readStore, writeStore } = require('../utils');

exports.handler = async function(event) {
  const query = event.queryStringParameters || {};
  const { code, hmac, shop, state } = query;
  if (!shop || !code || !state) return { statusCode: 400, body: JSON.stringify({ error: 'Missing required params' }) };
  const { SHOPIFY_API_SECRET, SHOPIFY_API_KEY } = process.env;
  if (!SHOPIFY_API_SECRET || !SHOPIFY_API_KEY) return { statusCode: 501, body: JSON.stringify({ error: 'Shopify not configured' }) };
  const store = readStore();
  const stored = store.shopify && store.shopify[state];
  if (!stored || stored.shop !== shop) return { statusCode: 400, body: JSON.stringify({ error: 'Invalid state' }) };
  const map = { ...query }; delete map.hmac; const message = Object.keys(map).sort().map(k => `${k}=${map[k]}`).join('&');
  const generated = require('crypto').createHmac('sha256', SHOPIFY_API_SECRET).update(message).digest('hex');
  if (hmac !== generated) return { statusCode: 400, body: JSON.stringify({ error: 'HMAC validation failed' }) };
  const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ client_id: SHOPIFY_API_KEY, client_secret: SHOPIFY_API_SECRET, code }) });
  const tokenJson = await tokenRes.json();
  if (!tokenJson.access_token) return { statusCode: 400, body: JSON.stringify({ error: 'Failed to get access token', detail: tokenJson }) };
  store.shopify = store.shopify || {};
  store.shopify[shop] = { accessToken: tokenJson.access_token, installedAt: new Date().toISOString() };
  writeStore(store);
  const appUrl = process.env.SHOPIFY_APP_URL || '/';
  return { statusCode: 302, headers: { Location: appUrl } };
};
