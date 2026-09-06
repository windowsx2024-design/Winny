// Shopify placeholder. Returns Not configured unless variables present
exports.handler = async function(event){ if(!process.env.SHOPIFY_API_KEY || !process.env.SHOPIFY_API_SECRET) return { statusCode:501, body: JSON.stringify({ error:'Not configured', provider:'shopify' }) }; return { statusCode:501, body: JSON.stringify({ error:'Not implemented' }) }; };
