const fetch = require('node-fetch');
const { readStore } = require('./utils');

exports.handler = async function(event) {
  if (!process.env.OPENAI_API_KEY) return { statusCode: 501, body: JSON.stringify({ error: 'Not configured' }) };
  // Proxy OpenAI request
  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch (e) {}
  const res = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const text = await res.text();
  return { statusCode: res.status, headers: { 'Content-Type': 'application/json' }, body: text };
};