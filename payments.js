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

const plansRoot = document.querySelector('#plans');
const toast = document.querySelector('#toast');
function notify(msg){ toast.textContent = msg; toast.classList.add('show'); setTimeout(()=>toast.classList.remove('show'),3200); }

async function load(){
  try {
    const res = await safeFetch('/api/payments/plans', { method: 'GET' });
    if (!res.ok) { notify('Could not load plans'); return; }
    const plans = res.json || res;
    plansRoot.innerHTML = plans.map(plan => `<article class="plan ${plan.id==='growth'?'featured':''}"><span>${plan.name}</span><div class="price">$${plan.price}</div><p>${plan.description || ''}</p><button class="primary" data-plan="${plan.id}">Choose</button></article>`).join('');
    document.querySelectorAll('#plans .primary').forEach(btn => btn.addEventListener('click', () => checkout(btn.dataset.plan)));
  } catch (e) { notify('Failed to load plans'); }
}

async function checkout(planId){
  try {
    const res = await safeFetch('/api/payments/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ planId }) });
    if (!res.ok) {
      if (res.status === 501) { notify(res.detail?.message || 'Payments Not configured'); return; }
      notify('Checkout failed'); return;
    }
    const payload = res.json || res;
    if (payload.url) { window.location = payload.url; return; }
    notify('Checkout initiated');
  } catch (e) { notify('Checkout request failed'); }
}

// initial load
load();
