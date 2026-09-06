const { readStore, writeStore } = require('../utils');

exports.handler = async function(event) {
  const path = event.path || '';
  const parts = path.split('/').filter(Boolean);
  const apiIndex = parts.findIndex(p => p === 'api');
  const sub = apiIndex >= 0 ? parts.slice(apiIndex + 1) : parts;

  // POST /api/auth/email
  if (event.httpMethod === 'POST' && sub.length === 2 && sub[0] === 'auth' && sub[1] === 'email') {
    let body = {};
    try { body = JSON.parse(event.body); } catch (e) {}
    const { email } = body;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '')) return { statusCode: 400, body: JSON.stringify({ error: 'Please enter a valid email address.' }) };
    const store = readStore();
    const user = (store.users || []).find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) return { statusCode: 200, body: JSON.stringify({ message: 'Sign-in link prepared.', token: require('crypto').randomUUID() }) };
    let request = (store.accessRequests || []).find(item => item.email.toLowerCase() === email.toLowerCase());
    if (request?.status === 'approved') return { statusCode: 200, body: JSON.stringify({ message: 'Your access is approved. Sign-in link prepared.', token: require('crypto').randomUUID() }) };
    if (!request) { request = { id: require('crypto').randomUUID(), name: email.split('@')[0], email, requestedAt: new Date().toISOString(), status: 'pending' }; store.accessRequests = [...(store.accessRequests || []), request]; writeStore(store); }
    return { statusCode: 202, body: JSON.stringify({ message: 'Your access request is waiting for admin approval.' }) };
  }

  // POST /api/auth/provider
  if (event.httpMethod === 'POST' && sub.length === 2 && sub[0] === 'auth' && sub[1] === 'provider') {
    let body = {};
    try { body = JSON.parse(event.body); } catch (e) {}
    const { provider } = body;
    if (!['Google','Apple','Facebook','TikTok','X'].includes(provider)) return { statusCode: 400, body: JSON.stringify({ error: 'Unsupported provider.' }) };
    return { statusCode: 501, body: JSON.stringify({ message: `${provider} OAuth needs client credentials. Add them as environment variables before enabling this provider.` }) };
  }

  return { statusCode: 404, body: JSON.stringify({ error: 'Not found' }) };
};
