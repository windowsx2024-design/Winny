// send_email placeholder
exports.handler = async function(event){ if(!process.env.SMTP_URL && !(process.env.MAILGUN_API_KEY||process.env.SES_KEY)) return { statusCode:501, body: JSON.stringify({ error:'Not configured', provider:'email' }) }; return { statusCode:501, body: JSON.stringify({ error:'Not implemented' }) }; };
