const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const STORE = path.join(__dirname, '..', 'store.json');

function ensureStore(){ try{ if(!fs.existsSync(STORE)) fs.writeFileSync(STORE, JSON.stringify({ users:[], sessions:[], products:[], payments:[], resetTokens:[] }, null,2)); const raw = fs.readFileSync(STORE,'utf8')||'{}'; return JSON.parse(raw); }catch(e){ return { users:[], sessions:[], products:[], payments:[], resetTokens:[] }; } }
function saveStore(s){ fs.writeFileSync(STORE, JSON.stringify(s,null,2),'utf8'); }

function findUserByEmail(email){ const store = ensureStore(); return (store.users||[]).find(u=>u.email === (email||'').toLowerCase()); }
function getUserById(id){ const store=ensureStore(); return (store.users||[]).find(u=>u.id===id)||null; }
function createUser({ email, passwordHash, name, isAdmin }){ const store=ensureStore(); const id=uuidv4(); const code=Math.random().toString(36).slice(2,10).toUpperCase(); const now=new Date().toISOString(); const user={ id, code, email:(email||'').toLowerCase(), name:name||'', passwordHash:passwordHash||null, createdAt: now, status:'active', lastActivity: now, plan:'free', savedItems:[], isAdmin: !!isAdmin }; store.users = store.users || []; store.users.push(user); saveStore(store); return user; }

function createSession(userId){ const store = ensureStore(); const id = uuidv4(); store.sessions = store.sessions || []; const session = { id, userId, createdAt: new Date().toISOString() }; store.sessions.push(session); saveStore(store); return session; }
function getSession(sessionId){ if(!sessionId) return null; const store = ensureStore(); return (store.sessions||[]).find(s=>s.id===sessionId)||null; }
function destroySession(sessionId){ const store=ensureStore(); store.sessions = (store.sessions||[]).filter(s=>s.id!==sessionId); saveStore(store); return true; }

// Product functions
function listProducts({ q, ownerId, savedByUserId, sort, page=1, pageSize=50 }={}){
  const store = ensureStore(); let products = (store.products||[]).slice();
  if(q){ const qq = q.toLowerCase(); products = products.filter(p => (p.title||'').toLowerCase().includes(qq) || (p.description||'').toLowerCase().includes(qq) || (p.tags||[]).join(' ').toLowerCase().includes(qq)); }
  if(ownerId){ products = products.filter(p=>p.ownerId===ownerId); }
  if(savedByUserId){ // return products saved by user
    const user = (store.users||[]).find(u=>u.id===savedByUserId);
    const saved = (user && user.savedItems) || [];
    products = products.filter(p=> saved.includes(p.id));
  }
  if(sort === 'newest') products = products.sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));
  if(sort === 'oldest') products = products.sort((a,b)=> new Date(a.createdAt) - new Date(b.createdAt));
  if(sort === 'price_asc') products = products.sort((a,b)=>(Number(a.price)||0)-(Number(b.price)||0));
  if(sort === 'price_desc') products = products.sort((a,b)=>(Number(b.price)||0)-(Number(a.price)||0));
  // pagination
  const start = (page-1)*pageSize; const paged = products.slice(start, start+pageSize);
  return { total: products.length, products: paged };
}

function createProduct({ ownerId, title, description, price, images, variants, isPublic }){
  const store = ensureStore(); const id = uuidv4(); const now=new Date().toISOString(); const p = { id, ownerId, title:title||'Untitled', description:description||'', price: price||0, images: images||[], variants: variants||[], isPublic: isPublic===undefined? true: !!isPublic, createdAt: now, updatedAt: now }; store.products = store.products || []; store.products.push(p); saveStore(store); return p;
}

function getProductById(id){ const store = ensureStore(); return (store.products||[]).find(p=>p.id===id)||null; }

function updateProduct(id, updates, actorId){ const store = ensureStore(); const idx = (store.products||[]).findIndex(p=>p.id===id); if(idx===-1) return null; const p = store.products[idx]; // only owner can update
  if(p.ownerId && actorId && p.ownerId !== actorId) return null; const updated = Object.assign({}, p, updates, { updatedAt: new Date().toISOString() }); store.products[idx]=updated; saveStore(store); return updated; }

function deleteProduct(id, actorId){ const store = ensureStore(); const idx = (store.products||[]).findIndex(p=>p.id===id); if(idx===-1) return false; const p = store.products[idx]; if(p.ownerId && actorId && p.ownerId !== actorId) return false; store.products.splice(idx,1); saveStore(store); return true; }

function saveProductForUser(userId, productId){ const store = ensureStore(); const user = (store.users||[]).find(u=>u.id===userId); if(!user) return false; user.savedItems = user.savedItems || []; if(!user.savedItems.includes(productId)) user.savedItems.push(productId); saveStore(store); return true; }
function unsaveProductForUser(userId, productId){ const store = ensureStore(); const user = (store.users||[]).find(u=>u.id===userId); if(!user) return false; user.savedItems = (user.savedItems||[]).filter(x=>x!==productId); saveStore(store); return true; }

// Reset tokens
function createResetTokenForEmail(email){ const store=ensureStore(); const user = findUserByEmail(email); if(!user) return null; const token = uuidv4(); const now = new Date(); const expiresAt = new Date(now.getTime() + 1000*60*60); // 1 hour
  store.resetTokens = store.resetTokens || [];
  store.resetTokens.push({ token, userId: user.id, createdAt: now.toISOString(), expiresAt: expiresAt.toISOString(), used:false }); saveStore(store); return { token, userId: user.id, expiresAt: expiresAt.toISOString() };
}
function verifyResetToken(token){ const store=ensureStore(); store.resetTokens = store.resetTokens || []; const rec = store.resetTokens.find(r=>r.token===token && !r.used); if(!rec) return null; if(new Date(rec.expiresAt) < new Date()) return null; return rec; }
function consumeResetToken(token){ const store=ensureStore(); const rec = store.resetTokens.find(r=>r.token===token); if(!rec) return false; rec.used = true; saveStore(store); return true; }

function updateUserPassword(userId, password){ const store = ensureStore(); const u = (store.users||[]).find(x=>x.id===userId); if(!u) return false; u.passwordHash = bcrypt.hashSync(password,10); saveStore(store); return true; }

// Metrics
function getUserMetrics(){ const store=ensureStore(); const totalUsers = (store.users||[]).length; const active = (store.users||[]).filter(u=>u.status==='active').length; const admins = (store.users||[]).filter(u=>u.isAdmin).length; return { totalUsers, active, admins }; }

module.exports = { ensureStore, saveStore, findUserByEmail, createUser, createSession, getSession, destroySession, getUserById, listProducts, createProduct, getProductById, updateProduct, deleteProduct, saveProductForUser, unsaveProductForUser, createResetTokenForEmail, verifyResetToken, consumeResetToken, updateUserPassword, getUserMetrics };
