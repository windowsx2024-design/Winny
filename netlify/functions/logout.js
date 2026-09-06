const { getSessionUser, readStore, writeStore } = require('../utils');

exports.handler = async function(event) {
  // Logout: clear session cookie
  const sidHeader = 'Set-Cookie';
  const cookies = require('../utils').parseCookies(event);
  const sid = cookies.liftly_session;
  if (sid) {
    require('../utils').destroySession(sid);
  }
  const cookie = 'liftly_session=; HttpOnly; Path=/; Max-Age=0';
  return { statusCode: 200, headers: { [sidHeader]: cookie, 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true }) };
};