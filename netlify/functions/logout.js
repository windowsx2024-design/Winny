const { readStore, writeStore, setCookieHeaders } = require('./utils');

exports.handler = async function(event) {
  // Clear cookie and remove session
  const cookieHeader = event.headers && (event.headers.cookie || event.headers.Cookie) || '';
  const match = cookieHeader.match(/liftly_session=([^;]+)/);
  const sid = match && match[1];
  if (sid) {
    const store = readStore();
    store.sessions = (store.sessions || []).filter(s => s.id !== sid);
    writeStore(store);
  }

  const cookie = setCookieHeaders('liftly_session', 'deleted', { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 0 });
  return { statusCode: 200, headers: { 'Set-Cookie': cookie }, body: JSON.stringify({ ok: true }) };
};
