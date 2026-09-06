// app.js — wires frontend to /api/* endpoints
async function api(path, opts={}){
  const res = await fetch('/api/'+path, Object.assign({credentials:'include',headers:{'Content-Type':'application/json'}}, opts));
  const text = await res.text();
  try{ return { status: res.status, ok: res.ok, json: JSON.parse(text) }; }catch(e){ return { status: res.status, ok: res.ok, text }; }
}

async function whoami(){
  const r = await api('whoami');
  const el = document.getElementById('whoami');
  if(r.json && r.json.user){ el.textContent = `Signed in as ${r.json.user.email} (${r.json.user.name||r.json.user.id})`; } else { el.textContent = 'Not signed in'; }
}

async function loadProducts(){
  const out = document.getElementById('products');
  out.textContent = 'Loading products...';
  const r = await api('products');
  if(r.ok && r.json){ const list = r.json.products||[]; out.innerHTML = list.map(p=>`<div class="card"><h4>${p.title}</h4><div>${p.price||''}</div></div>`).join('') } else { out.textContent = 'No products or not configured'; }
}

async function logout(){
  await api('logout',{ method:'POST' });
  await whoami();
}

document.addEventListener('DOMContentLoaded', async ()=>{
  document.getElementById('btnLogout').addEventListener('click', logout);
  await whoami();
  await loadProducts();
});
