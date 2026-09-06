const { parseCookies, setCookieHeader } = require('./_helpers');
const { listProducts, createProduct, getProductById, updateProduct, deleteProduct, saveProductForUser, unsaveProductForUser } = require('./data_adapter');

function getSessionId(event){ const header = event.headers || {}; const cookieHeader = header.cookie || header.Cookie || ''; const match = cookieHeader.match(/liftly_session=([^;]+)/); return match ? match[1] : null; }

exports.handler = async function(event){ const method = event.httpMethod; const path = event.path || ''; // path like /api/products or /api/products/:id or /api/products/:id/save
  const parts = path.split('/').filter(Boolean);
  // find id if present
  const maybeId = parts.length >= 2 ? parts[parts.length-1] : null; // crude but works for /api/products/:id and /api/products/:id/save -> we will inspect further
  // Determine final action
  try{
    // GET list or detail
    if(method === 'GET'){
      // if path ends with /products or contains products without id
      if(/\/products$/.test(path)){
        const q = (event.queryStringParameters && event.queryStringParameters.q) || null;
        const sort = (event.queryStringParameters && event.queryStringParameters.sort) || null;
        const page = Number(event.queryStringParameters && event.queryStringParameters.page) || 1;
        const pageSize = Number(event.queryStringParameters && event.queryStringParameters.pageSize) || 50;
        const sid = getSessionId(event);
        // if query has saved=true return only saved
        const saved = (event.queryStringParameters && event.queryStringParameters.saved) === 'true';
        const savedByUserId = saved && sid ? (require('./data_adapter').getSession(sid).userId) : null;
        const res = listProducts({ q, sort, page, pageSize, savedByUserId });
        return { statusCode:200, body: JSON.stringify(res) };
      }
      // product detail
      const m = path.match(/\/products\/([^\/]+)$/);
      if(m){ const id=m[1]; const p = getProductById(id); if(!p) return { statusCode:404, body: JSON.stringify({ error:'not found' }) }; return { statusCode:200, body: JSON.stringify({ product: p }) }; }
    }
    // CREATE product
    if(method === 'POST' && /\/products$/.test(path)){
      const sid = getSessionId(event); let userId=null; if(sid){ const s = require('./data_adapter').getSession(sid); if(s) userId=s.userId; }
      if(!userId) return { statusCode:401, body: JSON.stringify({ error:'unauthorized' }) };
      let body={}; try{ body=JSON.parse(event.body||'{}'); }catch(e){}
      const p = createProduct(Object.assign({}, body, { ownerId: userId })); return { statusCode:201, body: JSON.stringify({ product: p }) };
    }
    // UPDATE product
    if((method==='PUT' || method==='PATCH') && /\/products\/[^\/]+$/.test(path)){
      const sid = getSessionId(event); let userId=null; if(sid){ const s = require('./data_adapter').getSession(sid); if(s) userId=s.userId; }
      if(!userId) return { statusCode:401, body: JSON.stringify({ error:'unauthorized' }) };
      const m = path.match(/\/products\/([^\/]+)$/); const id=m[1]; let body={}; try{ body=JSON.parse(event.body||'{}'); }catch(e){}
      const updated = updateProduct(id, body, userId); if(!updated) return { statusCode:403, body: JSON.stringify({ error:'forbidden or not found' }) }; return { statusCode:200, body: JSON.stringify({ product: updated }) };
    }
    // DELETE product
    if(method==='DELETE' && /\/products\/[^\/]+$/.test(path)){
      const sid = getSessionId(event); let userId=null; if(sid){ const s = require('./data_adapter').getSession(sid); if(s) userId=s.userId; }
      if(!userId) return { statusCode:401, body: JSON.stringify({ error:'unauthorized' }) };
      const m = path.match(/\/products\/([^\/]+)$/); const id=m[1]; const ok = deleteProduct(id, userId); if(!ok) return { statusCode:403, body: JSON.stringify({ error:'forbidden or not found' }) }; return { statusCode:200, body: JSON.stringify({ ok:true }) };
    }
    // Save / Unsave toggles
    if(method==='POST' && /\/products\/[^\/]+\/save$/.test(path)){
      const sid = getSessionId(event); if(!sid) return { statusCode:401, body: JSON.stringify({ error:'unauthorized' }) };
      const s = require('./data_adapter').getSession(sid); if(!s) return { statusCode:401, body: JSON.stringify({ error:'unauthorized' }) };
      const m = path.match(/\/products\/([^\/]+)\/save$/); const id=m[1]; const ok = saveProductForUser(s.userId, id); if(!ok) return { statusCode:500, body: JSON.stringify({ error:'failed' }) }; return { statusCode:200, body: JSON.stringify({ ok:true }) };
    }
    if(method==='DELETE' && /\/products\/[^\/]+\/save$/.test(path)){
      const sid = getSessionId(event); if(!sid) return { statusCode:401, body: JSON.stringify({ error:'unauthorized' }) };
      const s = require('./data_adapter').getSession(sid); if(!s) return { statusCode:401, body: JSON.stringify({ error:'unauthorized' }) };
      const m = path.match(/\/products\/([^\/]+)\/save$/); const id=m[1]; const ok = unsaveProductForUser(s.userId, id); if(!ok) return { statusCode:500, body: JSON.stringify({ error:'failed' }) }; return { statusCode:200, body: JSON.stringify({ ok:true }) };
    }

    return { statusCode:400, body: JSON.stringify({ error:'bad request' }) };
  }catch(e){ return { statusCode:500, body: JSON.stringify({ error: e.message }) }; }
};
