const { readStore } = require('../utils');

// Backwards-compatible admin_users endpoint used by some legacy frontend code
exports.handler = async function() {
  const store = readStore();
  const safe = (store.users || []).map(u => { const copy = { ...u }; delete copy.passwordHash; return copy; });
  return { statusCode: 200, body: JSON.stringify(safe) };
};
