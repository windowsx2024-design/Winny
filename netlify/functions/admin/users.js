const { readStore, writeStore, getSessionIdFromEvent } = require('../utils');

exports.handler = async function(event) {
  const method = event.httpMethod;
  const path = event.path || '';
  // Expected paths:
  // GET /api/admin/users -> list users
  // POST /api/admin/users/:id/metrics -> update metrics
  const parts = path.split('/').filter(Boolean);
  // parts example: ['.netlify','functions','admin','users'] or '/api/admin/users' -> depending on platform
  // Normalize by finding '/api' index
  const apiIndex = parts.findIndex(p => p === 'api');
  const sub = apiIndex >= 0 ? parts.slice(apiIndex + 1) : parts;

  // If path ends with 'users' and GET
  if (method === 'GET' && sub.length === 2 && sub[0] === 'admin' && sub[1] === 'users') {
    const store = readStore();
    const safe = (store.users || []).map(u => { const copy = { ...u }; delete copy.passwordHash; return copy; });
    return { statusCode: 200, body: JSON.stringify({ users: safe }) };
  }

  // POST /api/admin/users/:id/metrics
  if (method === 'POST' && sub.length === 4 && sub[0] === 'admin' && sub[1] === 'users' && sub[3] === 'metrics') {
    const userId = sub[2];
    let body = {};
    try { body = JSON.parse(event.body); } catch (e) {}
    const store = readStore();
    const user = (store.users || []).find(u => u.id === userId);
    if (!user) return { statusCode: 404, body: JSON.stringify({ error: 'Seller not found.' }) };
    for (const field of ['revenue','views','purchases']) {
      const value = Number(body[field]);
      if (!Number.isFinite(value) || value < 0) return { statusCode: 400, body: JSON.stringify({ error: `${field} must be a positive number.` }) };
      user[field] = value;
    }
    writeStore(store);
    return { statusCode: 200, body: JSON.stringify({ message: `${user.name}'s performance was updated.`, user }) };
  }

  return { statusCode: 404, body: JSON.stringify({ error: 'Not found' }) };
};
