// Image search proxy placeholder
exports.handler = async function(event){ if(!process.env.IMAGE_API_KEY) return { statusCode:501, body: JSON.stringify({ error:'Not configured', provider:'image_search' }) }; return { statusCode:501, body: JSON.stringify({ error:'Not implemented' }) }; };
