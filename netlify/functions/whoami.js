const { readStore } = require('./utils');

exports.handler = async function(event) {
  const sid = require('./utils').getSessionIdFromEvent(event);
  if (!sid) return { statusCode: 401, body: JSON.stringify({ error: 'Not authenticated' }) };
  const store = readStore();
  const session = (store.sessions || []).find(s => s.id === sid);
  if (!session) return { statusCode: 401, body: JSON.stringify({ error: 'Invalid session' }) };
  const user = (store.users || []).find(u => u.id === session.userId);
  if (!user) return { statusCode: 401, body: JSON.stringify({ error: 'User not found' }) };
  const safe = { ...user }; delete safe.passwordHash; return { statusCode: 200, body: JSON.stringify(safe) };
};
