const bcrypt = require('bcryptjs');
const { findUserByEmail, createUser, createSession } = require('./data_adapter');
const { setCookieHeader } = require('./_helpers');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch(e) {}
  const { email, password, name } = body || {};
  if (!email || !password) return { statusCode: 400, body: JSON.stringify({ error: 'email and password required' }) };

  const existing = findUserByEmail(email);
  if (existing) return { statusCode: 409, body: JSON.stringify({ error: 'user exists' }) };

  const hash = bcrypt.hashSync(password, 10);
  const user = createUser({ email, passwordHash: hash, name });

  // create session and set cookie
  const session = createSession(user.id);
  const cookie = setCookieHeader('liftly_session', session.id, { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60*60*24*7 });

  const safe = { ...user }; delete safe.passwordHash;
  return { statusCode: 201, headers: { 'Set-Cookie': cookie, 'Content-Type': 'application/json' }, body: JSON.stringify({ user: safe }) };
};
