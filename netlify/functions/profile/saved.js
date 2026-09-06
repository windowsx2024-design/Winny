const { readStore, writeStore, getSessionUser } = require('./utils');

exports.handler = async function(event) {
  const user = getSessionUser(event);
  if (!user) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  const store = readStore();
  const saved = (store.savedItems || {})[user.id] || [];
  return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(saved) };
};