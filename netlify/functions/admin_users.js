const { parseCookies } = require('./_helpers');
const { ensureStore } = require('./data_adapter');

function getSessionId(event){
  const header = event.headers || {};
  const cookieHeader = header.cookie || header.Cookie || '';
  const match = cookieHeader.match(/liftly_session=([^;]+)/);
  return match ? match[1] : null;
}

exports.handler = async function(event) {
  const sid = getSessionId(event);
  if (!sid) return { statusCode: 200, body: JSON.stringify({ user: null }) };
  const store = ensureStore();
  const session = (store.sessions || []).find(s => s.id === sid);
  if (!session) return { statusCode: 200, body: JSON.stringify({ user: null }) };
  const user = (store.users || []).find(u => u.id === session.userId);
  if (!user) return { statusCode: 200, body: JSON.stringify({ user: null }) };
  const safe = { ...user }; delete safe.passwordHash;
  return { statusCode: 200, body: JSON.stringify({ user: safe }) };
};
