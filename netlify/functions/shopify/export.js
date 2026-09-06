const { readStore, writeStore, getSessionUser } = require('../utils');

exports.handler = async function(event) {
  // Shopify export: returns CSV blob of product
  const user = getSessionUser(event);
  if (!user) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  if (process.env.SHOPIFY_API_KEY && process.env.SHOPIFY_API_SECRET) {
    // For local mode, construct a CSV from body if provided
    let body = {};
    try { body = JSON.parse(event.body || '{}'); } catch (e) {}
    const title = body.title || 'untitled';
    const price = body.price || '0.00';
    const description = (body.description || '').replace(/\n/g, ' ');
    const rows = [['Handle','Title','Body (HTML)','Vendor','Variant Price','Status'], [title.toLowerCase().replace(/[^a-z0-9]+/g,'-'), title, `<p>${description}</p>`, 'Liftly', price, 'draft']];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    return { statusCode: 200, headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="${title.replace(/\s+/g,'-')}-shopify.csv"` }, body: csv };
  }
  return { statusCode: 501, body: JSON.stringify({ error: 'Not configured' }) };
};