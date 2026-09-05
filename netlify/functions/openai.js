exports.handler = async function(event) {
  // OpenAI / AI search placeholder
  if (!process.env.OPENAI_API_KEY) {
    return { statusCode: 501, body: JSON.stringify({ error: 'OpenAI not configured' }) };
  }

  return { statusCode: 200, body: JSON.stringify({ ok: true, message: 'AI endpoint scaffold' }) };
};
