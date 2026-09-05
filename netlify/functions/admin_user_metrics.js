const { readStore, writeStore } = require('./utils');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  const parts = (event.path || '').split('/');
  const id = parts[parts.length - 2] === 'users' ? parts[parts.length - 1] : parts[parts.length - 2];
  let body = {};
  try { body = JSON.parse(event.body); } catch (e) {}
  const store = readStore();
  const user = (store.users || []).find(u => u.id === id);
  if (!user) return { statusCode: 404, body: JSON.stringify({ error: 'Seller not found.' }) };
  for (const field of ['revenue', 'views', 'purchases']) {
    const value = Number(body[field]);
    if (!Number.isFinite(value) || value < 0) return { statusCode: 400, body: JSON.stringify({ error: `${field} must be a positive number.` }) };
    user[field] = value;
  }
  writeStore(store);
  return { statusCode: 200, body: JSON.stringify({ message: `${user.name}'s performance was updated.`, user }) };
};
