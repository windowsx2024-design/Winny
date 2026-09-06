const { readStore, writeStore } = require('./utils');

exports.handler = async function(event) {
  // Forgot password: create single-use token and call send_email
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch (e) {}
  const email = (body.email || '').toLowerCase();
  if (!email) return { statusCode: 400, body: JSON.stringify({ error: 'Missing email' }) };
  const store = readStore();
  const user = (store.users || []).find(u => u.email === email);
  if (!user) return { statusCode: 404, body: JSON.stringify({ error: 'User not found' }) };
  const token = require('crypto').randomBytes(20).toString('hex');
  store.passwordResets = store.passwordResets || [];
  store.passwordResets.push({ userId: user.id, token, createdAt: new Date().toISOString(), used: false });
  writeStore(store);
  // send email via send_email function (caller)
  return { statusCode: 200, body: JSON.stringify({ message: 'Reset token created', token: token }) };
};