const { ensureStore } = require('./data_adapter');

exports.handler = async function(event){ const store = ensureStore(); const products = store.products || []; return { statusCode:200, body: JSON.stringify({ products }) }; };
