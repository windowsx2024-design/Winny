// YouTube Data API proxy placeholder
exports.handler = async function(event){ if(!process.env.YOUTUBE_API_KEY) return { statusCode:501, body: JSON.stringify({ error:'Not configured', provider:'youtube' }) }; return { statusCode:501, body: JSON.stringify({ error:'Not implemented' }) }; };
