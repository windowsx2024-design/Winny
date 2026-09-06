const fetch = require('node-fetch');

exports.handler = async function(event) {
  if (!process.env.WEB_IMAGE_API_KEY) return { statusCode: 501, body: JSON.stringify({ error: 'Not configured' }) };
  const qs = event.queryStringParameters || {};
  const q = qs.q || '';
  const url = `https://api.bing.microsoft.com/v7.0/images/search?q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { 'Ocp-Apim-Subscription-Key': process.env.WEB_IMAGE_API_KEY } });
  const json = await res.text();
  return { statusCode: res.status, headers: { 'Content-Type': 'application/json' }, body: json };
};