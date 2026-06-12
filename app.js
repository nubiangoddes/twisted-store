/* ============================================================
   TWISTED BY NG DIVINE — Front-end JS
   Catalog, cart (localStorage), sparkles, quiz, animations
   ============================================================ */

/* ---------- Catalog data ---------- */
const COLLECTIONS = {
  'wined-candy': {
    id:'wined-candy',
    name:'Wined Candy',
    number:'N°01',
    tagline:'Bold. Juicy. Unforgettable.',
    image:'assets/img/wined-candy.png',
    accent:'#E91E8C',
    accentSoft:'#FFD3E8',
    intro:'Candy-shop reds, electric yellows, and juicy pop. Wined Candy is the loudest hello in the room.',
    flavors:[
      {id:'classic-wined-candy', name:'Classic Wined Candy', swatches:['#D7142A','#F8C400'], desc:'Cherry red braided with bright candy-shop yellow. The flavor that started it all.'},
      {id:'blueberry-razz', name:'Blueberry Razz', swatches:['#1E63E0','#7B2FBE','#E91E8C'], desc:'Electric blue, deep purple and razz pink braided into a hoop that hums.'},
      {id:'melon-fizz', name:'Melon Fizz', swatches:['#9CD66E','#FFC1CF'], desc:'Melon green sliced with soft pink. Fresh, fizzy, fearless.'}
    ]
  },
  'salt-water-taffy': {
    id:'salt-water-taffy',
    name:'Salt Water Taffy',
    number:'N°02',
    tagline:'Sweet. Soft. Sophisticated.',
    image:'assets/img/salt-water-taffy.png',
    accent:'#C99363',
    accentSoft:'#FBEFE0',
    intro:'Warm caramel neutrals and pastel softness. A taffy-shop palette dressed up for the editorial.',
    flavors:[
      {id:'caramel-taffy', name:'Caramel Taffy', swatches:['#B07A45','#F2E0C6'], desc:'Warm caramel braided with cream. A soft, sophisticated everyday twist.'},
      {id:'vanilla-swirl', name:'Vanilla Swirl', swatches:['#F5EBDB','#E8D6BB'], desc:'Soft cream neutrals braided into a barely-there statement.'},
      {id:'peach-taffy', name:'Peach Taffy', swatches:['#FFB68A','#FFD3D3'], desc:'Peach and blush wound together — sun-warmed, never sticky.'},
      {id:'lemon-drop', name:'Lemon Drop', swatches:['#FCE38A','#FFF2CC'], desc:'Soft lemon yellow and cream. A taffy you can almost taste.'}
    ]
  },
  'twizzlers': {
    id:'twizzlers',
    name:'Twizzlers',
    number:'N°03',
    tagline:'Loud. Playful. Unapologetic.',
    image:'assets/img/twizzlers.png',
    accent:'#7B2FBE',
    accentSoft:'#E8D3FF',
    intro:'High-saturation candy braids for people who came to make noise. Color first. Apologies never.',
    flavors:[
      {id:'black-licorice', name:'Black Licorice', swatches:['#0A0606','#1A1414'], desc:'Rich matte black braided into the boldest hoop in your jewelry box.'},
      {id:'electric-grape', name:'Electric Grape', swatches:['#7B2FBE','#9D4EE0'], desc:'Pure electric purple. One color, all volume.'},
      {id:'bubblegum-twist', name:'Bubblegum Twist', swatches:['#FF4FA1','#FFB3D6'], desc:'Bright bubblegum pink braided to the loudest setting.'},
      {id:'blue-cotton-candy', name:'Blue Cotton Candy', swatches:['#7BC7FF','#BCE3FF'], desc:'Sky-blue cotton candy spun into a hoop you can feel from across the room.'}
    ]
  }
};

const SIZES = [
  {id:'signature', name:'Signature Twist', size:'2"', price:20, sub:'Everyday volume'},
  {id:'bold', name:'Bold Twist', size:'3"', price:25, sub:'Statement standard'},
  {id:'main', name:'Main Character Twist', size:'4"', price:30, sub:'Full editorial energy'}
];

const FEATURED = [
  {collection:'wined-candy', flavor:'classic-wined-candy'},
  {collection:'salt-water-taffy', flavor:'caramel-taffy'},
  {collection:'twizzlers', flavor:'electric-grape'}
];

/* ============================================================
   STRIPE CHECKOUT CONFIG
   - publishableKey is a pk_test_* — safe to embed client-side
   - checkoutEndpoint is YOUR backend that creates a Stripe
     Checkout Session using the secret key (sk_test_/sk_live_)
   - Endpoint contract:
       POST {checkoutEndpoint}
       Body  → JSON (see calculateOrder + checkout handler payload)
       Reply → { sessionId: "cs_..." }   (preferred — uses Stripe.js redirect)
                or { url: "https://checkout.stripe.com/..." }  (fallback redirect)
     The server must:
       1. Validate the cart server-side (never trust client prices)
       2. Re-apply the discount code from your loyalty program
       3. Create the Stripe Checkout Session with the validated line items,
          shipping_options ($6 flat), and discounts (when applicable)
       4. Return the session id (or url)
   ============================================================ */
const STRIPE_CONFIG = {
  publishableKey: 'pk_test_51SGwqoD1JRvDc6xXUU3dVe2buvHjRfV9XgUtO6St8saxIAKwNTuB7aHDtkErPK95UuEmvzVYGkhi3cNC4iLh0dap00rUDRZwEz',
  checkoutEndpoint: '/api/checkout-session',  // ← deploy your server function at this path
  successUrl: window.location.origin + '/cart.html?status=success',
  cancelUrl:  window.location.origin + '/cart.html?status=cancelled'
};
let _stripe = null;
function getStripe(){
  if(_stripe) return _stripe;
  if(typeof Stripe === 'undefined') return null;
  _stripe = Stripe(STRIPE_CONFIG.publishableKey);
  return _stripe;
}

const SHIPPING = 6;

/* ---------- Discount Codes ----------
   Configured for future loyalty program activation.
   Codes added to this map are accepted at checkout.
   No codes are promoted publicly — empty by default at launch.
   Examples (commented, inactive):
     'FIRSTTWIST10': { type:'pct',  value:10,  label:'10% off' }
     'CANDY25':      { type:'pct',  value:25,  label:'25% off' }
     'TWIST5':       { type:'flat', value:5,   label:'$5 off'  }
     'FREESHIP':     { type:'ship', value:0,   label:'Free shipping' }
*/
const DISCOUNT_CODES = {
  // Loyalty / promo codes will be activated here. Empty at launch.
};

function getStoredDiscount(){
  try { return JSON.parse(localStorage.getItem('tng_discount')||'null'); } catch(e){ return null; }
}
function storeDiscount(d){
  if(d){ localStorage.setItem('tng_discount', JSON.stringify(d)); }
  else { localStorage.removeItem('tng_discount'); }
}
function lookupDiscount(code){
  if(!code) return null;
  const k = code.trim().toUpperCase();
  const def = DISCOUNT_CODES[k];
  if(!def) return null;
  return Object.assign({ code:k }, def);
}
/* Returns {subtotal, discountAmount, shipping, total, discount} */
function calculateOrder(items, discount){
  const subtotal = items.reduce((a,b)=>a+b.price*b.qty,0);
  let discountAmount = 0;
  let shipping = SHIPPING;
  if(discount){
    if(discount.type === 'pct')   discountAmount = Math.round(subtotal * (discount.value/100) * 100) / 100;
    else if(discount.type === 'flat') discountAmount = Math.min(subtotal, discount.value);
    else if(discount.type === 'ship') shipping = 0;
  }
  const total = Math.max(0, subtotal - discountAmount) + shipping;
  return { subtotal, discountAmount, shipping, total, discount };
}

/* ---------- Helpers ---------- */
function $(s,r=document){return r.querySelector(s)}
function $$(s,r=document){return [...r.querySelectorAll(s)]}
function getFlavor(collId, flavorId){
  const c = COLLECTIONS[collId]; if(!c) return null;
  return {coll:c, flavor:c.flavors.find(f=>f.id===flavorId)};
}
function money(n){return '$'+n.toFixed(0)}

/* ---------- Cart (localStorage) ---------- */
const CART_KEY = 'twisted_cart_v1';
function getCart(){try{return JSON.parse(localStorage.getItem(CART_KEY))||[]}catch{return []}}
function saveCart(c){localStorage.setItem(CART_KEY,JSON.stringify(c));updateCartCount()}
function cartCount(){return getCart().reduce((a,b)=>a+b.qty,0)}
function updateCartCount(){$$('.cart-count').forEach(el=>el.textContent=cartCount())}

function addToCart(item){
  const cart = getCart();
  const key = `${item.collection}|${item.flavor}|${item.size}`;
  const existing = cart.find(c => `${c.collection}|${c.flavor}|${c.size}`===key);
  if(existing){existing.qty += item.qty;} else {cart.push(item);}
  saveCart(cart);
  showToast(`Added — ${item.flavorName}, ${item.sizeName}`);
  burstSparkles();
}
function removeFromCart(idx){const c=getCart();c.splice(idx,1);saveCart(c);}
function updateQty(idx,delta){const c=getCart();c[idx].qty=Math.max(1,c[idx].qty+delta);saveCart(c);}

/* ---------- Toast ---------- */
function showToast(msg){
  let t = $('.toast');
  if(!t){t=document.createElement('div');t.className='toast';document.body.appendChild(t);}
  t.innerHTML = `<span class="dot"></span>${msg}`;
  requestAnimationFrame(()=>t.classList.add('on'));
  clearTimeout(t._h);
  t._h = setTimeout(()=>t.classList.remove('on'),2400);
}

/* ---------- Sparkles ---------- */
const SPARK_COLORS = ['#E91E8C','#7B2FBE','#F57C00','#FFD3E8','#fff'];
function spawnSparkle(x,y,size=8){
  const s = document.createElement('div');
  s.className = 'sparkle';
  s.style.left = (x-size/2)+'px';
  s.style.top = (y-size/2)+'px';
  s.style.width = size+'px';
  s.style.height = size+'px';
  s.style.background = SPARK_COLORS[Math.floor(Math.random()*SPARK_COLORS.length)];
  s.style.setProperty('--dx',(Math.random()*80-40)+'px');
  s.style.setProperty('--dy',(Math.random()*80-40-20)+'px');
  s.style.boxShadow = '0 0 12px '+s.style.background;
  document.body.appendChild(s);
  setTimeout(()=>s.remove(),900);
}
function burstSparkles(e){
  const x = e? e.clientX : window.innerWidth/2;
  const y = e? e.clientY : window.innerHeight/2;
  for(let i=0;i<14;i++) spawnSparkle(x+(Math.random()*40-20),y+(Math.random()*40-20), 6+Math.random()*8);
}

/* Ambient candy-dust on mouse move (very subtle) */
let lastSpark=0;
document.addEventListener('mousemove',e=>{
  const now = performance.now();
  if(now-lastSpark<160) return;
  lastSpark = now;
  if(Math.random()<0.35) spawnSparkle(e.clientX,e.clientY, 4+Math.random()*4);
});

/* ---------- Reveal on scroll ---------- */
let _revealIO = null;
function observeReveals(root){
  if(!_revealIO) return;
  (root || document).querySelectorAll('[data-reveal]:not(.in)').forEach(el=>_revealIO.observe(el));
}
function initReveal(){
  _revealIO = new IntersectionObserver(es=>{
    es.forEach(en=>{if(en.isIntersecting){en.target.classList.add('in');_revealIO.unobserve(en.target);}});
  },{threshold:.08, rootMargin:'0px 0px -5% 0px'});
  observeReveals(document);
  // Safety net: if anything still hasn't been observed/triggered after 600ms,
  // force it visible so we never end up with invisible content.
  setTimeout(()=>{
    document.querySelectorAll('[data-reveal]:not(.in)').forEach(el=>el.classList.add('in'));
  }, 600);
  // Auto-observe future [data-reveal] injected by JS (collection page, shop, featured).
  const mo = new MutationObserver(muts=>{
    muts.forEach(m=>m.addedNodes.forEach(n=>{
      if(n.nodeType!==1) return;
      if(n.matches && n.matches('[data-reveal]')) _revealIO.observe(n);
      if(n.querySelectorAll) observeReveals(n);
    }));
  });
  mo.observe(document.body,{childList:true, subtree:true});
}

/* ---------- Menu ---------- */
function initMenu(){
  const t = $('.menu-toggle');
  const n = $('.nav');
  if(!t||!n) return;
  t.addEventListener('click',()=>{
    const open = n.classList.toggle('open');
    t.classList.toggle('open', open);
    const txt = t.querySelector('.mt-text');
    if(txt) txt.textContent = open ? 'Close' : 'Explore';
  });
}

/* ---------- Quiz ---------- */
const QUIZ = {
  questions:[
    {q:'Pick your candy aisle vibe:', opts:[
      {label:'Cherry-red, sugar-coated, loud', val:'wined-candy'},
      {label:'Soft pastels, taffy wrappers, neutrals', val:'salt-water-taffy'},
      {label:'Neon, electric, no rules', val:'twizzlers'}
    ]},
    {q:'Your perfect outfit ends in:', opts:[
      {label:'A statement hoop the size of the room', val:'twizzlers'},
      {label:'Something quiet, soft, sophisticated', val:'salt-water-taffy'},
      {label:'A jolt of color people stop you for', val:'wined-candy'}
    ]},
    {q:'When you walk in a room you want people to feel:', opts:[
      {label:'Energy. Heat. Hello.', val:'wined-candy'},
      {label:'Calm. Warm. Curious.', val:'salt-water-taffy'},
      {label:'Wait — who is THAT?', val:'twizzlers'}
    ]}
  ],
  results:{
    'wined-candy':{title:'You are Wined Candy.', copy:'Cherry red, electric yellow, juicy and unforgettable. Designed to be the loudest hello.'},
    'salt-water-taffy':{title:'You are Salt Water Taffy.', copy:'Warm caramels, vanilla swirls, taffy-shop pastels. Soft surface — full character.'},
    'twizzlers':{title:'You are Twizzlers.', copy:'Loud, playful, unapologetic. Pure color, full volume, zero apologies.'}
  }
};
function initQuiz(){
  const root = $('#quiz'); if(!root) return;
  let step = 0; const answers=[];
  function render(){
    const total = QUIZ.questions.length;
    if(step < total){
      const q = QUIZ.questions[step];
      root.innerHTML = `
        <div class="progress">${QUIZ.questions.map((_,i)=>`<span class="${i<=step?'on':''}"></span>`).join('')}</div>
        <div class="quiz-step active">
          <span class="eyebrow" style="color:var(--purple);display:block;margin-bottom:14px">Question ${step+1} / ${total}</span>
          <div class="q">${q.q}</div>
          <div class="opts">
            ${q.opts.map((o,i)=>`<button data-val="${o.val}">${o.label}<span>0${i+1}</span></button>`).join('')}
          </div>
        </div>`;
      $$('.opts button',root).forEach(b=>b.addEventListener('click',()=>{
        answers.push(b.dataset.val); step++; render();
      }));
    } else {
      const tally = {};
      answers.forEach(a=>tally[a]=(tally[a]||0)+1);
      const winner = Object.keys(tally).sort((a,b)=>tally[b]-tally[a])[0];
      const r = QUIZ.results[winner];
      const coll = COLLECTIONS[winner];
      const c1 = coll.accent;
      const c2 = coll.accentSoft;
      root.innerHTML = `
        <div class="progress">${QUIZ.questions.map(()=>'<span class="on"></span>').join('')}</div>
        <div class="quiz-step active quiz-result" style="--rc:${c1};--rc-soft:${c2}">
          <div class="result-card">
            <div class="result-hero" style="background:linear-gradient(135deg, ${c1} 0%, ${c2} 100%)">
              <span class="result-tag">${coll.number} · Your Match</span>
              <svg class="result-hoop" viewBox="0 0 200 200" aria-hidden="true">
                <g transform="translate(100 100)">
                  <circle r="62" fill="none" stroke="${c1}" stroke-width="22" stroke-dasharray="13 9" stroke-linecap="round" opacity=".95" transform="rotate(-8)"/>
                  <circle r="62" fill="none" stroke="#ffffff" stroke-width="20" stroke-dasharray="11 11" stroke-linecap="round" opacity=".55" stroke-dashoffset="11" transform="rotate(6)"/>
                </g>
              </svg>
            </div>
            <div class="result-body">
              <span class="eyebrow">${coll.number} — Your Signature Twist</span>
              <h3>${r.title}</h3>
              <p class="result-tagline">${coll.tagline}</p>
              <p class="result-copy">${r.copy}</p>
              <div class="result-swatches">
                ${coll.flavors.slice(0,4).map(f=>`<span class="rs" style="background:${f.swatches[0]}" title="${f.name}"></span>`).join('')}
                <span class="rs-label">${coll.flavors.length} flavors · From $20</span>
              </div>
              <div class="cta">
                <a class="btn btn-primary" href="collection.html?c=${winner}">Shop ${coll.name}</a>
                <button class="btn btn-outline" id="quiz-restart">Take it again</button>
              </div>
            </div>
          </div>
        </div>`;
      $('#quiz-restart').addEventListener('click',()=>{step=0;answers.length=0;render();});
    }
  }
  render();
}

/* ---------- Newsletter ---------- */
function initNewsletter(){
  $$('.news-form').forEach(f=>{
    f.addEventListener('submit',e=>{
      e.preventDefault();
      const i = f.querySelector('input'); if(!i.value) return;
      showToast('Welcome to the Candy Club ✦');
      i.value='';
      burstSparkles({clientX:f.getBoundingClientRect().left+f.offsetWidth/2,clientY:f.getBoundingClientRect().top+30});
    });
  });
}

/* ---------- Contact form ---------- */
function initContact(){
  const f = $('#contact-form'); if(!f) return;
  f.addEventListener('submit',e=>{
    e.preventDefault();
    showToast('Message sent — we’ll be in touch ✦');
    f.reset();
  });
}

/* ---------- PDP (product page) ---------- */
function initProduct(){
  const root = $('#pdp'); if(!root) return;
  const p = new URLSearchParams(location.search);
  const collId = p.get('c') || 'wined-candy';
  const flavorId = p.get('f') || (COLLECTIONS[collId]?.flavors[0].id);
  const data = getFlavor(collId, flavorId);
  if(!data || !data.flavor){root.innerHTML='<p style="padding:60px var(--gutter);font-family:var(--serif);font-size:18px">Flavor not found.</p>';return;}
  const {coll,flavor} = data;
  let currentSize = 'signature';
  let qty = 1;

  function render(){
    const sizeObj = SIZES.find(s=>s.id===currentSize);
    const sw = flavor.swatches;
    const c1 = sw[0], c2 = sw[1] || sw[0], c3 = sw[2] || c2;
    const hasThree = sw.length >= 3;
    const heroBg = hasThree
      ? `conic-gradient(from 210deg at 60% 40%, ${c1} 0deg, ${c2} 140deg, ${c3} 240deg, ${c1} 360deg)`
      : `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`;
    const dark = isDark(c1) || isDark(c2);
    const tagBg = dark ? 'rgba(255,255,255,.92)' : 'rgba(36,11,33,.85)';
    const tagFg = dark ? '#240B21' : '#fff';
    const labelColor = dark ? 'rgba(255,255,255,.95)' : 'rgba(36,11,33,.85)';
    const uid = `pdp-${coll.id}-${flavor.id}`;
    root.innerHTML = `
      <div class="pdp-img flavor-hero" style="background:${heroBg}">
        <span class="tag" style="background:${tagBg};color:${tagFg}">${coll.number} — ${coll.name}</span>
        <svg class="flavor-hoop" viewBox="0 0 200 200" aria-hidden="true">
          <defs>
            <radialGradient id="g-${uid}-shine" cx="35%" cy="30%" r="70%">
              <stop offset="0" stop-color="rgba(255,255,255,.7)"/>
              <stop offset="55%" stop-color="rgba(255,255,255,0)"/>
            </radialGradient>
          </defs>
          <g transform="translate(100 100)">
            <circle r="62" fill="none" stroke="${c1}" stroke-width="22" stroke-dasharray="13 9" stroke-linecap="round" opacity=".95" transform="rotate(-8)"/>
            <circle r="62" fill="none" stroke="${c2}" stroke-width="22" stroke-dasharray="13 9" stroke-linecap="round" opacity=".95" stroke-dashoffset="11" transform="rotate(6)"/>
            ${hasThree ? `<circle r="62" fill="none" stroke="${c3}" stroke-width="10" stroke-dasharray="5 16" stroke-linecap="round" opacity=".8" transform="rotate(-2)"/>` : ''}
            <circle r="62" fill="none" stroke="url(#g-${uid}-shine)" stroke-width="22"/>
          </g>
        </svg>
        <span class="flavor-name" style="color:${labelColor}">${flavor.name}</span>
        <span class="flavor-sparkle s1"></span>
        <span class="flavor-sparkle s2"></span>
        <img src="" alt="" hidden>
      </div>
      <div class="pdp-info">
        <div class="crumbs"><a href="shop.html">Shop</a> / <a href="collection.html?c=${coll.id}">${coll.name}</a> / <span>${flavor.name}</span></div>
        <h1>${flavor.name}</h1>
        <div class="coll">${coll.number} — ${coll.name} · ${coll.tagline}</div>
        <div class="price-big">Starting ${money(20)}</div>
        <p class="desc">${flavor.desc} Hand-braided over fabric-covered elastic in small batches. No molds. No mass production. No two pairs exactly alike.</p>

        <span class="label">Color Story</span>
        <div class="swatches" style="display:flex;gap:10px;margin-bottom:28px">
          ${flavor.swatches.map(c=>`<div class="sw" style="width:28px;height:28px;border:2px solid var(--ink);background:${c}"></div>`).join('')}
        </div>

        <span class="label">Size</span>
        <div class="sizes">
          ${SIZES.map(s=>`
            <button data-size="${s.id}" class="${currentSize===s.id?'on':''}">
              <span class="s">${s.size}</span>
              <span class="p">${s.name} — ${money(s.price)}</span>
            </button>
          `).join('')}
        </div>

        <span class="label">Quantity</span>
        <div class="qty">
          <button id="qm">−</button>
          <input id="qi" type="text" value="${qty}" readonly>
          <button id="qp">+</button>
        </div>

        <div class="add">
          <button class="btn btn-primary" id="add">Add To Cart — ${money(sizeObj.price * qty)}</button>
          <a class="btn btn-outline" href="cart.html">View Cart</a>
        </div>

        <div class="info">
          <span><b>Made</b> Hand-braided in small batches</span>
          <span><b>Unique</b> No two twists are exactly alike</span>
          <span><b>Ships</b> 5–7 business days · Flat $6 shipping</span>
        </div>
      </div>
    `;
    $$('.sizes button',root).forEach(b=>b.addEventListener('click',()=>{currentSize=b.dataset.size;render();}));
    $('#qm').addEventListener('click',()=>{qty=Math.max(1,qty-1);render();});
    $('#qp').addEventListener('click',()=>{qty++;render();});
    $('#add').addEventListener('click',e=>{
      const s = SIZES.find(x=>x.id===currentSize);
      addToCart({
        collection:coll.id, collectionName:coll.name,
        flavor:flavor.id, flavorName:flavor.name,
        size:s.id, sizeName:`${s.name} ${s.size}`,
        price:s.price, qty,
        image:coll.image
      });
      burstSparkles(e);
    });
  }
  render();
}

/* ---------- Collection page ---------- */
function initCollection(){
  const root = $('#collection-page'); if(!root) return;
  const p = new URLSearchParams(location.search);
  const collId = p.get('c') || 'wined-candy';
  const c = COLLECTIONS[collId];
  if(!c){root.innerHTML='Not found';return;}
  document.title = `${c.name} — Twisted by NG Divine`;
  root.innerHTML = `
    <section class="page-hero" style="background:${c.accentSoft}">
      <span class="eyebrow">${c.number} — Collection</span>
      <h1>${c.name}</h1>
      <p>${c.intro}</p>
    </section>
    <section style="padding:60px var(--gutter)">
      <div class="shop-grid" style="padding:0">
        ${c.flavors.map(f=>productCard(c,f)).join('')}
      </div>
    </section>
  `;
  bindCardActions();
}

/* ---------- Product card markup ---------- */
function productCard(coll, flavor){
  const sw = flavor.swatches;
  const c1 = sw[0], c2 = sw[1] || sw[0], c3 = sw[2] || c2;
  const hasThree = sw.length >= 3;
  const heroBg = hasThree
    ? `conic-gradient(from 210deg at 60% 40%, ${c1} 0deg, ${c2} 140deg, ${c3} 240deg, ${c1} 360deg)`
    : `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`;
  const dark = isDark(c1) || isDark(c2);
  const labelColor = dark ? 'rgba(255,255,255,.95)' : 'rgba(36,11,33,.85)';
  const tagBg = dark ? 'rgba(255,255,255,.92)' : 'rgba(36,11,33,.85)';
  const tagFg = dark ? '#240B21' : '#fff';
  const uid = `${coll.id}-${flavor.id}`;
  return `
    <article class="prod-card flavor-card" data-reveal style="--c1:${c1};--c2:${c2};--c3:${c3}">
      <a class="flavor-hero" href="product.html?c=${coll.id}&f=${flavor.id}" style="background:${heroBg}" aria-label="${flavor.name} hand-braided fabric hoop earring">
        <span class="tag" style="background:${tagBg};color:${tagFg}">${coll.number} · ${coll.name}</span>
        <svg class="flavor-hoop" viewBox="0 0 200 200" aria-hidden="true">
          <defs>
            <radialGradient id="g-${uid}-shine" cx="35%" cy="30%" r="70%">
              <stop offset="0" stop-color="rgba(255,255,255,.7)"/>
              <stop offset="55%" stop-color="rgba(255,255,255,0)"/>
            </radialGradient>
          </defs>
          <g transform="translate(100 100)">
            <circle r="62" fill="none" stroke="${c1}" stroke-width="22" stroke-dasharray="13 9" stroke-linecap="round" opacity=".95" transform="rotate(-8)"/>
            <circle r="62" fill="none" stroke="${c2}" stroke-width="22" stroke-dasharray="13 9" stroke-linecap="round" opacity=".95" stroke-dashoffset="11" transform="rotate(6)"/>
            ${hasThree ? `<circle r="62" fill="none" stroke="${c3}" stroke-width="10" stroke-dasharray="5 16" stroke-linecap="round" opacity=".8" transform="rotate(-2)"/>` : ''}
            <circle r="62" fill="none" stroke="url(#g-${uid}-shine)" stroke-width="22"/>
          </g>
        </svg>
        <span class="flavor-name" style="color:${labelColor}">${flavor.name}</span>
        <span class="flavor-sparkle s1"></span>
        <span class="flavor-sparkle s2"></span>
      </a>
      <div class="pc-body">
        <div class="pc-coll">${coll.number} — ${coll.name}</div>
        <h3 class="pc-name"><a href="product.html?c=${coll.id}&f=${flavor.id}">${flavor.name}</a></h3>
        <div class="pc-row">
          <div class="swatches">
            ${flavor.swatches.map(c=>`<div class="sw" style="background:${c};border:2px solid var(--ink)"></div>`).join('')}
          </div>
          <div class="pc-price">From $20</div>
        </div>
        <div class="actions">
          <a class="btn btn-outline" href="product.html?c=${coll.id}&f=${flavor.id}">View Product</a>
          <button class="btn btn-primary" data-add data-c="${coll.id}" data-f="${flavor.id}">Add To Cart</button>
        </div>
      </div>
    </article>
  `;
}
function isDark(hex){
  const h = hex.replace('#','');
  const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
  return (r*299 + g*587 + b*114)/1000 < 130;
}
function bindCardActions(){
  $$('[data-add]').forEach(b=>b.addEventListener('click',e=>{
    const c = COLLECTIONS[b.dataset.c];
    const f = c.flavors.find(x=>x.id===b.dataset.f);
    const s = SIZES[0]; // default to signature
    addToCart({
      collection:c.id, collectionName:c.name,
      flavor:f.id, flavorName:f.name,
      size:s.id, sizeName:`${s.name} ${s.size}`,
      price:s.price, qty:1,
      image:c.image
    });
    burstSparkles(e);
  }));
}

/* ---------- Shop (all flavors) ---------- */
function initShop(){
  const root = $('#shop-grid'); if(!root) return;
  function render(filter){
    const all=[];
    Object.values(COLLECTIONS).forEach(c=>{
      if(filter && filter!==c.id) return;
      c.flavors.forEach(f=>all.push({c,f}));
    });
    root.innerHTML = all.map(({c,f})=>productCard(c,f)).join('');
    bindCardActions();
  }
  render(null);
  $$('.filters button').forEach(b=>b.addEventListener('click',()=>{
    $$('.filters button').forEach(x=>x.classList.remove('on'));
    b.classList.add('on');
    render(b.dataset.filter || null);
  }));
}

/* ---------- Featured (homepage) ---------- */
function initFeatured(){
  const root = $('#featured-grid'); if(!root) return;
  root.innerHTML = FEATURED.map(({collection,flavor})=>{
    const c = COLLECTIONS[collection];
    const f = c.flavors.find(x=>x.id===flavor);
    return productCard(c,f);
  }).join('');
  bindCardActions();
}

/* ---------- Cart page ---------- */
function initCartPage(){
  const root = $('#cart-page'); if(!root) return;
  let discount = getStoredDiscount();
  let discountMsg = '';
  function render(){
    const items = getCart();
    if(!items.length){
      root.innerHTML = `
        <div class="cart-empty">
          <span class="eyebrow" style="color:var(--purple)">Your Cart</span>
          <h2 style="margin-top:14px">Nothing twisted yet.</h2>
          <p>Pick a flavor. Pick a size. Add some color.</p>
          <a class="btn btn-primary" href="shop.html">Find Your Twist</a>
        </div>`;
      return;
    }
    const o = calculateOrder(items, discount);
    const discountRow = (discount && o.discountAmount > 0)
      ? `<div class="row discount-row"><span>Discount <small class="dc-tag">${discount.code}</small></span><span>−${money(o.discountAmount)}</span></div>`
      : (discount && discount.type === 'ship')
        ? `<div class="row discount-row"><span>Shipping discount <small class="dc-tag">${discount.code}</small></span><span>−${money(SHIPPING)}</span></div>`
        : '';
    const msgHTML = discountMsg
      ? `<div class="dc-msg ${discountMsg.ok?'ok':'err'}">${discountMsg.text}</div>`
      : '';
    root.innerHTML = `
      <span class="eyebrow" style="color:var(--purple)">Cart · ${items.reduce((a,b)=>a+b.qty,0)} items</span>
      <h1>Your Twists</h1>
      <div class="sub">Hand-braided. Small batches. No two exactly alike.</div>
      <div class="cart-grid">
        <div class="cart-items">
          ${items.map((it,i)=>`
            <div class="cart-item">
              <div class="ci-img"><img src="${it.image}" alt="${it.flavorName}"></div>
              <div>
                <h3>${it.flavorName}</h3>
                <div class="ci-meta"><span>${it.collectionName}</span> · <span>${it.sizeName}</span></div>
                <div class="ci-qty"><button data-i="${i}" data-d="-1" aria-label="Decrease quantity">−</button><span>${it.qty}</span><button data-i="${i}" data-d="1" aria-label="Increase quantity">+</button></div>
              </div>
              <div class="ci-right">
                <div class="ci-price">${money(it.price*it.qty)}</div>
                <button class="ci-remove" data-rm="${i}">Remove</button>
              </div>
            </div>`).join('')}
        </div>
        <aside class="cart-summary">
          <h3>Order Summary</h3>
          <div class="row"><span>Subtotal</span><span>${money(o.subtotal)}</span></div>
          ${discountRow}
          <div class="row"><span>Shipping</span><span>${o.shipping === 0 ? 'Free' : money(o.shipping)}</span></div>
          <div class="row"><span>Delivery</span><span>5–7 days</span></div>
          <div class="row tot"><span>Total</span><span>${money(o.total)}</span></div>

          <form class="discount-form" autocomplete="off" novalidate>
            <label for="discount-code">Discount code</label>
            <div class="dc-input-row">
              <input id="discount-code" name="discount" type="text" placeholder="Enter code" value="${discount?discount.code:''}" autocapitalize="characters" spellcheck="false">
              ${discount ? '<button type="button" class="dc-btn" id="dc-remove">Remove</button>' : '<button type="submit" class="dc-btn">Apply</button>'}
            </div>
            ${msgHTML}
          </form>

          <button class="btn btn-pink" id="checkout">Pay With Stripe</button>
          <p class="note">Hand-braided in small batches. Ships in 5–7 business days. Every order includes a Confidence Card.</p>
        </aside>
      </div>
    `;
    $$('[data-rm]',root).forEach(b=>b.addEventListener('click',()=>{removeFromCart(+b.dataset.rm);render();}));
    $$('[data-d]',root).forEach(b=>b.addEventListener('click',()=>{updateQty(+b.dataset.i,+b.dataset.d);render();}));

    const form = $('.discount-form', root);
    if(form){
      form.addEventListener('submit', e=>{
        e.preventDefault();
        const val = $('#discount-code').value;
        const found = lookupDiscount(val);
        if(found){
          discount = found; storeDiscount(found);
          discountMsg = { ok:true, text:`Code applied${found.label?' — '+found.label:''}.` };
        } else if(val.trim()){
          discount = null; storeDiscount(null);
          discountMsg = { ok:false, text:'Code not recognised.' };
        } else {
          discountMsg = '';
        }
        render();
      });
    }
    const rm = $('#dc-remove', root);
    if(rm){
      rm.addEventListener('click', ()=>{ discount = null; storeDiscount(null); discountMsg = { ok:true, text:'Discount removed.' }; render(); });
    }

    $('#checkout').addEventListener('click', async e=>{
      burstSparkles(e);
      const btn = e.currentTarget;
      const original = btn.textContent;
      btn.disabled = true; btn.textContent = 'Connecting to Stripe…';

      // Stripe-ready payload — server validates + creates Session
      const payload = {
        line_items: items.map(it => ({
          name: `${it.flavorName} — ${it.sizeName}`,
          collection: it.collectionName,
          unit_amount: Math.round(it.price * 100), // cents
          quantity: it.qty,
          flavor_id: it.flavorId,
          collection_id: it.collectionId,
          size_id: it.sizeId
        })),
        shipping: { name:'Flat rate · 5–7 business days', amount: Math.round(o.shipping * 100) },
        discount_code: discount ? discount.code : null,
        subtotal: Math.round(o.subtotal * 100),
        total:    Math.round(o.total * 100),
        currency: 'usd',
        success_url: STRIPE_CONFIG.successUrl,
        cancel_url:  STRIPE_CONFIG.cancelUrl
      };
      try { sessionStorage.setItem('tng_pending_order', JSON.stringify(payload)); } catch(_){}

      try {
        const res = await fetch(STRIPE_CONFIG.checkoutEndpoint, {
          method:'POST',
          headers:{ 'Content-Type':'application/json' },
          body: JSON.stringify(payload)
        });
        if(!res.ok) throw new Error('Checkout endpoint returned ' + res.status);
        const data = await res.json();

        // Preferred: { sessionId } → use Stripe.js redirect
        if(data.sessionId){
          const stripe = getStripe();
          if(!stripe) throw new Error('Stripe.js not loaded');
          const { error } = await stripe.redirectToCheckout({ sessionId: data.sessionId });
          if(error) throw error;
          return;
        }
        // Fallback: { url } → simple redirect
        if(data.url){
          window.location.assign(data.url);
          return;
        }
        throw new Error('Checkout endpoint did not return a sessionId or url');
      } catch (err) {
        console.warn('Stripe checkout error:', err);
        btn.disabled = false; btn.textContent = original;
        showToast('Checkout endpoint not reachable yet');
        setTimeout(()=>{
          alert(
            'Stripe Checkout could not start.\n\n' +
            'Order is ready to send to your backend:\n' +
            `• Items: ${payload.line_items.length}\n` +
            `• Subtotal: ${money(o.subtotal)}\n` +
            (discount ? `• Discount (${discount.code}): −${money(o.discountAmount)}\n` : '') +
            `• Shipping: ${o.shipping===0?'Free':money(o.shipping)}\n` +
            `• Total: ${money(o.total)}\n\n` +
            `Reason: ${err.message}\n\n` +
            `Deploy your Checkout Session function to:\n  ${STRIPE_CONFIG.checkoutEndpoint}`
          );
        },300);
      }
    });
  }
  render();
}

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded',()=>{
  updateCartCount();
  initMenu();
  initReveal();
  initFeatured();
  initShop();
  initCollection();
  initProduct();
  initCartPage();
  initQuiz();
  initNewsletter();
  initContact();
});
