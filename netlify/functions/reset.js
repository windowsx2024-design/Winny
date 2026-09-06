const { readStore, writeStore } = require('./utils');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch (e) {}
  const { token, newPassword } = body;
  if (!token || !newPassword) return { statusCode: 400, body: JSON.stringify({ error: 'Missing token or newPassword' }) };
  const store = readStore();
  const pr = (store.passwordResets || []).find(p => p.token === token && !p.used);
  if (!pr) return { statusCode: 400, body: JSON.stringify({ error: 'Invalid or expired token' }) };
  const user = (store.users || []).find(u => u.id === pr.userId);
  if (!user) return { statusCode: 404, body: JSON.stringify({ error: 'User not found' }) };
  const bcrypt = require('bcryptjs');
  user.passwordHash = bcrypt.hashSync(newPassword, 10);
  pr.used = true;
  writeStore(store);
  return { statusCode: 200, body: JSON.stringify({ message: 'Password updated' }) };
};