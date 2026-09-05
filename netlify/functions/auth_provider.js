exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  let body = {};
  try { body = JSON.parse(event.body); } catch (e) {}
  const { provider } = body;
  if (!['Google','Apple','Facebook','TikTok','X'].includes(provider)) return { statusCode: 400, body: JSON.stringify({ error: 'Unsupported provider.' }) };
  return { statusCode: 501, body: JSON.stringify({ message: `${provider} OAuth needs client credentials. Add them as environment variables before enabling this provider.` }) };
};
