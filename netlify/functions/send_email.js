const nodemailer = require('nodemailer');

exports.handler = async function(event){ // expects JSON { to, subject, text, html }
  let body={}; try{ body = JSON.parse(event.body||'{}'); }catch(e){ }
  const { to, subject, text, html } = body;
  if(!to) return { statusCode:400, body: JSON.stringify({ error:'to required' }) };
  const smtpUrl = process.env.SMTP_URL || null;
  if(!smtpUrl) return { statusCode:501, body: JSON.stringify({ error:'Not configured', provider:'email' }) };
  try{
    const transporter = nodemailer.createTransport(smtpUrl);
    const info = await transporter.sendMail({ from: process.env.SMTP_FROM || 'no-reply@liftly.local', to, subject: subject||'Message from Liftly', text, html });
    return { statusCode:200, body: JSON.stringify({ ok:true, info }) };
  }catch(e){ return { statusCode:500, body: JSON.stringify({ error: e.message }) }; }
};
