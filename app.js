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
  if (contentType.includes('application/json')) {
    const json = await res.json();
    return { ok: true, status: res.status, json };
  }
  if (contentType.includes('text/csv') || contentType.includes('application/csv')) {
    const blob = await res.blob();
    return { ok: true, status: res.status, blob };
  }
  const text = await res.text();
  return { ok: true, status: res.status, text };
};

const $ = (s) => document.querySelector(s);
const toast = $('#toast');
function showToast(message) { toast.textContent = message; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 3200); }
function completeStep(step) { const el = document.querySelector(`.start-step[data-step="${step}"]`); if (!el) return; el.classList.add('done'); el.querySelector('b').textContent = '✓'; }

// whoami check on load to toggle UI
(async function initAuth() {
  try {
    const who = await safeFetch('/api/whoami', { method: 'GET' });
    if (who.ok && who.json) {
      // user is authenticated
      const user = who.json;
      // hide sign in and show account link
      const openLogin = document.getElementById('openLogin'); if (openLogin) openLogin.style.display = 'none';
      const openSignup = document.getElementById('openSignup'); if (openSignup) openSignup.style.display = 'none';
      // Optionally show user name someplace
      const accountLink = document.querySelector('a[href="#account"]'); if (accountLink) accountLink.textContent = 'My account';
    }
  } catch (e) { /* ignore */ }
})();

function setProduct(card) {
  document.querySelectorAll('.product-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');
  $('#listingTitle').textContent = card.dataset.title;
  $('#listingPrice').textContent = `$${card.dataset.price}`;
  $('#listingCopy').textContent = `${card.dataset.tag} — ready to turn attention into orders.`;
  $('#listingThumb').className = `listing-thumb ${card.querySelector('.card-image').classList[1]}`;
  $('#listingStatus').textContent = 'READY TO EXPORT';
  $('#sales').textContent = card.dataset.sales;
  $('#revenue').textContent = card.dataset.revenue;
  $('#growth').textContent = card.dataset.growth;
  $('#views').textContent = card.dataset.views;
}

document.querySelectorAll('.product-card').forEach(card => card.addEventListener('click', () => setProduct(card)));

function youtubeId(url) { const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/); return match?.[1]; }
function loadVideo() {
  const id = youtubeId($('#youtubeUrl').value.trim());
  if (!id) { $('#inputHelp').textContent = 'Please paste a valid YouTube video URL.'; $('#inputHelp').style.color = '#ff9ca0'; return; }
  if (location.protocol === 'file:') { $('#inputHelp').innerHTML = `To preview YouTube videos, open Liftly through the local server at <b>http://localhost:3000</b>.`; $('#inputHelp').style.color = '#c4ff63'; return; }
  $('#youtubeFrame').src = `https://www.youtube.com/embed/${id}?rel=0&origin=${encodeURIComponent(location.origin)}`;
  $('#youtubeFrame').style.display = 'block'; $('#videoPlaceholder').style.display = 'none';
  $('#inputHelp').textContent = 'Video loaded. Your product story is ready.'; $('#inputHelp').style.color = '#c4ff63';
  $('#listingStatus').textContent = 'VIDEO ATTACHED';
  completeStep('video');
}
$('#loadVideo').addEventListener('click', loadVideo);
$('#youtubeUrl').addEventListener('keydown', e => { if (e.key === 'Enter') loadVideo(); });
function scrollToStudio(){ $('#how').scrollIntoView({behavior:'smooth'}); }
$('#startButton').addEventListener('click', scrollToStudio); const closeStart = document.getElementById('closingStart'); if (closeStart) closeStart.addEventListener('click', scrollToStudio); $('#watchButton').addEventListener('click', scrollToStudio);

// Copy listing
$('#copyListing').addEventListener('click', async () => {
  const text = `${$('#listingTitle').textContent}
${$('#listingCopy').textContent}
Price: ${$('#listingPrice').textContent}`;
  try { await navigator.clipboard.writeText(text); showToast('Listing copied to clipboard'); } catch (e) { showToast('Copy failed'); }
});

// Shopify export handling: server may return CSV blob
$('#shopifyButton').addEventListener('click', async () => {
  const title = $('#listingTitle').textContent;
  const price = $('#listingPrice').textContent.replace('$', '');
  const video = $('#youtubeUrl').value.trim();
  const handle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const description = `${$('#listingCopy').textContent}${video ? ` Watch the product video: ${video}` : ''}`;
  const payload = { title, price, description, video };
  const res = await safeFetch('/api/shopify/export', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  if (!res.ok) { if (res.status === 501) showToast('Shopify integration is Not configured.'); else showToast('Export failed.'); return; }
  if (res.blob) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(res.blob);
    link.download = `${handle}-shopify.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
    showToast('Shopify-ready CSV downloaded — upload it in Products → Import.');
    completeStep('store');
    return;
  }
  // fallback: server returned text
  if (res.text) {
    const blob = new Blob([res.text], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${handle}-shopify.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
    showToast('CSV downloaded (fallback)');
    completeStep('store');
  }
});

$('#navConnect').addEventListener('click', () => showToast('Shopify connection opens here in the live product.'));
$('#payoutButton').addEventListener('click', () => showToast('Payout details will appear after your Shopify store is connected.'));

document.querySelectorAll('.import-button').forEach(button => button.addEventListener('click', async () => {
  const name = button.dataset.product;
  const productId = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  try {
    const response = await safeFetch('/api/queue', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId }) });
    if (!response.ok) throw new Error(response.detail || 'error');
    button.textContent = 'Added ✓'; button.disabled = true; showToast(`${name} was added to your store research queue.`);
  } catch (e) { showToast('Could not add to queue.'); }
}));

document.querySelectorAll('.start-step').forEach(step => step.addEventListener('click', () => {
  const destination = step.dataset.step === 'video' ? '#how' : step.dataset.step === 'store' ? '#how' : '#catalog';
  document.querySelector(destination).scrollIntoView({behavior:'smooth'});
}));

const loginOverlay = $('#loginOverlay');
function closeLogin() { if (loginOverlay) { loginOverlay.classList.remove('open'); loginOverlay.setAttribute('aria-hidden', 'true'); } }
const openLoginBtn = document.getElementById('openLogin'); if (openLoginBtn) openLoginBtn.addEventListener('click', () => { if (loginOverlay) { loginOverlay.classList.add('open'); loginOverlay.setAttribute('aria-hidden', 'false'); } });
const closeLoginBtn = document.getElementById('closeLogin'); if (closeLoginBtn) closeLoginBtn.addEventListener('click', closeLogin);
if (loginOverlay) loginOverlay.addEventListener('click', event => { if (event.target === loginOverlay) closeLogin(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeLogin(); });

// Social provider buttons -> use consolidated /api/auth with action: 'provider'
document.querySelectorAll('.social-login').forEach(button => button.addEventListener('click', async () => {
  try {
    const provider = button.dataset.provider;
    const res = await safeFetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'provider', provider }) });
    if (!res.ok) { if (res.status === 501) showToast(`${provider} login is Not configured.`); else showToast('Social login failed.'); return; }
    showToast('Redirecting to provider...');
    // If provider returns a redirect URL, navigate
    if (res.json && res.json.redirect) window.location = res.json.redirect;
  } catch (err) { showToast('Provider auth failed'); }
}));

// Email sign-in (magic link / access request)
const emailLoginButton = document.getElementById('emailLoginButton');
if (emailLoginButton) emailLoginButton.addEventListener('click', async () => {
  const email = $('#emailLogin').value.trim();
  if (!email || !$('#emailLogin').checkValidity()) return showToast('Please enter a valid email address.');
  try {
    const response = await safeFetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'email', email }) });
    if (!response.ok) { if (response.status === 202) showToast(response.detail?.message || 'Waiting for admin approval'); else if (response.status === 501) showToast('Email auth Not configured'); else showToast('Sign-in request failed'); return; }
    showToast(response.json?.message || 'Sign-in link prepared');
  } catch (e) { showToast('Request failed'); }
});

// Login form handling (overlay) - uses /api/login
const loginFormBtn = document.getElementById('loginFormSubmit');
if (loginFormBtn) loginFormBtn.addEventListener('click', async () => {
  const email = document.getElementById('li_email')?.value?.trim();
  const password = document.getElementById('li_password')?.value?.trim();
  if (!email || !password) return showToast('Please enter email and password');
  try {
    const res = await safeFetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    if (!res.ok) { if (res.status === 401) showToast('Invalid credentials'); else showToast('Login failed'); return; }
    showToast('Logged in'); closeLogin(); setTimeout(() => location.reload(), 400);
  } catch (e) { showToast('Login request failed'); }
}
);

// Logout button if present
const logoutBtn = document.getElementById('logoutBtn'); if (logoutBtn) logoutBtn.addEventListener('click', async () => {
  try {
    const res = await safeFetch('/api/logout', { method: 'GET' });
    if (res.ok) { showToast('Logged out'); setTimeout(() => location.reload(), 200); } else showToast('Logout failed');
  } catch (e) { showToast('Logout failed'); }
});
