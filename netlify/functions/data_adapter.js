const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const STORE = path.join(__dirname, '..', 'store.json');

function ensureStore(){ try{ if(!fs.existsSync(STORE)) fs.writeFileSync(STORE, JSON.stringify({ users:[], sessions:[], products:[], payments:[] }, null,2)); const raw = fs.readFileSync(STORE,'utf8')||'{}'; return JSON.parse(raw); }catch(e){ return { users:[], sessions:[], products:[], payments:[] }; } }
function saveStore(s){ fs.writeFileSync(STORE, JSON.stringify(s,null,2),'utf8'); }

function findUserByEmail(email){ const store = ensureStore(); return (store.users||[]).find(u=>u.email === (email||'').toLowerCase()); }
function createUser({ email, passwordHash, name, isAdmin }){ const store=ensureStore(); const id=uuidv4(); const code=Math.random().toString(36).slice(2,10).toUpperCase(); const now=new Date().toISOString(); const user={ id, code, email:(email||'').toLowerCase(), name:name||'', passwordHash:passwordHash||null, createdAt: now, status:'active', lastActivity: now, plan:'free', savedItems:[], isAdmin: !!isAdmin }; store.users = store.users || []; store.users.push(user); saveStore(store); return user; }
function createSession(userId){ const store = ensureStore(); const id = uuidv4(); store.sessions = store.sessions || []; const session = { id, userId, createdAt: new Date().toISOString() }; store.sessions.push(session); saveStore(store); return session; }
function getSession(sessionId){ if(!sessionId) return null; const store = ensureStore(); return (store.sessions||[]).find(s=>s.id===sessionId)||null; }
function destroySession(sessionId){ const store=ensureStore(); store.sessions = (store.sessions||[]).filter(s=>s.id!==sessionId); saveStore(store); return true; }
function getUserById(id){ const store=ensureStore(); return (store.users||[]).find(u=>u.id===id)||null; }
function listProducts(){ const store=ensureStore(); return store.products || []; }

module.exports = { ensureStore, saveStore, findUserByEmail, createUser, createSession, getSession, destroySession, getUserById, listProducts };
