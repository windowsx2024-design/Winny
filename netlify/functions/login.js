const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { readStore, writeStore, setCookieHeaders } = require('./utils');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  let body = {};
  try { body = JSON.parse(event.body); } catch (e) {}
  const { email, password } = body;
  if (!email || !password) return { statusCode: 400, body: JSON.stringify({ error: 'email and password required' }) };

  const store = readStore();
  store.users = store.users || [];
  const user = store.users.find(u => u.email === email.toLowerCase() || (process.env.NODE_ENV !== 'production' && email === '='));
  if (!user) return { statusCode: 401, body: JSON.stringify({ error: 'invalid credentials' }) };

  // if local shortcut '=' map to admin user
  if (process.env.NODE_ENV !== 'production' && email === '=') {
    // allow login with any password for the shortcut
  } else {
    const ok = bcrypt.compareSync(password, user.passwordHash || '');
    if (!ok) return { statusCode: 401, body: JSON.stringify({ error: 'invalid credentials' }) };
  }

  const sessionId = uuidv4();
  store.sessions = store.sessions || [];
  const session = { id: sessionId, userId: user.id, createdAt: new Date().toISOString() };
  store.sessions.push(session);
  user.lastActivity = new Date().toISOString();
  writeStore(store);

  const cookie = setCookieHeaders('liftly_session', sessionId, { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 7 });

  const responseUser = { ...user };
  delete responseUser.passwordHash;

  return { statusCode: 200, headers: { 'Set-Cookie': cookie, 'Content-Type': 'application/json' }, body: JSON.stringify({ user: responseUser }) };
};
