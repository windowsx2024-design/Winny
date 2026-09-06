const { readStore, writeStore } = require('../utils');

exports.handler = async function(event) {
  const path = event.path || '';
  const parts = path.split('/').filter(Boolean);
  const apiIndex = parts.findIndex(p => p === 'api');
  const sub = apiIndex >= 0 ? parts.slice(apiIndex + 1) : parts;

  // POST /api/queue
  if (event.httpMethod === 'POST' && sub.length === 1 && sub[0] === 'queue') {
    let body = {};
    try { body = JSON.parse(event.body); } catch (e) {}
    const { productId } = body;
    if (!productId) return { statusCode: 400, body: JSON.stringify({ error: 'productId required' }) };
    const store = readStore();
    const product = (store.products || []).find(p => p.id === productId);
    if (!product) return { statusCode: 404, body: JSON.stringify({ error: 'Product not found' }) };
    store.queue = store.queue || [];
    if (!store.queue.some(item => item.id === product.id)) store.queue.push({ ...product, addedAt: new Date().toISOString() });
    writeStore(store);
    return { statusCode: 201, body: JSON.stringify({ message: `${product.title} added to your queue.`, product }) };
  }

  // GET /api/queue
  if (event.httpMethod === 'GET' && sub.length === 1 && sub[0] === 'queue') {
    const store = readStore();
    return { statusCode: 200, body: JSON.stringify({ queue: store.queue || [] }) };
  }

  return { statusCode: 404, body: JSON.stringify({ error: 'Not found' }) };
};
