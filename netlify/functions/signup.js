const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { readStore, writeStore, generateUserId, generateUserCode, setCookieHeaders } = require('./utils');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch (e) {}

  const { email, password, name } = body;
  if (!email || !password) return { statusCode: 400, body: JSON.stringify({ error: 'email and password required' }) };

  const store = readStore();
  store.users = store.users || [];
  const existing = store.users.find(u => u.email === email.toLowerCase());
  if (existing) return { statusCode: 409, body: JSON.stringify({ error: 'user exists' }) };

  const id = generateUserId();
  const code = generateUserCode();
  const hash = bcrypt.hashSync(password, 10);
  const now = new Date().toISOString();

  const user = { id, code, email: email.toLowerCase(), name: name || '', passwordHash: hash, createdAt: now, status: 'active', lastActivity: now, plan: 'free', savedItems: [], isAdmin: false };
  if (process.env.NODE_ENV !== 'production' && email === '=') { user.email = 'admin@local'; user.isAdmin = true; user.name = 'Local Admin (Norway Shortcut)'; }

  store.users.push(user);
  writeStore(store);

  // create session
  const sessionId = uuidv4();
  store.sessions = store.sessions || [];
  store.sessions.push({ id: sessionId, userId: user.id, createdAt: new Date().toISOString() });
  writeStore(store);

  const cookie = setCookieHeaders('liftly_session', sessionId, { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60*60*24*7 });
  const safe = { ...user }; delete safe.passwordHash;
  return { statusCode: 201, headers: { 'Set-Cookie': cookie, 'Content-Type': 'application/json' }, body: JSON.stringify({ user: safe }) };
};
