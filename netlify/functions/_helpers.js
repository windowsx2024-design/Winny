const { ensureStore, saveStore } = require('./data_adapter');

function parseCookies(event) {
  const header = (event.headers && (event.headers.cookie || event.headers.Cookie)) || '';
  const parts = header.split(/;\s*/).filter(Boolean);
  const map = {};
  parts.forEach(p=>{ const [k,v] = p.split('='); if(k) map[k]=v; });
  return map;
}

function setCookieHeader(name, value, opts={}){
  const parts = [`${name}=${value}`];
  if (opts.httpOnly) parts.push('HttpOnly');
  if (opts.secure) parts.push('Secure');
  if (opts.sameSite) parts.push(`SameSite=${opts.sameSite}`);
  if (opts.path) parts.push(`Path=${opts.path}`);
  if (opts.maxAge) parts.push(`Max-Age=${opts.maxAge}`);
  return parts.join('; ');
}

module.exports = { parseCookies, setCookieHeader };
