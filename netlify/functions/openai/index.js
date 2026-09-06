const axios = require('axios');
const { readStore } = require('../utils');

exports.handler = async function(event) {
  if (!process.env.OPENAI_API_KEY) return { statusCode: 501, body: JSON.stringify({ error: 'OpenAI not configured' }) };
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  let body = {};
  try { body = JSON.parse(event.body); } catch (e) {}
  const prompt = body.prompt || '';
  if (!prompt) return { statusCode: 400, body: JSON.stringify({ error: 'prompt required' }) };
  try {
    const res = await axios.post('https://api.openai.com/v1/chat/completions', { model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }] }, { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } });
    return { statusCode: 200, body: JSON.stringify(res.data) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'OpenAI error', detail: err.message }) };
  }
};
