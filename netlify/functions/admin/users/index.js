const { readStore, writeStore, getSessionUser, parseCookies } = require('../utils');

exports.handler = async function(event) {
  const user = getSessionUser(event);
  if (!user) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };

  // For now just return safe user list
  const store = readStore();
  const users = (store.users || []).map(u => {
    const safe = { ...u }; delete safe.passwordHash; return safe;
  });
  return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(users) };
};