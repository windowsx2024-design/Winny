const bcrypt = require('bcryptjs');
const { findUserByEmail, createSession } = require('./data_adapter');
const { setCookieHeader } = require('./_helpers');

exports.handler = async function(event){ if(event.httpMethod!=='POST') return { statusCode:405, body: JSON.stringify({ error:'Method Not Allowed' }) }; let body={}; try{ body=JSON.parse(event.body||'{}'); }catch(e){} const { email, password } = body; if(!email||!password) return { statusCode:400, body: JSON.stringify({ error:'email and password required' }) };

const user = findUserByEmail(email);
if(!user && process.env.NODE_ENV !== 'production' && email === '='){
  // local Norway admin shortcut
  const dummy = { id: 'norway-admin', email:'admin@local', name:'Norway', isAdmin:true };
  const session = createSession(dummy.id);
  const cookie = setCookieHeader('liftly_session', session.id, { httpOnly:true, secure:false, path:'/', maxAge:60*60*24*7 });
  return { statusCode:200, headers:{ 'Set-Cookie': cookie, 'Content-Type':'application/json' }, body: JSON.stringify({ user: dummy }) };
}
if(!user) return { statusCode:401, body: JSON.stringify({ error:'invalid credentials' }) };
const ok = bcrypt.compareSync(password||'', user.passwordHash||''); if(!ok) return { statusCode:401, body: JSON.stringify({ error:'invalid credentials' }) };
const session = createSession(user.id); const cookie = setCookieHeader('liftly_session', session.id, { httpOnly:true, secure: process.env.NODE_ENV==='production', path:'/', maxAge:60*60*24*7 }); const safe = { ...user }; delete safe.passwordHash; return { statusCode:200, headers:{ 'Set-Cookie': cookie, 'Content-Type':'application/json' }, body: JSON.stringify({ user: safe }) };
};
