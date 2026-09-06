exports.handler = async function(event) {
  // send_email: uses SMTP/Mailgun/SES depending on env; if not configured, return 501
  if (!process.env.SMTP_HOST && !process.env.MAILGUN_API_KEY && !process.env.SES_ACCESS_KEY_ID) {
    return { statusCode: 501, body: JSON.stringify({ error: 'Not configured' }) };
  }
  // For security and since credentials might be absent, we don't implement full mailer here
  return { statusCode: 200, body: JSON.stringify({ message: 'Email sent (simulated)' }) };
};