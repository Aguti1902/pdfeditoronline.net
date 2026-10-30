/**
 * Stripe Checkout for the signup charge.
 *
 * The customer pays the intro price (0,50 €) immediately. The monthly price
 * is a subscription with a trial, so Stripe bills it when the trial ends and
 * every month after that. We do not MIT-charge these rows: `sipayToken` stays
 * empty and the Sipay renewal cron skips them. The Stripe subscription id
 * (`sub_…`) is stored on `subscriptions.sipayTransactionId`.
 */
import Stripe from "stripe";
import { ENV } from "./env";

let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (!ENV.stripeSecretKey) throw new Error("STRIPE_SECRET_KEY missing");
  if (!client) client = new Stripe(ENV.stripeSecretKey);
  return client;
}

const STRIPE_LOCALES = new Set([
  "es", "en", "fr", "de", "pt", "it", "nl", "pl", "ru", "zh",
]);

function stripeLocale(lang?: string): Stripe.Checkout.SessionCreateParams.Locale {
  const code = (lang || "").slice(0, 2).toLowerCase();
  if (STRIPE_LOCALES.has(code)) return code as Stripe.Checkout.SessionCreateParams.Locale;
  return "auto";
}

export async function createStripeCheckout(opts: {
  userId: number;
  email: string;
  origin: string;
  lang?: string;
  trialHours: number;
  introPriceId: string;
  monthlyPriceId: string;
  recurringCents: number;
  gclid?: string;
  gclidType?: string;
}): Promise<{ url: string; id: string }> {
  const stripe = getStripe();
  const trialEnd = Math.floor(Date.now() / 1000) + Math.max(1, opts.trialHours) * 3600;
  const metadata: Record<string, string> = {
    userId: String(opts.userId),
    lang: (opts.lang || "").slice(0, 8),
    gclid: (opts.gclid || "").slice(0, 500),
    gclidType: (opts.gclidType || "").slice(0, 16),
    recurringCents: String(opts.recurringCents),
    trialHours: String(opts.trialHours),
  };
  // Checkout in subscription mode refuses a trial shorter than 2 days.
  // Charge the intro price here (card / Apple Pay / Google Pay) and save the
  // card. The webhook then opens the monthly subscription with a 24 h trial.
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_creation: "always",
    customer_email: opts.email || undefined,
    client_reference_id: String(opts.userId),
    locale: stripeLocale(opts.lang),
    line_items: [{ price: opts.introPriceId, quantity: 1 }],
    metadata: { ...metadata, monthlyPriceId: opts.monthlyPriceId, trialEnd: String(trialEnd) },
    payment_intent_data: {
      setup_future_usage: "off_session",
      metadata,
    },
    success_url: `${opts.origin}/payment/success?txn={CHECKOUT_SESSION_ID}&provider=stripe`,
    cancel_url: `${opts.origin}/?pago=cancelado`,
  });
  if (!session.url) throw new Error("stripe_no_url");
  return { url: session.url, id: session.id };
}

export async function endStripeTrialNow(subscriptionId: string) {
  await getStripe().subscriptions.update(subscriptionId, {
    trial_end: "now",
    proration_behavior: "none",
  });
}

export async function cancelStripeAtPeriodEnd(subscriptionId: string) {
  await getStripe().subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

function asId(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "id" in value && typeof (value as { id?: unknown }).id === "string") {
    return (value as { id: string }).id;
  }
  return "";
}

function invoiceSubscriptionId(invoice: Stripe.Invoice): string {
  const raw = invoice as Stripe.Invoice & {
    subscription?: unknown;
    parent?: { subscription_details?: { subscription?: unknown } };
  };
  return asId(raw.subscription) || asId(raw.parent?.subscription_details?.subscription);
}

export async function handleStripeWebhook(rawBody: Buffer | string, signature: string) {
  if (!ENV.stripeWebhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET missing");
  const stripe = getStripe();
  const event = stripe.webhooks.constructEvent(rawBody, signature, ENV.stripeWebhookSecret);

  const {
    hasWebhookEventId,
    recordWebhookEvent,
    getSubscriptionByStripeId,
    upsertSubscription,
    markDocumentsPaid,
    recordCharge,
    recordConsent,
    getUserById,
    setUserLanguage,
    getTrialHours,
    getActiveMonthlyPrice,
  } = await import("../db");

  if (await hasWebhookEventId(event.id)) return;

  const started = Date.now();
  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        await onCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "invoice.paid":
        await onInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case "invoice.payment_failed":
        await onInvoiceFailed(event.data.object as Stripe.Invoice);
        break;
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await onSubscriptionChanged(event.data.object as Stripe.Subscription, event.type.endsWith("deleted"));
        break;
      case "charge.refunded":
        await onChargeRefunded(event.data.object as Stripe.Charge);
        break;
      default:
        break;
    }
    await recordWebhookEvent({
      provider: "stripe",
      eventId: event.id,
      eventType: event.type,
      status: "ok",
      durationMs: Date.now() - started,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await recordWebhookEvent({
      provider: "stripe",
      eventId: event.id,
      eventType: event.type,
      status: "error",
      errorMessage: message.slice(0, 500),
      durationMs: Date.now() - started,
    });
    throw err;
  }

  async function onCheckoutCompleted(session: Stripe.Checkout.Session) {
    if (session.mode !== "payment") return;
    if (session.payment_status !== "paid") return;
    const userId = Number(session.metadata?.userId || session.client_reference_id || 0);
    const customerId = asId(session.customer);
    const paymentIntentId = asId(session.payment_intent);
    if (!userId || !customerId || !paymentIntentId) throw new Error("checkout_missing_user_or_payment");
    if (await hasWebhookEventId(`stripe_intro_${session.id}`)) return;

    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const paymentMethodId = asId(intent.payment_method);
    if (!paymentMethodId) throw new Error("checkout_missing_payment_method");
    const trialHours = Number(session.metadata?.trialHours) || await getTrialHours();
    const monthlyPriceId = session.metadata?.monthlyPriceId || ENV.stripePriceId;
    const trialEnd = Math.floor(Date.now() / 1000) + trialHours * 3600;
    let stripeSub: Stripe.Subscription;
    try {
      stripeSub = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: monthlyPriceId }],
        default_payment_method: paymentMethodId,
        trial_end: trialEnd,
        metadata: { userId: String(userId) },
        proration_behavior: "none",
      }, { idempotencyKey: `alta-sub-${session.id}` });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (!/trial/i.test(message)) throw err;
      // Checkout's 2-day floor sometimes applies here too. Take the shortest
      // trial Stripe will accept rather than dropping the renewal.
      stripeSub = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: monthlyPriceId }],
        default_payment_method: paymentMethodId,
        trial_period_days: 2,
        metadata: { userId: String(userId) },
      }, { idempotencyKey: `alta-sub-${session.id}-48h` });
    }
    const subId = stripeSub.id;
    const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
    const last4 = pm.card?.last4 ? `****${pm.card.last4}` : "";
    const periodEnd = stripeSub.trial_end
      ? new Date(stripeSub.trial_end * 1000)
      : new Date(Date.now() + trialHours * 3600 * 1000);
    const recurringCents = Number(session.metadata?.recurringCents) || Math.round((await getActiveMonthlyPrice()).eur * 100);
    const amountCents = session.amount_total ?? 50;
    const paymentIntent = paymentIntentId;

    await upsertSubscription({
      userId,
      sipayOrder: customerId || session.id,
      sipayTransactionId: subId,
      sipayMaskedCard: last4,
      plan: "trial",
      status: "trialing",
      currentPeriodStart: new Date(),
      currentPeriodEnd: periodEnd,
      trialHours,
      recurringCents,
      cancelAtPeriodEnd: false,
    });
    await markDocumentsPaid(userId);
    await recordCharge({
      userId,
      provider: "stripe",
      amountCents,
      sipayTransactionId: paymentIntent || session.id,
      sipayOrder: session.id,
      sipayMaskedCard: last4,
      status: "ok",
      gclid: session.metadata?.gclid || undefined,
      gclidType: session.metadata?.gclidType || undefined,
    });
    const lang = session.metadata?.lang || "es";
    void setUserLanguage(userId, lang);
    void recordConsent({
      userId,
      event: "payment",
      lang,
      introCents: amountCents,
      recurringCents,
      trialHours,
      provider: "stripe",
      sipayOrder: session.id,
      textShown: `Cobro de alta ${(amountCents / 100).toFixed(2)} EUR ahora. Después ${(recurringCents / 100).toFixed(2)} EUR al mes, al terminar la prueba de ${trialHours} h. Cancelable antes de que acabe.`,
    });
    await recordWebhookEvent({
      provider: "stripe",
      eventId: `stripe_intro_${session.id}`,
      eventType: "stripe_intro_charge",
      status: "ok",
      payload: { sessionId: session.id, userId, subId, amountCents },
    });
    try {
      const user = await getUserById(userId);
      if (user?.email) {
        const { sendTrialWelcomeEmail } = await import("../email");
        sendTrialWelcomeEmail({
          to: user.email,
          name: user.name ?? user.email,
          lang,
          trialEndDate: periodEnd,
        }).catch((err: unknown) => console.warn("[Stripe] welcome email failed:", err));
      }
    } catch (err) {
      console.warn("[Stripe] welcome email setup failed:", err);
    }
  }

  async function onInvoicePaid(invoice: Stripe.Invoice) {
    const reason = invoice.billing_reason;
    if (reason === "subscription_create" || reason === "manual") return;
    if ((invoice.amount_paid ?? 0) <= 0) return;
    const subId = invoiceSubscriptionId(invoice);
    if (!subId) return;
    const row = await getSubscriptionByStripeId(subId);
    if (!row) throw new Error(`invoice_paid_unknown_sub ${subId}`);
    const line = invoice.lines?.data?.[0] as { period?: { end?: number } } | undefined;
    const periodEnd = line?.period?.end
      ? new Date(line.period.end * 1000)
      : new Date(Date.now() + 30 * 24 * 3600 * 1000);
    await upsertSubscription({
      userId: row.userId,
      plan: "monthly",
      status: "active",
      currentPeriodStart: new Date(),
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
      retryCount: 0,
      nextRetryAt: null,
      lastDeclineCode: null,
      declineCategory: null,
    });
    await recordCharge({
      userId: row.userId,
      provider: "stripe",
      amountCents: invoice.amount_paid ?? 0,
      sipayTransactionId: asId((invoice as Stripe.Invoice & { payment_intent?: unknown }).payment_intent) || invoice.id,
      sipayOrder: `renewal-${invoice.id}`,
      status: "ok",
    });
  }

  async function onInvoiceFailed(invoice: Stripe.Invoice) {
    const subId = invoiceSubscriptionId(invoice);
    if (!subId) return;
    const row = await getSubscriptionByStripeId(subId);
    if (!row) return;
    await upsertSubscription({
      userId: row.userId,
      status: "past_due",
      plan: row.plan,
    });
    await recordCharge({
      userId: row.userId,
      provider: "stripe",
      amountCents: invoice.amount_due ?? 0,
      sipayOrder: `renewal-${invoice.id}`,
      status: "failed",
      errorDetail: "invoice.payment_failed",
    });
  }

  async function onSubscriptionChanged(sub: Stripe.Subscription, deleted: boolean) {
    const row = await getSubscriptionByStripeId(sub.id);
    if (!row) return;
    const status = deleted
      ? "canceled"
      : sub.status === "trialing"
        ? "trialing"
        : sub.status === "active"
          ? "active"
          : sub.status === "past_due" || sub.status === "unpaid"
            ? "past_due"
            : sub.status === "canceled"
              ? "canceled"
              : row.status;
    await upsertSubscription({
      userId: row.userId,
      status,
      plan: status === "active" ? "monthly" : row.plan,
      cancelAtPeriodEnd: deleted ? true : sub.cancel_at_period_end,
      currentPeriodEnd: sub.trial_end && sub.status === "trialing"
        ? new Date(sub.trial_end * 1000)
        : row.currentPeriodEnd ?? undefined,
    });
  }

  async function onChargeRefunded(charge: Stripe.Charge) {
    await recordWebhookEvent({
      provider: "stripe",
      eventId: `refund_${charge.id}`,
      eventType: "stripe_refund",
      status: "ok",
      payload: { chargeId: charge.id, amountRefunded: charge.amount_refunded },
    });
  }
}
