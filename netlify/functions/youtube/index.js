const axios = require('axios');

exports.handler = async function(event) {
  if (!process.env.YOUTUBE_API_KEY) return { statusCode: 501, body: JSON.stringify({ error: 'YouTube not configured' }) };
  const q = (event.queryStringParameters && event.queryStringParameters.q) || '';
  if (!q) return { statusCode: 400, body: JSON.stringify({ error: 'q query parameter required' }) };
  try {
    const res = await axios.get('https://www.googleapis.com/youtube/v3/search', { params: { key: process.env.YOUTUBE_API_KEY, q, part: 'snippet', maxResults: 8 } });
    return { statusCode: 200, body: JSON.stringify(res.data) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'YouTube error', detail: err.message }) };
  }
};
