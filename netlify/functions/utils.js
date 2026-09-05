const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const STORE_PATH = path.join(__dirname, '..', '..', 'store.json');

function readStore() {
  try {
    const raw = fs.readFileSync(STORE_PATH, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (e) {
    return { users: [], sessions: [], shopify: {}, stripe: {} };
  }
}

function writeStore(data) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function generateUserId() {
  return uuidv4();
}

function generateUserCode() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

function setCookieHeaders(name, value, opts = {}) {
  const parts = [`${name}=${value}`];
  if (opts.httpOnly) parts.push('HttpOnly');
  if (opts.secure) parts.push('Secure');
  if (opts.path) parts.push(`Path=${opts.path}`);
  if (opts.maxAge) parts.push(`Max-Age=${opts.maxAge}`);
  return parts.join('; ');
}

module.exports = { readStore, writeStore, generateUserId, generateUserCode, setCookieHeaders };
