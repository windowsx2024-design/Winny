const { readStore } = require('../utils');

exports.handler = async function(event) {
  const store = readStore();
  const plans = store.plans || [];
  return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(plans) };
};