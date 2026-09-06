const { readStore, writeStore, getSessionUser } = require('../utils');

exports.handler = async function(event) {
  const user = getSessionUser(event);
  if (!user) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  if (event.httpMethod === 'POST') {
    let body = {};
    try { body = JSON.parse(event.body || '{}'); } catch (e) {}
    const store = readStore();
    store.queue = store.queue || [];
    store.queue.push({ id: body.productId || `q-${Date.now()}`, userId: user.id, addedAt: new Date().toISOString() });
    writeStore(store);
    return { statusCode: 201, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true }) };
  }
  // GET
  const store = readStore();
  const queue = (store.queue || []).filter(q => q.userId === user.id);
  return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(queue) };
};