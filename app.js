// app.js — enhanced frontend to use full products CRUD and CSV import/export
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

async function loadProducts(q=''){
  const out = document.getElementById('products');
  out.textContent = 'Loading products...';
  const params = new URLSearchParams(); if(q) params.set('q', q);
  const r = await api('products?'+params.toString());
  if(r.ok && r.json){ const list = r.json.products||[]; out.innerHTML = list.map(p=>`<div class="card" data-id="${p.id}"><h4>${escapeHtml(p.title)}</h4><div>${escapeHtml(p.description||'')}</div><div>Price: ${p.price||''}</div><div><button data-action="view">View</button> <button data-action="save">Save</button></div></div>`).join('') } else { out.textContent = 'No products or not configured'; }
}

function escapeHtml(s){ return String(s||'').replace(/[&<>\"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c]; }); }

async function logout(){
  await api('logout',{ method:'POST' });
  await whoami();
}

async function createProduct(form){ const data = { title: form.title.value, description: form.description.value, price: form.price.value }; const r = await api('products', { method:'POST', body: JSON.stringify(data) }); if(r.ok){ form.reset(); await loadProducts(); } else { alert('create failed: ' + (r.json?.error || r.text || r.status)); } }

async function exportCSV(){ const r = await api('products'); if(!r.ok) { alert('Export failed'); return; } const rows = r.json.products || []; const header = ['id','title','description','price','images','variants','ownerId','createdAt']; const csv = [header.join(',')].concat(rows.map(p=> header.map(h=> JSON.stringify(p[h]||'')).join(','))).join('\n'); const blob = new Blob([csv],{type:'text/csv'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='products.csv'; document.body.appendChild(a); a.click(); a.remove(); }

async function importCSV(file){ const text = await file.text(); const lines = text.split(/\r?\n/).filter(Boolean); if(lines.length<2) return; const header = lines[0].split(',').map(h=>h.replace(/(^\"|\"$)/g,'')); for(let i=1;i<lines.length;i++){ const cols = parseCSVLine(lines[i]); const obj = {}; for(let j=0;j<header.length;j++){ try{ obj[header[j]] = JSON.parse(cols[j]||'""') }catch(e){ obj[header[j]] = cols[j]||'' } }
    // map fields
    const data = { title: obj.title, description: obj.description, price: obj.price }; await api('products', { method:'POST', body: JSON.stringify(data) }); }
  await loadProducts(); }

function parseCSVLine(line){ // naive split that respects quoted JSON strings
  const parts = []; let cur=''; let inQuotes=false; for(let i=0;i<line.length;i++){ const ch=line[i]; if(ch==='"'){ inQuotes=!inQuotes; cur+=ch; } else if(ch===',' && !inQuotes){ parts.push(cur); cur=''; } else cur+=ch; } if(cur) parts.push(cur); return parts; }

async function handleProductsClick(e){ const btn = e.target.closest('button'); if(!btn) return; const action = btn.getAttribute('data-action'); const card = btn.closest('.card'); const id = card && card.getAttribute('data-id'); if(action==='view'){ const r = await api('products/'+id); if(r.ok && r.json){ const p = r.json.product; alert(JSON.stringify(p,null,2)); } }
  if(action==='save'){ const r = await api('products/'+id+'/save', { method:'POST' }); if(r.ok) { alert('Saved'); } else { alert('Save failed: ' + (r.json?.error||r.text)); } }
}

document.addEventListener('DOMContentLoaded', async ()=>{
  document.getElementById('btnLogout').addEventListener('click', logout);
  document.getElementById('products').addEventListener('click', handleProductsClick);
  document.getElementById('searchForm').addEventListener('submit', async (ev)=>{ ev.preventDefault(); const q = document.getElementById('q').value; await loadProducts(q); });
  document.getElementById('createForm').addEventListener('submit', async (ev)=>{ ev.preventDefault(); await createProduct(ev.target); });
  document.getElementById('exportCSV').addEventListener('click', exportCSV);
  document.getElementById('importCSV').addEventListener('change', async (ev)=>{ const f = ev.target.files[0]; if(f) await importCSV(f); });
  await whoami();
  await loadProducts();
});
