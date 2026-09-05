const { readStore } = require('./utils');

exports.handler = async function(event) {
  if (event.httpMethod !== 'GET') return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  const store = readStore();
  return { statusCode: 200, body: JSON.stringify(store.products || []) };
};
