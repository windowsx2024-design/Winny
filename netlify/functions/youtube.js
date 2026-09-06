const fetch = require('node-fetch');

exports.handler = async function(event) {
  if (!process.env.YOUTUBE_API_KEY) return { statusCode: 501, body: JSON.stringify({ error: 'Not configured' }) };
  const qs = event.queryStringParameters || {};
  const q = qs.q || '';
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&key=${process.env.YOUTUBE_API_KEY}&q=${encodeURIComponent(q)}`;
  const res = await fetch(url);
  const json = await res.text();
  return { statusCode: res.status, headers: { 'Content-Type': 'application/json' }, body: json };
};