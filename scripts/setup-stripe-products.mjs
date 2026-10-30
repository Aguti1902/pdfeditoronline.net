import Stripe from "stripe";
import fs from "node:fs";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("STRIPE_SECRET_KEY missing");
  process.exit(1);
}
const stripe = new Stripe(key);
const WEBHOOK_URL = "https://www.pdfeditoronline.net/api/stripe/webhook";
const EVENTS = [
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "invoice.paid",
  "invoice.payment_failed",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "charge.refunded",
];

const products = await stripe.products.list({ limit: 100, active: true });
let product = products.data.find((p) => p.name === "PDF Editor Online");
if (!product) {
  product = await stripe.products.create({
    name: "PDF Editor Online",
    description: "Edición, firma y conversión de PDF en el navegador.",
    statement_descriptor: "PDF EDITOR ONLINE",
  });
  console.log("created product", product.id);
} else {
  console.log("reused product", product.id);
}

const prices = await stripe.prices.list({ product: product.id, active: true, limit: 100 });
let intro = prices.data.find((p) => p.unit_amount === 50 && !p.recurring);
let monthly = prices.data.find((p) => p.unit_amount === 1995 && p.recurring?.interval === "month");
if (!intro) {
  intro = await stripe.prices.create({
    product: product.id,
    unit_amount: 50,
    currency: "eur",
    nickname: "Alta 0,50 EUR",
  });
  console.log("created intro", intro.id);
} else {
  console.log("reused intro", intro.id);
}
if (!monthly) {
  monthly = await stripe.prices.create({
    product: product.id,
    unit_amount: 1995,
    currency: "eur",
    recurring: { interval: "month" },
    nickname: "Mensual 19,95 EUR",
  });
  console.log("created monthly", monthly.id);
} else {
  console.log("reused monthly", monthly.id);
}

const trialEnd = Math.floor(Date.now() / 1000) + 24 * 3600;
try {
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: "billing-setup@pdfeditoronline.net",
    line_items: [
      { price: intro.id, quantity: 1 },
      { price: monthly.id, quantity: 1 },
    ],
    subscription_data: { trial_end: trialEnd, metadata: { userId: "0" } },
    success_url: "https://www.pdfeditoronline.net/payment/success?txn={CHECKOUT_SESSION_ID}",
    cancel_url: "https://www.pdfeditoronline.net/",
  });
  console.log("trial_24h_ok", session.id);
  await stripe.checkout.sessions.expire(session.id);
  console.log("probe session expired");
} catch (err) {
  console.log("trial_24h_failed", err instanceof Error ? err.message : String(err));
}

const hooks = await stripe.webhookEndpoints.list({ limit: 100 });
let hook = hooks.data.find((h) => h.url === WEBHOOK_URL);
if (!hook) {
  hook = await stripe.webhookEndpoints.create({
    url: WEBHOOK_URL,
    enabled_events: EVENTS,
    description: "PDF Editor Online — altas, renovaciones y reembolsos",
  });
  console.log("created webhook", hook.id);
  const envPath = new URL("../.env", import.meta.url);
  const current = fs.readFileSync(envPath, "utf8");
  const next = current
    .replace(/^STRIPE_PRICE_ID=.*\n?/m, "")
    .replace(/^STRIPE_INTRO_PRICE_ID=.*\n?/m, "")
    .replace(/^STRIPE_WEBHOOK_SECRET=.*\n?/m, "");
  fs.writeFileSync(
    envPath,
    `${next.trim()}\nSTRIPE_PRICE_ID=${monthly.id}\nSTRIPE_INTRO_PRICE_ID=${intro.id}\nSTRIPE_WEBHOOK_SECRET=${hook.secret}\n`,
  );
  console.log("webhook secret written to .env");
} else {
  console.log("webhook already exists", hook.id, "(secret is not readable again)");
  const envPath = new URL("../.env", import.meta.url);
  let current = fs.readFileSync(envPath, "utf8");
  if (!current.includes("STRIPE_PRICE_ID=")) {
    current += `STRIPE_PRICE_ID=${monthly.id}\nSTRIPE_INTRO_PRICE_ID=${intro.id}\n`;
    fs.writeFileSync(envPath, current);
  }
}

console.log(JSON.stringify({ product: product.id, intro: intro.id, monthly: monthly.id, webhook: hook.id }));
