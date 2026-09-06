const { readStore, writeStore } = require('../utils');

exports.handler = async function(event) {
  const method = event.httpMethod;
  const path = event.path || '';
  const parts = path.split('/').filter(Boolean);
  const apiIndex = parts.findIndex(p => p === 'api');
  const sub = apiIndex >= 0 ? parts.slice(apiIndex + 1) : parts;

  // GET /api/admin/access-requests -> return array
  if (method === 'GET' && sub.length >= 2 && sub[0] === 'admin' && sub[1] === 'access-requests') {
    const store = readStore();
    return { statusCode: 200, body: JSON.stringify(store.accessRequests || []) };
  }

  // POST /api/admin/access-requests/:id
  if (method === 'POST' && sub.length === 3 && sub[0] === 'admin' && sub[1] === 'access-requests') {
    const id = sub[2];
    let body = {};
    try { body = JSON.parse(event.body); } catch (e) {}
    const { decision } = body;
    if (!['approve','decline'].includes(decision)) return { statusCode: 400, body: JSON.stringify({ error: 'Choose approve or decline.' }) };
    const store = readStore();
    store.accessRequests = store.accessRequests || [];
    const request = store.accessRequests.find(r => r.id === id);
    if (!request || request.status !== 'pending') return { statusCode: 404, body: JSON.stringify({ error: 'Pending access request not found.' }) };
    request.status = decision === 'approve' ? 'approved' : 'declined';
    if (decision === 'approve' && !store.users.some(u => u.email === request.email)) {
      const idPart = request.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]+/g, '-');
      store.users = store.users || [];
      store.users.push({ id: idPart, name: request.name || idPart, email: request.email, plan: 'Starter', revenue: 0, views: 0, purchases: 0, status: 'Active' });
    }
    writeStore(store);
    return { statusCode: 200, body: JSON.stringify({ message: `${request.name}'s access was ${request.status}.` }) };
  }

  return { statusCode: 404, body: JSON.stringify({ error: 'Not found' }) };
};
