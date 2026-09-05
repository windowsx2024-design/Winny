exports.handler = async function(event) {
  // Stripe webhook handler placeholder
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return { statusCode: 501, body: JSON.stringify({ error: 'Stripe not configured' }) };
  }

  // In production you would verify signature and handle events here
  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
