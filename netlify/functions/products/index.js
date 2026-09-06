const { readStore, writeStore } = require('../utils');

exports.handler = async function(event) {
  const path = event.path || '';
  const parts = path.split('/').filter(Boolean);
  const apiIndex = parts.findIndex(p => p === 'api');
  const sub = apiIndex >= 0 ? parts.slice(apiIndex + 1) : parts;

  // GET /api/products
  if (event.httpMethod === 'GET' && sub.length === 1 && sub[0] === 'products') {
    const store = readStore();
    return { statusCode: 200, body: JSON.stringify({ products: store.products || [] }) };
  }

  return { statusCode: 404, body: JSON.stringify({ error: 'Not found' }) };
};
