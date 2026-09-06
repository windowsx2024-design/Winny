const { verifyResetToken, consumeResetToken, updateUserPassword, createSession } = require('./data_adapter');
const { setCookieHeader } = require('./_helpers');

exports.handler = async function(event){ if(event.httpMethod !== 'POST') return { statusCode:405, body: JSON.stringify({ error:'Method Not Allowed' }) }; let body={}; try{ body=JSON.parse(event.body||'{}'); }catch(e){}
  const { token, password } = body; if(!token||!password) return { statusCode:400, body: JSON.stringify({ error:'token and password required' }) };
  const rec = verifyResetToken(token); if(!rec) return { statusCode:400, body: JSON.stringify({ error:'invalid or expired token' }) };
  const ok = updateUserPassword(rec.userId, password); if(!ok) return { statusCode:500, body: JSON.stringify({ error:'failed to set password' }) };
  consumeResetToken(token);
  // Create session and set cookie
  const session = createSession(rec.userId);
  const cookie = setCookieHeader('liftly_session', session.id, { httpOnly:true, secure: process.env.NODE_ENV==='production', path:'/', maxAge:60*60*24*7 });
  return { statusCode:200, headers:{ 'Set-Cookie': cookie, 'Content-Type':'application/json' }, body: JSON.stringify({ ok:true }) };
};
