const { readStore, writeStore } = require('./utils');

exports.handler = async function(event) {
  const method = event.httpMethod;
  if (method === 'GET') {
    const store = readStore();
    return { statusCode: 200, body: JSON.stringify(store.queue || []) };
  }
  if (method === 'POST') {
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
  return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
};
