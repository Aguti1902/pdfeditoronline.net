import { boolean, integer, pgEnum, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["user", "admin"]);
export const sipayProvider = pgEnum("sipay_provider", ["fastpay", "gpay", "apay"]);
export const subPlan = pgEnum("sub_plan", ["trial", "monthly", "annual"]);
export const subStatus = pgEnum("sub_status", ["active", "canceled", "past_due", "trialing", "incomplete"]);
export const declineCategory = pgEnum("decline_category", ["soft", "hard", "unknown", "blocked_provider"]);
export const cancelReason = pgEnum("cancel_reason", [
  "too_expensive", "not_using", "missing_feature", "bug_or_issue", "switched_tool", "temporary", "other",
]);
export const paymentStatus = pgEnum("payment_status", ["pending", "paid"]);
export const inviteRole = pgEnum("invite_role", ["editor", "viewer", "admin"]);
export const inviteStatus = pgEnum("invite_status", ["pending", "accepted", "rejected"]);
export const webhookStatus = pgEnum("webhook_status", ["ok", "error"]);
export const chargeProvider = pgEnum("charge_provider", ["fastpay", "gpay", "apay", "mit", "stripe"]);
export const chargeStatus = pgEnum("charge_status", ["ok", "failed", "refunded"]);
export const deviceType = pgEnum("device_type", ["mobile", "desktop"]);
export const consentEvent = pgEnum("consent_event", ["register", "payment"]);


/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRole("role").default("user").notNull(),
  country: varchar("country", { length: 64 }),
  phone: varchar("phone", { length: 32 }),
  language: varchar("language", { length: 16 }).default("es"),
  timezone: varchar("timezone", { length: 64 }).default("Europe/Madrid"),
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  // Own auth fields (email+password and Google OAuth)
  passwordHash: text("passwordHash"),
  googleId: varchar("googleId", { length: 128 }),
  resetToken: varchar("resetToken", { length: 256 }),
  resetTokenExpiry: timestamp("resetTokenExpiry", { withTimezone: true, mode: "date" }),
  emailVerified: boolean("emailVerified").default(false).notNull(),
  // Soft delete: when set, the account is "deleted" but the row is kept for audit/recovery.
  // All auth lookups must filter WHERE deletedAt IS NULL.
  deletedAt: timestamp("deletedAt", { withTimezone: true, mode: "date" }),
  // Internal admin-only notes about this user (support context, VIP tags, etc.).
  adminNotes: text("adminNotes"),
  // Recovery emails ("tu archivo está listo, descárgalo"): user opted out via
  // the unsubscribe link. Never email recovery to unsubscribed users.
  recoveryUnsubscribed: boolean("recoveryUnsubscribed").default(false).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Subscriptions table — tracks subscriptions per user.
 *
 * El cobro va por Sipay: `sipayToken` es lo que se recobra cada mes por MIT-R,
 * y `sipayOrder` + `sipayTransactionId` dan idempotencia y rastro de auditoría.
 * Las columnas de la pasarela anterior se borraron en la migración 0026 (no
 * contenían ningún dato real).
 */
export const subscriptions = pgTable("subscriptions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId").notNull(),
  // Sipay (FastPay / Apple Pay / Google Pay) — tokenized recurring billing.
  // sipayToken is what we re-use in MIT-R charges every month.
  // sipayOrder + sipayTransactionId give us idempotency + audit links.
  sipayToken: varchar("sipayToken", { length: 256 }),
  sipayOrder: varchar("sipayOrder", { length: 128 }),
  sipayTransactionId: varchar("sipayTransactionId", { length: 128 }),
  sipayMaskedCard: varchar("sipayMaskedCard", { length: 32 }),
  sipayProvider: sipayProvider("sipayProvider"),
  plan: subPlan("plan").default("trial").notNull(),
  status: subStatus("status").default("incomplete").notNull(),
  currentPeriodStart: timestamp("currentPeriodStart", { withTimezone: true, mode: "date" }),
  currentPeriodEnd: timestamp("currentPeriodEnd", { withTimezone: true, mode: "date" }),
  cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").default(false).notNull(),
  // LEGACY trial length in days, written by signups before the 24 h policy
  // (2 = the 48 h cohort, 7 = the 7-day one). Nothing writes it any more; it is
  // kept so those cohorts stay identifiable. Null = pre-migration sub.
  trialDays: integer("trialDays"),
  // Trial length (in HOURS) applied when THIS sub was created — the value of
  // site_settings.trial_hours at alta time. This is the live cohort tag: 24 for
  // every signup from 2026-08-11 on. Stored per-sub so 1st-renewal acceptance
  // can be compared across cohorts (24h vs 7d vs 48h) long after the setting
  // changes again. Null = sub created before hours existed, read trialDays.
  trialHours: integer("trialHours"),
  // Precio recurrente que ACEPTÓ el dueño de esta suscripción, en céntimos —
  // el valor de site_settings.subscription_price_eur en el momento del alta.
  // El cron de renovación cobra esto, no el ajuste global, para que subir el
  // precio afecte solo a las altas nuevas: cobrarle 39,95 € a quien autorizó
  // 29,95 € es un contracargo perdido de antemano y desmiente el expediente de
  // `consents`. Null = fila anterior a la migración 0025 → cae al ajuste global
  // (el backfill las fija con lo que consintieron).
  recurringCents: integer("recurringCents"),
  // Dunning: number of consecutive failed renewal attempts + when the next
  // spaced retry is due. Lets us retry at +5/+7/+9 days (instead of hammering
  // the bank daily, which risks getting the merchant flagged) and give up after.
  renewalAttempts: integer("renewalAttempts").default(0).notNull(),
  nextRenewalAt: timestamp("nextRenewalAt", { withTimezone: true, mode: "date" }),
  // Dunning v2 — reintentos clasificados por código de denegación Redsys.
  // Sustituyen a renewalAttempts/nextRenewalAt (que quedan muertos, se
  // dropearán en una migración futura). Ancla del calendario = currentPeriodEnd.
  //  retryCount:      reintentos ya programados en el ciclo actual.
  //  nextRetryAt:     cuándo toca el siguiente reintento (null = sin reintento).
  //  lastDeclineCode: último code Redsys (data.payload.code).
  //  declineCategory: 'soft' | 'hard' | 'unknown'.
  //  dunningLockedAt: lock de idempotencia del cron (no es dato de negocio).
  retryCount: integer("retryCount").default(0).notNull(),
  nextRetryAt: timestamp("nextRetryAt", { withTimezone: true, mode: "date" }),
  lastDeclineCode: varchar("lastDeclineCode", { length: 16 }),
  // 'blocked_provider': códigos que no cancelamos ni reintentamos (172/174 tras
  // el cambio Sipay 19/07 — ver BLOCKED_PROVIDER_CODES en dunning.ts). blockedAt
  // = cuándo se bloqueó, para la lista de recuperación cuando Sipay confirme.
  declineCategory: declineCategory("declineCategory"),
  blockedAt: timestamp("blockedAt", { withTimezone: true, mode: "date" }),
  dunningLockedAt: timestamp("dunningLockedAt", { withTimezone: true, mode: "date" }),
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  // Reason captured from the user when they cancel — powers churn analysis.
  cancelReason: cancelReason("cancelReason"),
  cancelFeedback: text("cancelFeedback"),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

/**
 * Payment attempts — un registro por CADA intento de cobro MIT (original +
 * cada reintento del dunning). Es la traza estructurada para auditar el ciclo
 * de cobro de una suscripción sin JSON-parsear webhook_events. `charges` sigue
 * siendo el ledger de dinero; esto es el log de intentos con su código Redsys.
 */
export const paymentAttempts = pgTable("payment_attempts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  subscriptionId: integer("subscriptionId").notNull(),
  userId: integer("userId"),
  attemptedAt: timestamp("attemptedAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  // Método de la credencial usada (de subscriptions.sipayProvider). El cobro es
  // siempre MIT, pero la tarjeta puede venir de FastPay / Apple Pay / Google Pay.
  paymentMethod: varchar("paymentMethod", { length: 16 }),
  amountCents: integer("amountCents"),
  responseCode: varchar("responseCode", { length: 16 }),
  success: boolean("success").notNull(),
  rawResponse: text("rawResponse"),
});

export type PaymentAttempt = typeof paymentAttempts.$inferSelect;
export type InsertPaymentAttempt = typeof paymentAttempts.$inferInsert;

/**
 * Documents — user PDF documents stored in S3.
 */
export const documents = pgTable("documents", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 512 }).notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileSize: integer("fileSize").default(0).notNull(),
  folderId: integer("folderId"),
  /** Payment status: pending = saved but not yet paid, paid = user has active subscription */
  paymentStatus: paymentStatus("paymentStatus").default("pending").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  // First time this doc was downloaded by the owner. Used to count trial usage
  // — re-downloads of the same doc don't count toward the 2-PDF trial limit.
  firstDownloadedAt: timestamp("firstDownloadedAt", { withTimezone: true, mode: "date" }),
  // Recovery-email sequence for abandoned (pending) docs: 0=none, 1=sent +1h,
  // 2=sent +24h, 3=sent last-chance. Stops when the doc becomes paid.
  recoveryStage: integer("recoveryStage").default(0).notNull(),
  recoveryLastSentAt: timestamp("recoveryLastSentAt", { withTimezone: true, mode: "date" }),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

/**
 * Folders — document organization for users.
 */
export const folders = pgTable("folders", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
});

export type Folder = typeof folders.$inferSelect;
export type InsertFolder = typeof folders.$inferInsert;

/**
 * Team invitations — users can invite team members.
 */
export const teamInvitations = pgTable("team_invitations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  ownerId: integer("ownerId").notNull(),
  inviteeEmail: varchar("inviteeEmail", { length: 320 }).notNull(),
  inviteeId: integer("inviteeId"),
  role: inviteRole("role").default("editor").notNull(),
  status: inviteStatus("status").default("pending").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
});

export type TeamInvitation = typeof teamInvitations.$inferSelect;
export type InsertTeamInvitation = typeof teamInvitations.$inferInsert;

/**
 * Legal pages — editable content for Terms, Privacy, Refund, Cookies, etc.
 */
export const legalPages = pgTable("legal_pages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  title: varchar("title", { length: 256 }).notNull(),
  content: text("content").notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
});

export type LegalPage = typeof legalPages.$inferSelect;
export type InsertLegalPage = typeof legalPages.$inferInsert;

/**
 * Contact messages — submitted via the contact form.
 */
export const contactMessages = pgTable("contact_messages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId"),
  name: varchar("name", { length: 128 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  reason: varchar("reason", { length: 128 }),
  subject: varchar("subject", { length: 256 }).notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  repliedAt: timestamp("repliedAt", { withTimezone: true, mode: "date" }),
  replyBody: text("replyBody"),
  archivedAt: timestamp("archivedAt", { withTimezone: true, mode: "date" }),
});

export type ContactMessage = typeof contactMessages.$inferSelect;
export type InsertContactMessage = typeof contactMessages.$inferInsert;

/**
 * Site settings — key/value store for admin-configurable settings
 */
export const siteSettings = pgTable("site_settings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  key: varchar("key", { length: 128 }).notNull().unique(),
  value: text("value"),
  updatedAt: timestamp("updatedAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
});

export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertSiteSetting = typeof siteSettings.$inferInsert;

/**
 * Email templates — admin-managed canned replies for contact_messages.
 * `body` may contain {{name}} / {{subject}} placeholders that are
 * substituted client-side at insert time.
 */
export const emailTemplates = pgTable("email_templates", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 128 }).notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
});

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = typeof emailTemplates.$inferInsert;

/**
 * Blog posts — SEO/GEO-optimized articles for the blog section.
 */
export const blogPosts = pgTable("blog_posts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  slug: varchar("slug", { length: 256 }).notNull().unique(),
  title: varchar("title", { length: 512 }).notNull(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  metaTitle: varchar("metaTitle", { length: 512 }),
  metaDescription: text("metaDescription"),
  category: varchar("category", { length: 128 }).default("guides").notNull(),
  tags: text("tags"),
  readTime: integer("readTime").default(5).notNull(),
  published: boolean("published").default(true).notNull(),
  publishedAt: timestamp("publishedAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
});

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = typeof blogPosts.$inferInsert;

/**
 * Webhook events — registro de lo que devuelve la pasarela en cada operación, para que
 * the admin can trace whether events arrived and were processed successfully.
 * Capped retention: keep last ~500 rows via periodic pruning (future job).
 */
export const webhookEvents = pgTable("webhook_events", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  provider: varchar("provider", { length: 32 }).default("sipay").notNull(),
  eventId: varchar("eventId", { length: 128 }),
  eventType: varchar("eventType", { length: 128 }).notNull(),
  status: webhookStatus("status").notNull(),
  errorMessage: text("errorMessage"),
  durationMs: integer("durationMs").default(0).notNull(),
  payload: text("payload"),
  receivedAt: timestamp("receivedAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
});

export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type InsertWebhookEvent = typeof webhookEvents.$inferInsert;

/**
 * Charges — structured ledger of every Sipay charge attempt (intro + monthly
 * MIT-R). Used by the admin billing tab to render revenue, refund individual
 * charges, and spot failures. We log charges here in addition to
 * `webhook_events` (which stores the raw payload for audit) so the queries
 * the admin runs every page-load don't have to JSON-parse 8 KB blobs.
 */
export const charges = pgTable("charges", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId").notNull(),
  provider: chargeProvider("provider").notNull(),
  amountCents: integer("amountCents").notNull(),
  refundedCents: integer("refundedCents").default(0).notNull(),
  currency: varchar("currency", { length: 8 }).default("EUR").notNull(),
  sipayTransactionId: varchar("sipayTransactionId", { length: 128 }),
  sipayOrder: varchar("sipayOrder", { length: 128 }),
  sipayMaskedCard: varchar("sipayMaskedCard", { length: 32 }),
  status: chargeStatus("status").default("ok").notNull(),
  errorDetail: varchar("errorDetail", { length: 512 }),
  // Google Ads click ID captured on landing, for server-side (offline)
  // conversion import — bypasses Safari/ITP + adblockers that eat gtag.
  gclid: varchar("gclid", { length: 512 }),
  gclidType: varchar("gclidType", { length: 16 }),
  // Device class of the payer, derived from the User-Agent at charge time.
  // NULL for MIT renewals (cron, no browser) and for pre-migration rows.
  deviceType: deviceType("deviceType"),
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
});

export type Charge = typeof charges.$inferSelect;
export type InsertCharge = typeof charges.$inferInsert;

/**
 * Audit log — who did what in the admin panel. Keeps an immutable trail for
 * investigating incidents (rogue admins, bad refunds, role escalations).
 */
export const auditLog = pgTable("audit_log", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  adminId: integer("adminId").notNull(),
  adminEmail: varchar("adminEmail", { length: 320 }),
  action: varchar("action", { length: 64 }).notNull(),
  targetType: varchar("targetType", { length: 64 }),
  targetId: varchar("targetId", { length: 128 }),
  metadata: text("metadata"),
  ipAddress: varchar("ipAddress", { length: 64 }),
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
});

export type AuditLog = typeof auditLog.$inferSelect;
export type InsertAuditLog = typeof auditLog.$inferInsert;

/**
 * Consentimiento del cliente, guardado en el momento en que lo da.
 *
 * Existe para poder responder a un contracargo con algo más que "nuestra web lo
 * pone": qué vio ESA persona, ese día, a esa hora, en qué idioma y desde qué
 * navegador. Un banco no acepta una captura de pantalla hecha hoy de una página
 * que pudo cambiar desde entonces.
 *
 * `textShown` guarda la frase literal que se le renderizó, y `termsHash` apunta
 * a la versión de los Términos vigente en ese instante (ver `legalSnapshots`),
 * de modo que la prueba sigue siendo válida aunque los textos se reescriban
 * después. Es una tabla de solo-inserción: no se actualiza ni se borra nada.
 */
export const consents = pgTable("consents", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId").notNull(),
  /** register = al crear la cuenta · payment = al autorizar el cobro. */
  event: consentEvent("event").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  ip: varchar("ip", { length: 64 }),
  userAgent: varchar("userAgent", { length: 512 }),
  lang: varchar("lang", { length: 8 }),
  /** La frase exacta que se le mostró, ya traducida. */
  textShown: text("textShown"),
  /** SHA-256 del contenido de los Términos vigente en ese momento. */
  termsHash: varchar("termsHash", { length: 64 }),
  /** Importes vigentes en el momento del consentimiento, en céntimos. */
  introCents: integer("introCents"),
  recurringCents: integer("recurringCents"),
  trialHours: integer("trialHours"),
  provider: varchar("provider", { length: 16 }),
  sipayOrder: varchar("sipayOrder", { length: 128 }),
});

export type Consent = typeof consents.$inferSelect;
export type InsertConsent = typeof consents.$inferInsert;

/**
 * Archivo de las versiones de los textos legales, deduplicado por hash.
 *
 * Cada consentimiento apunta aquí en lugar de copiar los ~10 KB del texto, así
 * que miles de filas de `consents` comparten un puñado de snapshots. Sirve para
 * demostrar meses después qué decían exactamente los Términos el día que un
 * cliente concreto los aceptó.
 */
export const legalSnapshots = pgTable("legal_snapshots", {
  hash: varchar("hash", { length: 64 }).primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull(),
  title: varchar("title", { length: 256 }),
  content: text("content"),
  capturedAt: timestamp("capturedAt", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
});

export type LegalSnapshot = typeof legalSnapshots.$inferSelect;
