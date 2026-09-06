const { readStore, writeStore, getSessionUser } = require('../utils');

exports.handler = async function(event) {
  const user = getSessionUser(event);
  if (!user) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  const store = readStore();
  store.savedItems = store.savedItems || {};
  const list = store.savedItems[user.id] || [];
  if (event.httpMethod === 'POST') {
    let body = {};
    try { body = JSON.parse(event.body || '{}'); } catch (e) {}
    const item = body.item;
    if (!item) return { statusCode: 400, body: JSON.stringify({ error: 'Missing item' }) };
    store.savedItems[user.id] = [...list, item];
    writeStore(store);
    return { statusCode: 201, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true }) };
  }
  // DELETE
  if (event.httpMethod === 'DELETE') {
    let body = {};
    try { body = JSON.parse(event.body || '{}'); } catch (e) {}
    const id = body.id;
    store.savedItems[user.id] = (list || []).filter(i => i.id !== id);
    writeStore(store);
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true }) };
  }
  return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(list) };
};