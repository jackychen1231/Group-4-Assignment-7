// ai-integration.js
return res.json();
}


async #chatStream({ sessionId, message }){
const res = await fetch(`${this.baseUrl}/chat`,{
method:'POST', headers:{'Content-Type':'application/json','Accept':'text/event-stream'},
body: JSON.stringify({ sessionId, message })
});
if(!res.ok) throw await toApiError(res);
const reader = res.body.getReader();
const decoder = new TextDecoder();
let acc = ''; let done=false;
while(!done){
const chunk = await reader.read(); done = chunk.done; if(done) break;
const text = decoder.decode(chunk.value, { stream: true });
acc += text; // naive concat of streamed text
self.dispatchEvent(new CustomEvent('ai:chunk',{ detail: { text } }));
}
return { reply: acc, sessionId };
}


async products(query){
if(this.mode==='mock') return mockProducts(query);
const url = new URL(`${this.baseUrl}/products`);
if(query?.q) url.searchParams.set('q', query.q);
const res = await fetch(url);
if(!res.ok) throw await toApiError(res);
return res.json();
}


async event(type, payload){
try{
if(this.mode==='mock') return;
await fetch(`${this.baseUrl}/events`,{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ type, payload })});
}catch{ /* non-fatal */ }
}
}


async function toApiError(res){
let msg = `${res.status} ${res.statusText}`;
try{ const j = await res.json(); if(j?.error?.message) msg = j.error.message; }catch{}
return new Error(msg);
}


// ------- Mock implementations (static demo) -------
const SAMPLE_PRODUCTS = [
{ id:'p1', sku:'HOOD-001', name:'Cozy Fleece Hoodie', price_cents:4999, image_url:'https://picsum.photos/seed/hoodie/200', category:'Hoodies'},
{ id:'p2', sku:'SNEAK-002', name:'Everyday Sneakers', price_cents:6999, image_url:'https://picsum.photos/seed/sneaker/200', category:'Shoes'},
{ id:'p3', sku:'BOTT-003', name:'Insulated Bottle 1L', price_cents:2499, image_url:'https://picsum.photos/seed/bottle/200', category:'Accessories'},
{ id:'p4', sku:'TEES-004', name:'Premium Cotton Tee', price_cents:1999, image_url:'https://picsum.photos/seed/tee/200', category:'Tops'}
];


function formatPrice(cents){ return `$${(cents/100).toFixed(2)}`; }


async function mockProducts(query){
const q = (query?.q||'').toLowerCase();
const items = !q ? SAMPLE_PRODUCTS : SAMPLE_PRODUCTS.filter(p=> (p.name+p.category).toLowerCase().includes(q));
return { items };
}


async function mockChat({ message, sessionId }){
const lower = message.trim().toLowerCase();
// Tiny rule-based engine
if(/(hood|warm)/.test(lower)){
return { sessionId, reply: `Our **Cozy Fleece Hoodie** is a customer favorite for cold days. It’s warm, soft, and pairs well with the Premium Cotton Tee. Want me to add size M to your cart?`, recommendations: ['p1','p4'] };
}
if(/(bottle|water)/.test(lower)){
return { sessionId, reply: `Staying hydrated? The **Insulated Bottle 1L** keeps drinks cold ~24h. BPA‑free, leakproof cap.`, recommendations: ['p3'] };
}
if(/(shoe|sneak|run|walk)/.test(lower)){
return { sessionId, reply: `For everyday comfort, try **Everyday Sneakers**. Lightweight and supportive. Need help with sizing?`, recommendations: ['p2'] };
}
if(/(recommend|gift)/.test(lower)){
return { sessionId, reply: `Here are a few picks based on what people bundle together: Hoodie + Bottle for cozy outdoor days; Sneakers + Tee for casual fits.`, recommendations: ['p1','p3','p2','p4'] };
}
return { sessionId, reply: `I can help with sizing, comparisons, and deals. Try: "compare hoodie vs tee" or "recommend a gift under $50".`, recommendations: ['p3','p4'] };
}


export function price(cents){ return formatPrice(cents); }
export const MOCK_DATA = { SAMPLE_PRODUCTS };
