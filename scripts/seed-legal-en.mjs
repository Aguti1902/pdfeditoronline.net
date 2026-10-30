/**
 * English legal pages for pdfeditoronline.net
 * Run with: node scripts/seed-legal-en.mjs
 */
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const db = await mysql.createConnection(process.env.DATABASE_URL);

const INTRO = `**Alejandro Gutiérrez**, DNI 48063365N, address Avinguda Porta Diagonal, Barcelona, Spain, operates pdfeditoronline.net under the name **PDF Editor Online**. Contact: **support@pdfeditoronline.net**.`;

const termsContent = `# Terms of use and subscription

**Effective:** 30 October 2026

> ${INTRO}

These terms cover access to pdfeditoronline.net and use of its tools. Using the site means you accept them.

## 1. The service

PDF Editor Online is a browser-based PDF workspace. You can adjust text, annotate, sign, compress, password-protect, reorder pages and convert files. Paid tools require an account.

## 2. Your account

You are responsible for the password and for activity under the account. Write to support@pdfeditoronline.net if you see access you do not recognise.

## 3. Trial, price and renewal

The checkout screen is the price that applies. As of this text: a **24-hour trial** costs **0.50 EUR** (tax included). When it ends, the plan continues at **{price}/month** until you cancel.

The trial starts when the first payment is confirmed and ends **24 hours later**. The exact time is emailed and shown in the dashboard. The trial includes **2 downloads** of different documents. Downloading the same file again does not use another credit.

**By paying 0.50 EUR you authorise** a charge of **{price}/month** on the same card when the 24 hours end, and every month after that, until you cancel. Cancel before the trial ends and the monthly charge is not made.

Cancel in the dashboard billing section, or email support@pdfeditoronline.net with the account address. If you cancel after a month has already been charged, access lasts until the end of that period.

### Withdrawal

You have **14 calendar days** from purchase to withdraw and get your money back, with no reason required. This right stands **even if you already used the editor**. The provider does not rely on the digital-content exception in Directive 2011/83/EU. Email support@pdfeditoronline.net or use the dashboard. The refund goes to the same payment method within 14 days of the request.

Prices are in euros and include applicable VAT. A price change is emailed at least 30 days ahead and applies to periods not yet charged.

## 4. Acceptable use

Do not upload unlawful content, access other accounts, send malware or spam, probe the infrastructure, or scrape the site without written permission. Accounts that do so may be suspended.

## 5. Ownership

The site’s design, code and wording belong to the operator. Files you upload remain yours.

## 6. Files

Documents are processed to perform the task you asked for. They are not read for advertising. Temporary files are deleted when processing finishes.

## 7. Liability

The service is provided as available. Liability is limited to the amount you paid in the 12 months before the claim, to the extent the law allows.

## 8. Changes

Material changes are emailed to registered accounts at least 15 days before they apply.

## 9. Law

Spanish and EU law. If you are a consumer, the courts of your domicile. EU online dispute resolution: https://ec.europa.eu/consumers/odr

## 10. Contact

support@pdfeditoronline.net`;

const privacyContent = `# Privacy policy

**Effective:** 30 October 2026

> ${INTRO}

## 1. Controller

Alejandro Gutiérrez, DNI 48063365N, Avinguda Porta Diagonal, Barcelona, Spain. Email: support@pdfeditoronline.net.

## 2. Data we handle

- Account: name, email, credentials.
- Payments: a transaction reference. Card numbers are handled by **Sipay**. We do not store the full card number or the CVV.
- Messages you send us.
- Technical data: IP, browser, language, pages and tools used.
- Cookies, described in the cookie policy.
- PDF files, only to perform the requested task. They are not used to train models or for ads.

## 3. Legal bases

Contract (Art. 6(1)(b) GDPR) for the account and billing. Consent (Art. 6(1)(a)) for non-essential cookies and optional marketing. Legitimate interests (Art. 6(1)(f)) for security. Legal obligation (Art. 6(1)(c)) for tax records.

## 4. Recipients

Sipay (payments), hosting and transactional email, and Google Analytics if you accept that cookie. We do not sell contact lists.

## 5. Retention

Account data while the account is open, plus 30 days after a deletion request unless the law requires longer. Billing records for the tax period (generally 5 years). Temporary files until processing ends. Analytics for at most 26 months.

## 6. Your rights

Access, rectification, erasure, restriction, portability, objection, and withdrawal of consent. Email support@pdfeditoronline.net. We reply within 30 days. You can also complain to the Spanish Data Protection Agency (aepd.es).

## 7. Children

The service is not aimed at anyone under 16.`;

const cookiesContent = `# Cookie policy

**Effective:** 30 October 2026

> ${INTRO}

## Cookies we use

**Necessary:** session_token, csrf_token, and cookie_consent (your banner choice, 12 months). The site cannot sign you in without them.

**Analytics, only if accepted:** Google Analytics (_ga, _ga_*), up to 24 months.

**Preferences:** lang (12 months) and theme, if you set one.

**Payment:** Sipay may set its own cookies during checkout.

Necessary cookies rely on the legitimate interest in running the service. Everything else needs the consent you give in the banner. You can also block cookies in the browser; blocking necessary cookies will stop login.`;

const legalContent = `# Legal notice

**Effective:** 30 October 2026

Information required by Article 10 of Spanish Law 34/2002 (LSSI-CE):

- **Name:** Alejandro Gutiérrez
- **National ID (DNI):** 48063365N
- **Address:** Avinguda Porta Diagonal, Barcelona, Spain
- **Website:** pdfeditoronline.net
- **Service name:** PDF Editor Online
- **Email:** support@pdfeditoronline.net

The site provides browser-based tools to edit, sign, organise and convert PDFs. Site design, logo and code belong to the operator. Your documents do not.

Spanish and EU law apply. Consumers may bring claims before the courts of their domicile.`;

const gdprContent = `# Data protection

**Effective:** 30 October 2026

> ${INTRO}

Personal data is handled under Regulation (EU) 2016/679 and Spanish Organic Law 3/2018.

You can request access, rectification, erasure, restriction, portability or object to processing by emailing support@pdfeditoronline.net. We may ask for a detail that confirms it is your account. The reply period is 30 days. You may lodge a complaint with the AEPD (aepd.es).

Card data is processed by Sipay under PCI DSS. This site does not keep the full card number. Temporary PDFs are deleted when the task finishes.

If a breach is likely to risk people’s rights, it is reported to the supervisory authority within the period in Article 33 GDPR and, where the risk is high, to the people affected.`;

const refundContent = `# Refunds

**Effective:** 30 October 2026

> ${INTRO}

You have **14 calendar days** from purchase to withdraw and receive a refund of the 0.50 EUR trial and of the first monthly fee if that fee was charged inside those 14 days. You do not need to give a reason, and **using the editor does not remove this right**.

Email support@pdfeditoronline.net with the subject “Refund” and the account email, or use the dashboard. The refund is sent to the same payment method within 14 days. Your bank may take a few more days to show it.

The subscription is cancelled. Saved files stay available for 30 days so you can download them, then they are deleted.

A monthly charge made **after** the 14-day window is not covered by withdrawal, except where the charge itself was a mistake. Cancel in Billing before the renewal date to stop the next charge.`;

const pages = [
  { slug: "terms-en", title: "Terms of use and subscription", content: termsContent },
  { slug: "privacy-en", title: "Privacy policy", content: privacyContent },
  { slug: "cookies-en", title: "Cookie policy", content: cookiesContent },
  { slug: "legal-en", title: "Legal notice", content: legalContent },
  { slug: "gdpr-en", title: "Data protection", content: gdprContent },
  { slug: "refund-en", title: "Refunds", content: refundContent },
];

try {
  for (const page of pages) {
    const [rows] = await db.execute("SELECT id FROM legal_pages WHERE slug = ?", [page.slug]);
    if (rows.length > 0) {
      await db.execute(
        "UPDATE legal_pages SET title = ?, content = ?, updatedAt = NOW() WHERE slug = ?",
        [page.title, page.content, page.slug]
      );
      console.log(`Updated: ${page.slug}`);
    } else {
      await db.execute(
        "INSERT INTO legal_pages (slug, title, content) VALUES (?, ?, ?)",
        [page.slug, page.title, page.content]
      );
      console.log(`Inserted: ${page.slug}`);
    }
  }
  console.log("\nEnglish legal pages updated.");
} catch (err) {
  console.error("Error:", err.message);
  process.exitCode = 1;
} finally {
  await db.end();
}
