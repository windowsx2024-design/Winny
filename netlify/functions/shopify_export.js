const { readStore } = require('./utils');

function csvRow(row) { return row.map(v => `"${String(v).replace(/"/g,'""')}"`).join(','); }

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  let body = {};
  try { body = JSON.parse(event.body); } catch (e) {}
  const { title, price, description = '', video = '' } = body;
  if (!title || !price) return { statusCode: 400, body: JSON.stringify({ error: 'Product title and price are required.' }) };
  const handle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const csv = [
    ['Handle','Title','Body (HTML)','Vendor','Variant Price','Status'],
    [handle, title, `<p>${description}${video ? ` Video: ${video}` : ''}</p>`, 'Liftly', price, 'draft']
  ].map(csvRow).join('\n');

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${handle}-shopify.csv"` },
    body: csv
  };
};
