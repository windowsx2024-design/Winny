const { readStore, writeStore } = require('./utils');
const crypto = require('crypto');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  let body = {};
  try { body = JSON.parse(event.body); } catch (e) {}
  const { email } = body;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '')) return { statusCode: 400, body: JSON.stringify({ error: 'Please enter a valid email address.' }) };
  const store = readStore();
  const user = (store.users || []).find(u => u.email.toLowerCase() === email.toLowerCase());
  if (user) return { statusCode: 200, body: JSON.stringify({ message: 'Sign-in link prepared.', token: crypto.randomUUID() }) };
  let request = (store.accessRequests || []).find(item => item.email.toLowerCase() === email.toLowerCase());
  if (request?.status === 'approved') return { statusCode: 200, body: JSON.stringify({ message: 'Your access is approved. Sign-in link prepared.', token: crypto.randomUUID() }) };
  if (!request) {
    request = { id: crypto.randomUUID(), name: email.split('@')[0], email, requestedAt: new Date().toISOString(), status: 'pending' };
    store.accessRequests = [...(store.accessRequests || []), request];
    writeStore(store);
  }
  return { statusCode: 202, body: JSON.stringify({ message: 'Your access request is waiting for admin approval.' }) };
};
