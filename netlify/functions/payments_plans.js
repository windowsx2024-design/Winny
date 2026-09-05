const { readStore } = require('./utils');

exports.handler = async function() {
  const store = readStore();
  return { statusCode: 200, body: JSON.stringify(store.plans || []) };
};
