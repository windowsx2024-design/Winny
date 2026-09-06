const axios = require('axios');

exports.handler = async function(event) {
  if (!process.env.WEB_IMAGE_API_KEY) return { statusCode: 501, body: JSON.stringify({ error: 'Web image API not configured' }) };
  const q = (event.queryStringParameters && event.queryStringParameters.q) || '';
  if (!q) return { statusCode: 400, body: JSON.stringify({ error: 'q query parameter required' }) };
  try {
    const res = await axios.get('https://api.bing.microsoft.com/v7.0/images/search', { headers: { 'Ocp-Apim-Subscription-Key': process.env.WEB_IMAGE_API_KEY }, params: { q, count: 10 } });
    return { statusCode: 200, body: JSON.stringify(res.data) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Image API error', detail: err.message }) };
  }
};
