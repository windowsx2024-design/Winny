const { readStore, writeStore, getSessionUser } = require('../../utils');

exports.handler = async function(event) {
  const user = getSessionUser(event);
  if (!user || !user.isAdmin) return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden' }) };

  // path: /api/admin/users/:id/metrics
  const parts = event.path.split('/').filter(Boolean);
  const idIndex = parts.indexOf('users') + 1;
  const id = parts[idIndex];
  if (!id) return { statusCode: 400, body: JSON.stringify({ error: 'Missing user id' }) };

  if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch (e) {}
  const store = readStore();
  const u = store.users.find(x => x.id === id);
  if (!u) return { statusCode: 404, body: JSON.stringify({ error: 'User not found' }) };
  u.revenue = Number(body.revenue || u.revenue || 0);
  u.views = Number(body.views || u.views || 0);
  u.purchases = Number(body.purchases || u.purchases || 0);
  writeStore(store);
  return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'Metrics updated' }) };
};