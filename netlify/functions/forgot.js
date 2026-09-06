const { createResetTokenForEmail } = require('./data_adapter');
const { parseCookies } = require('./_helpers');

async function trySendEmail(to, subject, text){ // call local send_email function
  const fetch = require('node-fetch');
  try{ const res = await fetch(process.env.SEND_EMAIL_PROXY_URL || (process.env.SITE_URL||'') + '/.netlify/functions/send_email', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ to, subject, text }) }); const j = await res.json(); return j; }catch(e){ return null; } }

exports.handler = async function(event){ if(event.httpMethod !== 'POST') return { statusCode:405, body: JSON.stringify({ error:'Method Not Allowed' }) }; let body={}; try{ body = JSON.parse(event.body||'{}'); }catch(e){}
  const { email } = body; if(!email) return { statusCode:400, body: JSON.stringify({ error:'email required' }) };
  const tok = createResetTokenForEmail(email);
  if(!tok) return { statusCode:200, body: JSON.stringify({ ok:true, note:'If that email exists, you will receive reset instructions' }) };
  const resetUrl = (process.env.SITE_URL||'http://localhost:8888') + '/reset.html?token=' + tok.token;
  const subject = 'Liftly password reset';
  const text = `Use this link to reset your password (valid for 1 hour): ${resetUrl}`;
  // Attempt to send email; if not configured return token only in development
  const sent = await trySendEmail(email, subject, text);
  if(!sent){ if(process.env.NODE_ENV !== 'production'){ return { statusCode:200, body: JSON.stringify({ ok:true, token: tok.token, resetUrl }) }; } else { return { statusCode:200, body: JSON.stringify({ ok:true }) }; } }
  return { statusCode:200, body: JSON.stringify({ ok:true }) };
};
