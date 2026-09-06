// Basic placeholder for Shopify integration
// Returns Not configured unless SHOPIFY_API_KEY and SHOPIFY_API_SECRET are set

exports.handler = async function(event) {
  if (!process.env.SHOPIFY_API_KEY || !process.env.SHOPIFY_API_SECRET) {
    return { statusCode: 501, body: JSON.stringify({ error: 'Not configured', provider: 'shopify' }) };
  }
  // TODO: implement OAuth and API flows
  return { statusCode: 501, body: JSON.stringify({ error: 'Not implemented' }) };
};
