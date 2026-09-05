const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');
const MIME = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8'};
const initialData = {
  dashboard: { storeName:'Northstar Goods', netSales:12480, orders:186, conversion:3.8, profit:4990, payout:2180.40 },
  queue: [],
  users: [
    {id:'alex-chen', name:'Alex Chen', email:'alex@northstargoods.com', plan:'Growth', revenue:12480, views:6800000, purchases:186, status:'Active'},
    {id:'maya-singh', name:'Maya Singh', email:'maya@oceanroom.com', plan:'Starter', revenue:4360, views:1200000, purchases:73, status:'Active'},
    {id:'jordan-lee', name:'Jordan Lee', email:'jordan@northmarket.com', plan:'Growth', revenue:21890, views:9100000, purchases:312, status:'Active'}
  ],
  accessRequests: [
    {id:'request-sam-rivera', name:'Sam Rivera', email:'sam@rivera.store', requestedAt:'2026-09-05T09:30:00.000Z', status:'pending'}
  ],
  plans: [{id:'starter', name:'Starter', price:19, description:'For your first product tests.', features:['10 product saves','Basic sales signals','CSV exports']},{id:'growth', name:'Growth', price:49, description:'For stores ready to move faster.', features:['Unlimited product saves','Viral product intel','Store performance']},{id:'scale', name:'Scale', price:99, description:'For teams building a portfolio.', features:['Everything in Growth','Team access','Priority support']}],
  products: [
    {id:'magnetic-phone-mount', title:'Magnetic Phone Mount', cost:3.82, rating:4.8, supplierOrders:'2,000+'},
    {id:'pet-hair-remover', title:'Pet Hair Remover', cost:4.25, rating:4.9, supplierOrders:'1,000+'},
    {id:'portable-blender', title:'Portable Blender', cost:8.90, rating:4.7, supplierOrders:'500+'}
  ]
};

function data() { if (!fs.existsSync(DATA_FILE)) { fs.mkdirSync(DATA_DIR, {recursive:true}); fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2)); } return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
function save(value) { fs.mkdirSync(DATA_DIR, {recursive:true}); fs.writeFileSync(DATA_FILE, JSON.stringify(value, null, 2)); }
function send(res, status, payload, headers={}) { res.writeHead(status, {'Content-Type':'application/json; charset=utf-8', ...headers}); res.end(JSON.stringify(payload)); }
function readBody(req) { return new Promise((resolve, reject) => { let body=''; req.on('data', chunk => { body += chunk; if (body.length > 1e6) req.destroy(); }); req.on('end', () => { try { resolve(body ? JSON.parse(body) : {}); } catch { reject(new Error('Invalid JSON body')); } }); }); }
function csvCell(value) { return `"${String(value).replace(/"/g, '""')}"`; }
function serveFile(res, pathname) {
  const file = pathname === '/' ? path.join(ROOT, 'index.html') : path.resolve(ROOT, `.${pathname}`);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return send(res, 404, {error:'Not found'});
  res.writeHead(200, {'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Referrer-Policy':'strict-origin-when-cross-origin'}); fs.createReadStream(file).pipe(res);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (req.method === 'GET' && url.pathname === '/api/dashboard') return send(res, 200, data().dashboard);
    if (req.method === 'GET' && url.pathname === '/api/products') return send(res, 200, data().products);
    if (req.method === 'GET' && url.pathname === '/api/queue') return send(res, 200, data().queue);
    if (req.method === 'GET' && url.pathname === '/api/admin/users') return send(res, 200, data().users);
    if (req.method === 'GET' && url.pathname === '/api/admin/access-requests') return send(res, 200, data().accessRequests || []);
    if (req.method === 'POST' && /^\/api\/admin\/access-requests\/[^/]+$/.test(url.pathname)) {
      const {decision} = await readBody(req); const id = url.pathname.split('/')[4]; const store = data(); const request = (store.accessRequests || []).find(item => item.id === id);
      if (!request || request.status !== 'pending') return send(res, 404, {error:'Pending access request not found.'});
      if (!['approve','decline'].includes(decision)) return send(res, 400, {error:'Choose approve or decline.'});
      request.status = decision === 'approve' ? 'approved' : 'declined';
      if (decision === 'approve' && !store.users.some(user => user.email === request.email)) store.users.push({id:request.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]+/g,'-'),name:request.name,email:request.email,plan:'Starter',revenue:0,views:0,purchases:0,status:'Active'});
      save(store); return send(res, 200, {message:`${request.name}'s access was ${request.status}.`});
    }
    if (req.method === 'POST' && /^\/api\/admin\/users\/[^/]+\/metrics$/.test(url.pathname)) {
      const body = await readBody(req); const id = url.pathname.split('/')[4]; const store = data(); const user = store.users.find(item => item.id === id);
      if (!user) return send(res, 404, {error:'Seller not found.'});
      for (const field of ['revenue','views','purchases']) { const value = Number(body[field]); if (!Number.isFinite(value) || value < 0) return send(res, 400, {error:`${field} must be a positive number.`}); user[field] = value; }
      save(store); return send(res, 200, {message:`${user.name}'s performance was updated.`, user});
    }
    if (req.method === 'GET' && url.pathname === '/api/payments/plans') return send(res, 200, data().plans);
    if (req.method === 'POST' && url.pathname === '/api/payments/checkout') {
      const {planId} = await readBody(req); const plan = data().plans.find(item => item.id === planId);
      if (!plan) return send(res, 404, {error:'Plan not found.'});
      return send(res, 501, {message:`${plan.name} is selected. Connect Stripe or another payment provider to take a live payment.`});
    }
    if (req.method === 'POST' && url.pathname === '/api/queue') {
      const body = await readBody(req); const store = data();
      const product = store.products.find(item => item.id === body.productId);
      if (!product) return send(res, 404, {error:'Product not found'});
      if (!store.queue.some(item => item.id === product.id)) store.queue.push({...product, addedAt:new Date().toISOString()});
      save(store); return send(res, 201, {message:`${product.title} added to your queue.`, product});
    }
    if (req.method === 'POST' && url.pathname === '/api/auth/email') {
      const {email} = await readBody(req);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '')) return send(res, 400, {error:'Please enter a valid email address.'});
      const store = data(); const user = store.users.find(item => item.email.toLowerCase() === email.toLowerCase());
      if (user) return send(res, 200, {message:'Sign-in link prepared.', token:crypto.randomUUID()});
      let request = (store.accessRequests || []).find(item => item.email.toLowerCase() === email.toLowerCase());
      if (request?.status === 'approved') return send(res, 200, {message:'Your access is approved. Sign-in link prepared.', token:crypto.randomUUID()});
      if (!request) { request = {id:crypto.randomUUID(),name:email.split('@')[0],email,requestedAt:new Date().toISOString(),status:'pending'}; store.accessRequests = [...(store.accessRequests || []), request]; save(store); }
      return send(res, 202, {message:'Your access request is waiting for admin approval.'});
    }
    if (req.method === 'POST' && url.pathname === '/api/auth/provider') {
      const {provider} = await readBody(req);
      if (!['Google','Apple','Facebook','TikTok','X'].includes(provider)) return send(res, 400, {error:'Unsupported provider.'});
      return send(res, 501, {message:`${provider} OAuth needs client credentials. Add them as environment variables before enabling this provider.`});
    }
    if (req.method === 'POST' && url.pathname === '/api/shopify/export') {
      const {title, price, description='', video=''} = await readBody(req);
      if (!title || !price) return send(res, 400, {error:'Product title and price are required.'});
      const handle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const csv = [["Handle","Title","Body (HTML)","Vendor","Variant Price","Status"],[handle,title,`<p>${description}${video ? ` Video: ${video}` : ''}</p>`,'Liftly',price,'draft']].map(row => row.map(csvCell).join(',')).join('\n');
      res.writeHead(200, {'Content-Type':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="${handle}-shopify.csv"`}); return res.end(csv);
    }
    serveFile(res, url.pathname);
  } catch (error) { console.error(error); send(res, 500, {error:'Something went wrong. Please try again.'}); }
});
server.listen(PORT, () => console.log(`Liftly is running at http://localhost:${PORT}`));
