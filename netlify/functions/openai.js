// OpenAI proxy placeholder
exports.handler = async function(event){ if(!process.env.OPENAI_API_KEY) return { statusCode:501, body: JSON.stringify({ error:'Not configured', provider:'openai' }) }; return { statusCode:501, body: JSON.stringify({ error:'Not implemented' }) }; };
