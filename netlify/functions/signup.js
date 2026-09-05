const bcrypt = require('bcryptjs');
const { readStore, writeStore, generateUserId, generateUserCode } = require('./utils');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  let body = {};
  try { body = JSON.parse(event.body); } catch (e) { }

  const { email, password, name } = body;
  if (!email || !password) {
    return { statusCode: 400, body: JSON.stringify({ error: 'email and password required' }) };
  }

  const store = readStore();
  store.users = store.users || [];
  const existing = store.users.find(u => u.email === email.toLowerCase());
  if (existing) {
    return { statusCode: 409, body: JSON.stringify({ error: 'user exists' }) };
  }

  const id = generateUserId();
  const code = generateUserCode();
  const hash = bcrypt.hashSync(password, 10);
  const now = new Date().toISOString();

  const user = {
    id,
    code,
    email: email.toLowerCase(),
    name: name || '',
    passwordHash: hash,
    createdAt: now,
    status: 'active',
    lastActivity: now,
    plan: 'free',
    savedItems: [],
    isAdmin: false
  };

  // Local development admin shortcut: email = '=' gives an admin user (disabled in production)
  if (process.env.NODE_ENV !== 'production' && email === '=') {
    user.email = 'admin@local';
    user.isAdmin = true;
    user.name = 'Local Admin (Norway Shortcut)';
  }

  store.users.push(user);
  writeStore(store);

  // Do not return passwordHash
  const responseUser = { ...user };
  delete responseUser.passwordHash;

  return { statusCode: 201, body: JSON.stringify({ user: responseUser }) };
};
