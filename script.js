// script.js
}catch(err){ toast('Could not load products; using local cache.'); renderProducts(MOCK_DATA.SAMPLE_PRODUCTS); }
}


function renderProducts(items){
$recs.innerHTML = '';
for(const p of items){
const node = renderProduct(p);
$recs.appendChild(node);
}
}


function renderRecsByIds(ids){
const items = MOCK_DATA.SAMPLE_PRODUCTS.filter(p=> ids.includes(p.id));
renderProducts(items);
}


function renderProduct(p){
const tpl = document.getElementById('tpl-product');
const node = tpl.content.firstElementChild.cloneNode(true);
node.querySelector('[data-image]').src = p.image_url;
node.querySelector('[data-name]').textContent = p.name;
node.querySelector('[data-price]').textContent = price(p.price_cents);
node.querySelector('[data-add]').addEventListener('click', ()=> addToCart(p));
return node;
}


function addToCart(p){
const existing = state.cart.find(i=> i.id===p.id);
if(existing) existing.qty++; else state.cart.push({ id:p.id, name:p.name, price_cents:p.price_cents, qty:1 });
persistCart(); renderCart(); toast(`${p.name} added to cart`);
}


function persistCart(){ localStorage.setItem('cart', JSON.stringify(state.cart)); }


function renderCart(){
if(!state.cart.length){ $cart.textContent = 'Your cart is empty.'; return; }
const total = state.cart.reduce((s,i)=> s + i.price_cents*i.qty, 0);
$cart.innerHTML = state.cart.map(i=> `${i.qty}× ${i.name} — ${price(i.price_cents)}`).join('<br>') + `<hr>Total: <strong>${price(total)}</strong>`;
}


$checkout.addEventListener('click', ()=>{
if(!state.cart.length) return toast('Cart is empty.');
toast('Checkout is mocked in demo. Implement /orders in your API.');
});


$settings.addEventListener('click', ()=> dlg.showModal());
$clear.addEventListener('click', ()=>{ state.cart=[]; persistCart(); renderCart(); $chatLog.innerHTML=''; toast('Cleared chat & cart.'); });


dlg.addEventListener('close', ()=>{/* noop */});


document.getElementById('cfg-save').addEventListener('click', ()=>{
const mode = document.getElementById('cfg-mode').value;
const baseUrl = document.getElementById('cfg-baseurl').value.trim();
const stream = document.getElementById('cfg-stream').checked;
const cfg = { mode, baseUrl, stream };
saveConfig(cfg);
toast('Settings saved.');
});


function toast(msg){
const t = document.createElement('div'); t.className='toast'; t.textContent = msg; document.body.appendChild(t);
setTimeout(()=> t.remove(), 2500);
}
