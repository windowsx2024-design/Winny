const $ = (s) => document.querySelector(s);
const toast = $('#toast');
function showToast(message) { toast.textContent = message; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 3200); }
function completeStep(step) { const el = document.querySelector(`.start-step[data-step="${step}"]`); if (!el) return; el.classList.add('done'); el.querySelector('b').textContent = '✓'; }

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
  const scale = {"Mini Projector": [15,20,18,29,35,31,47,51,60,72,88,100], "Cooling Neck Fan": [12,19,16,22,31,39,46,54,63,72,81,94], "Cloud Slide": [23,18,28,33,29,38,44,51,58,66,73,82], "Glow Candle": [17,24,20,28,31,37,42,45,49,54,58,68]};
  $('#barChart').querySelectorAll('i').forEach((bar, index) => bar.style.height = `${scale[card.dataset.title][index]}%`);
}
document.querySelectorAll('.product-card').forEach(card => card.addEventListener('click', () => setProduct(card)));

let activeCard = null, startX, startY, originalX, originalY;
document.querySelectorAll('.draggable').forEach(card => {
  card.addEventListener('pointerdown', e => { activeCard = card; startX = e.clientX; startY = e.clientY; originalX = card.offsetLeft; originalY = card.offsetTop; card.setPointerCapture(e.pointerId); card.style.zIndex = 10; });
  card.addEventListener('pointermove', e => { if (!activeCard || activeCard !== card) return; card.style.left = `${originalX + e.clientX - startX}px`; card.style.top = `${originalY + e.clientY - startY}px`; card.style.transform = 'rotate(0deg)'; });
  card.addEventListener('pointerup', () => { if (activeCard === card) { activeCard = null; card.style.zIndex = ''; } });
});

function youtubeId(url) { const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/); return match?.[1]; }
function loadVideo() {
  const id = youtubeId($('#youtubeUrl').value.trim());
  if (!id) { $('#inputHelp').textContent = 'Please paste a valid YouTube video URL.'; $('#inputHelp').style.color = '#ff9ca0'; return; }
  if (location.protocol === 'file:') {
    $('#inputHelp').innerHTML = `To preview YouTube videos, open Liftly through the local server at <b>http://localhost:3000</b>. This lets YouTube verify the player. <a href="https://www.youtube.com/watch?v=${id}" target="_blank" rel="noopener">Open this video on YouTube ↗</a>`;
    $('#inputHelp').style.color = '#c4ff63';
    return;
  }
  $('#youtubeFrame').src = `https://www.youtube.com/embed/${id}?rel=0&origin=${encodeURIComponent(location.origin)}&widget_referrer=${encodeURIComponent(location.origin)}`;
  $('#youtubeFrame').style.display = 'block'; $('#videoPlaceholder').style.display = 'none';
  $('#inputHelp').textContent = 'Video loaded. Your product story is ready.'; $('#inputHelp').style.color = '#c4ff63';
  $('#listingStatus').textContent = 'VIDEO ATTACHED';
  completeStep('video');
}
$('#loadVideo').addEventListener('click', loadVideo);
$('#youtubeUrl').addEventListener('keydown', e => { if (e.key === 'Enter') loadVideo(); });
function scrollToStudio(){ $('#how').scrollIntoView({behavior:'smooth'}); }
$('#startButton').addEventListener('click', scrollToStudio); $('#closingStart').addEventListener('click', scrollToStudio); $('#watchButton').addEventListener('click', scrollToStudio);
$('#copyListing').addEventListener('click', async () => { const text = `${$('#listingTitle').textContent}\n${$('#listingCopy').textContent}\nPrice: ${$('#listingPrice').textContent}`; try { await navigator.clipboard.writeText(text); showToast('Product details copied to your clipboard.'); } catch { showToast('Product details are ready to copy.'); } });
$('#shopifyButton').addEventListener('click', async () => {
  const title = $('#listingTitle').textContent;
  const price = $('#listingPrice').textContent.replace('$', '');
  const video = $('#youtubeUrl').value.trim();
  const handle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const description = `${$('#listingCopy').textContent}${video ? ` Watch the product video: ${video}` : ''}`;
  const quote = value => `"${String(value).replace(/"/g, '""')}"`;
  const csv = [["Handle","Title","Body (HTML)","Vendor","Variant Price","Status"], [handle, title, `<p>${description}</p>`, "Liftly", price, "draft"]].map(row => row.map(quote).join(',')).join('\n');
  let download = new Blob([csv], {type:'text/csv'});
  try { const response = await fetch('/api/shopify/export', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({title, price, description:$('#listingCopy').textContent, video})}); if (response.ok) download = await response.blob(); } catch { /* static preview uses the local CSV fallback */ }
  const link = document.createElement('a');
  link.href = URL.createObjectURL(download);
  link.download = `${handle}-shopify.csv`; link.click(); URL.revokeObjectURL(link.href);
  showToast('Shopify-ready CSV downloaded — upload it in Products → Import.');
  completeStep('store');
});
$('#navConnect').addEventListener('click', () => showToast('Shopify connection opens here in the live product.'));
$('#payoutButton').addEventListener('click', () => showToast('Payout details will appear after your Shopify store is connected.'));
document.querySelectorAll('.import-button').forEach(button => button.addEventListener('click', async () => {
  const name = button.dataset.product;
  const productId = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  try { const response = await fetch('/api/queue', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({productId})}); if (!response.ok) throw new Error(); } catch { /* allow the static demo to remain usable */ }
  button.textContent = 'Added ✓'; button.disabled = true; showToast(`${name} was added to your store research queue.`);
}));
document.querySelectorAll('.start-step').forEach(step => step.addEventListener('click', () => {
  const destination = step.dataset.step === 'video' ? '#how' : step.dataset.step === 'store' ? '#how' : '#catalog';
  document.querySelector(destination).scrollIntoView({behavior:'smooth'});
}));
const loginOverlay = $('#loginOverlay');
function closeLogin() { loginOverlay.classList.remove('open'); loginOverlay.setAttribute('aria-hidden', 'true'); }
$('#openLogin').addEventListener('click', () => { loginOverlay.classList.add('open'); loginOverlay.setAttribute('aria-hidden', 'false'); });
$('#closeLogin').addEventListener('click', closeLogin);
loginOverlay.addEventListener('click', event => { if (event.target === loginOverlay) closeLogin(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeLogin(); });
document.querySelectorAll('.social-login').forEach(button => button.addEventListener('click', async () => {
  try { const response = await fetch('/api/auth/provider', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({provider:button.dataset.provider})}); const result = await response.json(); showToast(result.message); } catch { showToast(`${button.dataset.provider} sign-in needs to be connected in the live app.`); }
}));
$('#emailLoginButton').addEventListener('click', async () => {
  const email = $('#emailLogin').value.trim();
  if (!email || !$('#emailLogin').checkValidity()) return showToast('Please enter a valid email address.');
  try { const response = await fetch('/api/auth/email', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email})}); const result = await response.json(); showToast(result.message || result.error); } catch { showToast('Your email sign-in link is ready to send.'); }
});
