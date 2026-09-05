const { readStore } = require('./utils');

function getSessionIdFromEvent(event) {
  const cookieHeader = event.headers && (event.headers.cookie || event.headers.Cookie) || '';
  const match = cookieHeader.match(/liftly_session=([^;]+)/);
  return match && match[1];
}

exports.handler = async function(event) {
  const sid = getSessionIdFromEvent(event);
  if (!sid) return { statusCode: 401, body: JSON.stringify({ error: 'not authenticated' }) };
  const store = readStore();
  const session = (store.sessions || []).find(s => s.id === sid);
  if (!session) return { statusCode: 401, body: JSON.stringify({ error: 'invalid session' }) };
  const user = (store.users || []).find(u => u.id === session.userId);
  if (!user || !user.isAdmin) return { statusCode: 403, body: JSON.stringify({ error: 'forbidden' }) };

  const safe = (store.users || []).map(u => {
    const copy = { ...u };
    delete copy.passwordHash;
    return copy;
  });

  return { statusCode: 200, body: JSON.stringify({ users: safe }) };
};
