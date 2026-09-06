const { readStore, writeStore } = require('../utils');

exports.handler = async function(event) {
  const path = event.path || '';
  const parts = path.split('/').filter(Boolean);
  const apiIndex = parts.findIndex(p => p === 'api');
  const sub = apiIndex >= 0 ? parts.slice(apiIndex + 1) : parts;

  // POST /api/shopify/export
  if (event.httpMethod === 'POST' && sub.length === 2 && sub[0] === 'shopify' && sub[1] === 'export') {
    let body = {};
    try { body = JSON.parse(event.body); } catch (e) {}
    const { title, price, description = '', video = '' } = body;
    if (!title || !price) return { statusCode: 400, body: JSON.stringify({ error: 'Product title and price are required.' }) };
    const handle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const csv = [
      ['Handle','Title','Body (HTML)','Vendor','Variant Price','Status'],
      [handle, title, `<p>${description}${video ? ` Video: ${video}` : ''}</p>`, 'Liftly', price, 'draft']
    ].map(row => row.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    return { statusCode: 200, headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${handle}-shopify.csv"` }, body: csv };
  }

  // GET /api/shopify/install
  if (event.httpMethod === 'GET' && sub.length === 2 && sub[0] === 'shopify' && sub[1] === 'install') {
    const { SHOPIFY_API_KEY, SHOPIFY_API_SECRET, SHOPIFY_SCOPES, SHOPIFY_APP_URL } = process.env;
    if (!SHOPIFY_API_KEY || !SHOPIFY_API_SECRET || !SHOPIFY_APP_URL) return { statusCode: 501, body: JSON.stringify({ error: 'Shopify not configured' }) };
    const query = event.queryStringParameters || {};
    const shop = query.shop;
    if (!shop) return { statusCode: 400, body: JSON.stringify({ error: 'shop parameter is required' }) };
    const state = require('crypto').randomBytes(16).toString('hex');
    const store = readStore();
    store.shopify = store.shopify || {};
    store.shopify[state] = { shop, createdAt: new Date().toISOString() };
    writeStore(store);
    const scopes = SHOPIFY_SCOPES || 'read_products,write_products';
    const redirect = `${SHOPIFY_APP_URL}/.netlify/functions/shopify/callback`;
    const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${SHOPIFY_API_KEY}&scope=${encodeURIComponent(scopes)}&state=${state}&redirect_uri=${encodeURIComponent(redirect)}`;
    return { statusCode: 302, headers: { Location: installUrl } };
  }

  return { statusCode: 404, body: JSON.stringify({ error: 'Not found' }) };
};
