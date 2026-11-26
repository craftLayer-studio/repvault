# RepVault

**Tagline:** Scan in, show up, renew on time. The QR-first member engine for Indian gyms and studios.

RepVault is vertical SaaS for independent gyms, yoga studios, CrossFit/functional boxes, and dance and martial-arts studios in India. A QR code at the entrance handles member check-in and walk-in trial sign-ups. Attendance data then drives the money features: WhatsApp renewal reminders with UPI links, churn alerts when a member stops showing up, PT session booking with trainer commissions, and gamified challenges that keep members coming back.

**Status:** MVP, demo data, simulated messaging and payments. Live site (planned): [repvault.craftlayer.store](https://repvault.craftlayer.store).

## How to run

Requirements: Node 20.9+ and pnpm 11.

```bash
pnpm install
cp .env.example .env      # optional; defaults work for local dev
pnpm dev                  # http://localhost:3142
```

The first request creates a local Postgres (PGlite) database in `./.data/pglite`, runs the migrations in `drizzle/` and seeds a fictional demo gym. Set `DATABASE_URL` to use a real Postgres instead.

| Command | What it does |
|---|---|
| `pnpm dev` | Dev server on port 3142 (webpack) |
| `pnpm build` / `pnpm start` | Production build and server |
| `pnpm typecheck` / `pnpm lint` / `pnpm test` | Quality gates (CI runs all of them plus the build) |
| `pnpm db:seed` | Seed an empty database; `pnpm db:seed --reset` wipes and reseeds the demo gym |
| `pnpm db:generate` | Generate a SQL migration after changing `src/server/db/schema.ts` |
| `pnpm exec astryx doctor --built .` | Check Astryx design-system usage |

## Demo walkthrough

The demo gym is **Kesari Forge Fitness (Demo)**, a fictional gym in Indore with about 45 members, 5 walk-in leads, 2 trainers and 5 weeks of check-ins. All data is generated relative to today.

1. Open `/` and click **Try the demo** (`/demo`). It shows both entrance QR codes, sample member pages and the staff phones.
2. **Walk-in QR** (`/t/<token>`): enter a name and any Indian mobile number. Both consent boxes start unticked. You get a trial pass; with the "updates" box ticked, the pass also goes to the simulated WhatsApp outbox.
3. **Entrance QR** (`/c/<token>`): check in with the same phone (the device is remembered, so the next scan is one tap), or with a member phone from `/demo`. Expired members get a renew link instead.
4. **Staff sign-in** (`/login`): owner `+91 98110 00001`, front desk `+91 98110 00002`, trainer `+91 98110 00003`. The OTP is shown on screen (demo mode).
5. **Front desk** (`/desk`): live attendance (refreshes every 10 s), the new lead appears under Walk-in leads; sell a plan to convert it, take part-payments, freeze, or add a new member.
6. **Owner dashboard** (`/owner`): active members, expiring in 7 days, revenue this month, check-ins and the 14-day attendance trend, peak hours, and the at-risk list with Nudge / Call / Dismiss. **Send today's reminders** runs the renewal and dues automation.
7. **Messages** (`/owner/messages`): every simulated WhatsApp, with consent-skipped messages marked.
8. **Member page** (`/m/<token>`, the link inside every WhatsApp): renew with a UPI intent link (`upi://pay?...`), "Demo: paid" simulates the payment, book a PT slot, and switch WhatsApp consent on or off.
9. **PT sessions** (`/pt`): book for a member, mark done / no-show, and see trainer commission for the month.
10. **Settings** (`/owner/settings`): plans and GST, printable QR sheet (`/owner/qr`), DPDP data export and erase, and demo reset.

## Features: built vs planned

| ID | Feature | Status |
|---|---|---|
| R2 | Entrance QR check-in, desk check-in, live attendance | Built |
| R3 | Walk-in trial QR, consented phone capture, lead pipeline | Built |
| R4 | Plans with GST, part-payments and dues, freeze, invoice numbers | Built (invoice PDF not built) |
| R5 | WhatsApp renewal (T-7, T-3, T-0, T+3, T+10 win-back) and dues reminders with UPI link | Built, simulated outbox |
| R6 | Rule-based churn alerts and at-risk list with outreach log | Built |
| R7 | Owner dashboard: active, expiring, revenue, attendance trend, peak hours, leads | Built |
| R8 | DPDP consent (two separate opt-ins, notice version), opt-out, export, erase | Built |
| R9 | PT booking (desk and member self-booking), session sign-off, commission report | Built (PT packs and payment for PT not built) |
| R1 | Setup wizard and Excel import | Not built (plans editable in Settings; demo is seeded) |
| R10-R20 | Class booking, diet plans, reviews, referrals, campaigns, challenges, turnstiles, multi-branch | Planned |

Integrations are adapters: `simulated` WhatsApp writes to the `outbox` table; payments use free UPI intent links, confirmed at the desk (or by the demo button). No real API keys or third-party calls.

Contact: [repvault@craftlayer.store](mailto:repvault@craftlayer.store) (product), [hello@craftlayer.store](mailto:hello@craftlayer.store) (general), [licensing@craftlayer.store](mailto:licensing@craftlayer.store) (commercial licences). Company site: [craftlayer.store](https://craftlayer.store).

## Ideal customer (ICP)

| Attribute | Primary ICP | Secondary ICP |
|---|---|---|
| Business | Independent gym or studio, 1–2 branches | Boutique studios (yoga, Zumba, MMA, dance), 1–3 branches |
| Size | 150–800 active members, 3–15 staff | 50–250 members, 1–5 instructors |
| Location | Tier 1–3 cities in India | Same |
| Current tools | Paper register, Excel, WhatsApp groups, sometimes a basic gym app | Google Forms, Instagram DMs, UPI QR |
| Monthly fee per member | ₹800–₹2,500 (estimate) | ₹1,500–₹4,000 (estimate) |
| Buyer | Owner (often also head trainer) | Owner-instructor |

## Top features (P0 = in the 6–8 week MVP)

| Priority | Feature | Metric it moves |
|---|---|---|
| P0 | Entrance QR check-in (member phone or gym tablet), live attendance | Activation, retention |
| P0 | Walk-in QR: free trial pass with consented phone capture | Acquisition |
| P0 | Membership plans, dues tracking, GST invoices | Revenue |
| P0 | WhatsApp renewal and payment reminders with UPI/Razorpay link | Revenue, retention |
| P0 | Churn alerts from attendance drop (rule-based) | Retention |
| P1 | PT session booking, trainer commissions | Revenue (ARPU) |
| P1 | Diet and workout plans sent on WhatsApp/PWA | Retention |
| P1 | Google review funnel, referrals | Acquisition, referral |
| P2 | Challenges and leaderboards, streaks | Retention |
| P2 | Turnstile/door integration, multi-branch | Revenue (upsell) |

## Pricing (summary)

| Plan | INR / month | INR / year | USD / month |
|---|---|---|---|
| Starter (up to 150 members) | ₹999 | ₹9,999 | $11 |
| Growth (up to 500 members) | ₹1,999 | ₹19,999 | $23 |
| Pro (unlimited, 2 branches) | ₹3,499 | ₹34,999 | $40 |
| Chain (3+ branches) | from ₹2,499 per branch | custom | from $28 per branch |

Prices exclude 18% GST on the software fee. USD at ₹88 = $1 (estimate). Full detail in [docs/05-pricing-and-revenue.md](docs/05-pricing-and-revenue.md).

## Why RepVault wins

- **QR, not fingerprint.** No biometric hardware to buy and no biometric data to protect under DPDP.
- **WhatsApp-native.** Members already live on WhatsApp. Reminders and renewals happen there, not in an app nobody downloads.
- **Priced for Indian independents.** Below global tools ($75–$200 per month) and in the band of Indian tools (₹809–₹9,999 per month), but with churn and lead features most cheap tools lack. See [docs/04-market-research.md](docs/04-market-research.md).

## Documents

- [AGENTS.md](AGENTS.md): brief for AI agents
- [01 Product plan](docs/01-product-plan.md)
- [02 Problems and benefits](docs/02-problems-and-benefits.md)
- [03 Pros, cons, risks](docs/03-pros-cons-risks.md)
- [04 Market research](docs/04-market-research.md)
- [05 Pricing and revenue](docs/05-pricing-and-revenue.md)
- [06 Go-to-market and onboarding](docs/06-go-to-market-and-onboarding.md)
- Shared platform: [core/](https://github.com/craftLayer-studio/craftlayer-core/blob/main/README.md)

## Licence

Source-available under the [PolyForm Noncommercial License 1.0.0](LICENSE.md). Personal, educational, research and non-profit use is free. **Any commercial use requires a paid licence or written permission from CraftLayer Studio.** See [COMMERCIAL-LICENSE.md](COMMERCIAL-LICENSE.md).

Part of the [CraftLayer Products](https://github.com/craftLayer-studio/craftlayer-products) portfolio.
