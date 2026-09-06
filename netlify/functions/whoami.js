const { parseCookies, setCookieHeader } = require('./_helpers');
const { getSession, getUserById } = require('./data_adapter');

function getSessionIdFromEvent(event) {
  const header = event.headers || {};
  const cookieHeader = header.cookie || header.Cookie || '';
  const match = cookieHeader.match(/liftly_session=([^;]+)/);
  return match ? match[1] : null;
}

exports.handler = async function(event) {
  const sid = getSessionIdFromEvent(event);
  if (!sid) return { statusCode: 200, body: JSON.stringify({ user: null }) };
  const session = getSession(sid);
  if (!session) return { statusCode: 200, body: JSON.stringify({ user: null }) };
  const user = getUserById(session.userId);
  if (!user) return { statusCode: 200, body: JSON.stringify({ user: null }) };
  const safe = { ...user }; delete safe.passwordHash;
  return { statusCode: 200, body: JSON.stringify({ user: safe }) };
};
