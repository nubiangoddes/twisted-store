# Twisted by NG Divine

Hand-braided statement hoop earrings — three signature collections, candy-inspired palette, editorial direct-to-consumer experience.

## What's in this repo

A fully static front-end (HTML / CSS / vanilla JS) plus a single serverless endpoint hook for Stripe Checkout. Deployable as-is to Vercel, Netlify, Cloudflare Pages, or any static host.

```
.
├── index.html                  Homepage (Hero → Quiz → Collections)
├── shop.html                   All flavors across collections
├── collections.html            Collection index
├── collection.html             Single collection (uses ?c=<slug>)
├── product.html                PDP (uses ?c=<slug>&f=<flavor>)
├── cart.html                   Cart + discount code + Stripe checkout
├── confidence-cards.html       Brand storytelling
├── about.html                  Founder story
├── shipping.html               Shipping & returns
├── faq.html                    FAQ
├── contact.html                Contact form
├── assets/
│   ├── css/style.css
│   ├── js/app.js               Catalog, cart, quiz, Stripe wiring
│   └── img/                    Hero / collection / founder imagery
├── vercel.json                 Routing + headers
├── .gitignore
└── README.md
```

## Local preview

No build step. Serve the folder with any static server:

```bash
python3 -m http.server 3000
# or
npx serve .
```

Open http://localhost:3000.

## Deploy to Vercel

1. Push this folder to a GitHub repo.
2. Import the repo into Vercel (Framework Preset: **Other** / static).
3. No build command needed. Output directory: `./`.
4. Add the env var `STRIPE_SECRET_KEY` (see Stripe section).
5. Add an `/api/checkout-session` serverless function (see Stripe section).
6. Deploy.

## Deploy to Netlify / Cloudflare Pages

- Publish directory: `./`
- Build command: (none)
- Add the Stripe Checkout function under `netlify/functions/checkout-session.js` (Netlify) or a Cloudflare Pages Function at `functions/api/checkout-session.js`.

## Stripe Checkout — required backend

`assets/js/app.js` already contains the publishable key and posts the cart payload to `/api/checkout-session`. You must deploy that endpoint. It is the only piece of server code required.

### Endpoint contract

`POST /api/checkout-session`

Request body (JSON):
```json
{
  "line_items": [
    { "name": "Classic Wined Candy — Signature Twist",
      "collection": "Wined Candy",
      "unit_amount": 2000,
      "quantity": 1,
      "flavor_id": "classic-wined-candy",
      "collection_id": "wined-candy",
      "size_id": "signature" }
  ],
  "shipping":      { "name": "Flat rate · 5–7 business days", "amount": 600 },
  "discount_code": "OPTIONAL_CODE_OR_NULL",
  "subtotal":      2000,
  "total":         2600,
  "currency":      "usd",
  "success_url":   "https://yourdomain.com/cart.html?status=success",
  "cancel_url":    "https://yourdomain.com/cart.html?status=cancelled"
}
```

Server responsibilities (do not trust client prices):
1. Validate each line item against your catalog.
2. Re-apply the discount code from your loyalty program.
3. Create a Stripe Checkout Session with the validated line items, the flat $6 shipping option, and any applicable discount.
4. Return `{ "sessionId": "cs_..." }` (preferred — the client uses `stripe.redirectToCheckout`), or `{ "url": "https://checkout.stripe.com/..." }` as a fallback.

### Minimal Vercel example (Node)

Create `api/checkout-session.js`:

```js
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { line_items, shipping, success_url, cancel_url } = req.body;

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: line_items.map(li => ({
      price_data: {
        currency: 'usd',
        product_data: { name: li.name, description: li.collection },
        unit_amount: li.unit_amount
      },
      quantity: li.quantity
    })),
    shipping_options: [{
      shipping_rate_data: {
        type: 'fixed_amount',
        fixed_amount: { amount: shipping.amount, currency: 'usd' },
        display_name: shipping.name
      }
    }],
    success_url,
    cancel_url
  });

  res.status(200).json({ sessionId: session.id });
}
```

Add `stripe` to `package.json` and set `STRIPE_SECRET_KEY` in Vercel project env vars.

## Discount codes

`DISCOUNT_CODES` in `assets/js/app.js` is intentionally empty at launch — no codes are publicly promoted. Codes can be activated for the loyalty program by adding entries like:

```js
const DISCOUNT_CODES = {
  FIRSTTWIST10: { type:'pct',  value:10, label:'10% off' },
  TWIST5:       { type:'flat', value:5,  label:'$5 off' },
  FREESHIP:     { type:'ship', value:0,  label:'Free shipping' }
};
```

For production, validate codes server-side as well — never trust the client.

## Shipping

Flat $6 across all orders, 5–7 business days. Configured in `assets/js/app.js` (`const SHIPPING = 6`) and surfaced as a Stripe `shipping_option` at checkout.

## Brand contacts

- twistedbyngdivine@gmail.com
- Instagram @nubiancolourgoddess
- TikTok @natashadyson6

© 2026 Twisted by NG Divine — Hand-braided · Small batches · One-of-one
