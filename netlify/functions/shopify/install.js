const { readStore } = require('../../utils');

exports.handler = async function(event) {
  // /api/shopify/install - return redirect to shopify app install (requires SHOPIFY_* env)
  if (!process.env.SHOPIFY_API_KEY || !process.env.SHOPIFY_APP_URL) return { statusCode: 501, body: JSON.stringify({ error: 'Not configured' }) };
  // Expect query ?shop=shop-name
  const qs = require('querystring');
  const url = require('url');
  const q = url.parse(event.rawUrl || event.path + (event.queryStringParameters ? '?' + qs.stringify(event.queryStringParameters) : '') ).query || '';
  const params = (event.queryStringParameters) || {};
  const shop = params.shop;
  if (!shop) return { statusCode: 400, body: JSON.stringify({ error: 'Missing shop query' }) };
  const scopes = process.env.SHOPIFY_SCOPES || 'read_products,write_products';
  const redirect = `https://${shop}/admin/oauth/authorize?client_id=${process.env.SHOPIFY_API_KEY}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(process.env.SHOPIFY_APP_URL + '/.netlify/functions/shopify/callback')}&state=${Date.now()}`;
  return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ redirect }) };
};