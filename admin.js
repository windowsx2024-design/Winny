const usersRoot = document.querySelector('#users');
const form = document.querySelector('#metricsForm');
const toast = document.querySelector('#toast');
let selectedUser;

const safeFetch = async (url, opts = {}) => {
  opts.credentials = opts.credentials || 'include';
  if (!opts.headers) opts.headers = {};
  const res = await fetch(url, opts);
  const contentType = res.headers.get('content-type') || '';
  if (!res.ok) {
    let detail = null;
    try { detail = await res.json(); } catch (e) { try { detail = await res.text(); } catch (e) { detail = null } }
    return { ok: false, status: res.status, detail };
  }
  if (contentType.includes('application/json')) { const json = await res.json(); return { ok: true, status: res.status, json }; }
  const text = await res.text(); return { ok: true, status: res.status, text };
};

function notify(message){toast.textContent=message;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),3200)}
function money(value){return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(value)}

function renderUsers(users){
  if (!Array.isArray(users)) { notify('No users'); return; }
  document.querySelector('#userCount').textContent=`${users.length} accounts`;
  usersRoot.innerHTML = users.map(user => `<button class="user-row ${selectedUser?.id===user.id?'selected':''}" data-id="${user.id}"><div class="avatar">${(user.name||user.email||'U')[0]}</div><div class="meta"><b>${user.name||user.email}</b><span>${user.email}</span></div></button>`).join('');
  document.querySelectorAll('.user-row').forEach(btn => btn.addEventListener('click', () => {
    const id = btn.dataset.id; const user = users.find(u => u.id === id); select(user, users);
  }));
}

function select(user, users){ selectedUser = user; document.querySelector('#editorEmpty').hidden = true; form.hidden = false; document.querySelector('#avatar').textContent = user.name?.[0] || 'U'; document.querySelector('#name').value = user.name || ''; document.querySelector('#email').value = user.email || ''; document.querySelector('#revenue').value = user.revenue || 0; document.querySelector('#views').value = user.views || 0; document.querySelector('#purchases').value = user.purchases || 0; }

async function load(){
  try {
    const res = await safeFetch('/api/admin/users', { method: 'GET' });
    if (!res.ok) { if (res.status === 401) { notify('Unauthorized — sign in as admin.'); return; } notify('Could not load users'); return; }
    renderUsers(res.json || res);
    if ((res.json || res).length) select((res.json || res)[0], res.json || res);
  } catch (e) { notify('Start the Liftly server to load seller data.'); }
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!selectedUser) return;
  const body = Object.fromEntries(new FormData(form));
  try {
    const response = await safeFetch(`/api/admin/users/${selectedUser.id}/metrics`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!response.ok) { notify(response.detail?.error || 'Failed to update metrics'); return; }
    notify(response.json?.message || 'Saved');
    load();
  } catch (e) { notify('Request failed'); }
});

// initial load
load();
