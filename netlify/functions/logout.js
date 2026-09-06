const { parseCookies, setCookieHeader } = require('./_helpers');
const { destroySession } = require('./data_adapter');

exports.handler = async function(event){ if(event.httpMethod !== 'POST') return { statusCode:405, body: JSON.stringify({ error:'Method Not Allowed' }) }; const header = event.headers || {}; const cookieHeader = header.cookie || header.Cookie || ''; const match = cookieHeader.match(/liftly_session=([^;]+)/); const sessionId = match ? match[1] : null; if(!sessionId) return { statusCode:200, body: JSON.stringify({ ok:true }) }; destroySession(sessionId); const expired = setCookieHeader('liftly_session','', { path:'/', maxAge:0 }); return { statusCode:200, headers:{ 'Set-Cookie': expired, 'Content-Type':'application/json' }, body: JSON.stringify({ ok:true }) }; };
