const { readStore, writeStore, getSessionUser } = require('./utils');

exports.handler = async function(event) {
  // product library: list, create, update
  const user = getSessionUser(event);
  if (!user) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  const store = readStore();
  store.products = store.products || [];
  if (event.httpMethod === 'GET') return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(store.products) };
  if (event.httpMethod === 'POST') {
    let body = {};
    try { body = JSON.parse(event.body || '{}'); } catch (e) {}
    const p = { id: body.id || `p-${Date.now()}`, title: body.title || 'Untitled', cost: body.cost || 0, rating: body.rating || 0 };
    store.products.push(p); writeStore(store);
    return { statusCode: 201, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) };
  }
  return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
};