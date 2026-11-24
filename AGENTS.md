# AGENTS.md: RepVault

Brief for AI agents working on RepVault docs, specs or code. Read this first.

## Context

- **Product:** RepVault, vertical SaaS for gyms, yoga studios, and fitness, dance and martial-arts studios.
- **Portfolio:** CraftLayer. Shared platform lives in [`core/`](../core/README.md). Do not re-specify core modules here; reference them.
- **Market:** India first (Tier 1–3 cities), global-ready later. Prices in INR with USD equivalents.
- **Wedge:** A QR code at the gym entrance. Members scan to check in. Walk-ins scan to claim a free trial pass, which captures their phone number with consent. Attendance data powers renewals, churn alerts and engagement.
- **Business goal:** Earn money fast. MVP sellable in 6–8 weeks, first 10 paying gyms within 60 days of MVP.

## Reading order

1. [README.md](README.md): one-page summary
2. [docs/01-product-plan.md](docs/01-product-plan.md): features, data model, phases
3. [docs/05-pricing-and-revenue.md](docs/05-pricing-and-revenue.md): what we charge and why
4. [docs/06-go-to-market-and-onboarding.md](docs/06-go-to-market-and-onboarding.md): how we sell and onboard
5. [docs/04-market-research.md](docs/04-market-research.md): numbers and sources
6. [docs/02-problems-and-benefits.md](docs/02-problems-and-benefits.md), [docs/03-pros-cons-risks.md](docs/03-pros-cons-risks.md)

## Glossary

| Term | Meaning |
|---|---|
| Member | A paying customer of the gym with an active or expired membership |
| Walk-in / lead | A prospect who scanned the trial QR but has not paid |
| Trial pass | Free 1–3 day pass issued to a lead after consent capture |
| Check-in | A scan event at the entrance QR, linked to a member |
| Plan | A membership product (monthly, quarterly, half-yearly, annual, class pack) |
| Dues | Unpaid balance on a membership, including part-payments |
| At-risk member | Member flagged by churn rules (attendance drop or near expiry without renewal) |
| PT | Personal training: paid 1:1 sessions with a trainer, often commission-based |
| Freeze | Pause of a membership for travel or injury, extending the end date |
| Owner app | Web/PWA dashboard for the owner and front desk |
| Member PWA | Lightweight web app a member opens from WhatsApp links; no install required |

## Decisions made

| Decision | Choice | Reason |
|---|---|---|
| Check-in method | QR (member scans wall QR, or front desk scans member QR); no biometrics in MVP | Zero hardware, no biometric data under DPDP, fast to deploy |
| Member channel | WhatsApp Business API + PWA; no native member app in MVP | Members will not install another app; WhatsApp reach is near universal |
| Churn model | Rule-based in MVP (days since last visit, visit frequency drop vs own baseline, days to expiry) | Ships in weeks, explainable to owners; ML later with data |
| Payments | Razorpay/UPI links via core payments; gym is merchant of record | Gym keeps the money; we avoid payment-aggregator licensing |
| Pricing | Flat monthly tiers by active-member count; WhatsApp marketing as credits | Matches Indian buyer preference for flat fees; protects margin on marketing sends |
| Minors | Parental consent flow for members under 18 | DPDP Act requires verifiable parental consent for children's data |

## Core modules used

QR engine, public storefront (gym page with plans), booking engine (PT and classes), payments, customer CRM, WhatsApp messaging, loyalty and rewards (challenges, referrals), reviews and Google review funnel, staff app, analytics, onboarding wizard. See [core/](../core/README.md).

## Open questions

1. **Name conflict (minor).** An iOS strength-training tracker called "RepVault" (Kidunot Technologies) exists on the App Store, priced $2.99/month or $19.99/year ([App Store](https://apps.apple.com/us/app/repvault/id6670381332), accessed 2026-11-24). It is a consumer workout logger, not B2B gym software, and not a major brand. Risk: search confusion and trademark objection in class 9/42. Alternatives if we rename: **GymPulse** and **ShowUp** (both need trademark and domain checks; estimate).
2. Should we offer a free plan (up to 50 members) to fight free Excel/WhatsApp habits, or keep a 14-day trial only?
3. Turnstile/door integration: which Indian access-control hardware vendors to support first?
4. Do we act as WhatsApp BSP via a partner (Gupshup, Wati, AiSensy) or use Meta Cloud API directly? Affects cost per message and onboarding time.
5. Class-heavy studios (yoga, Zumba) may need class booking with capacity limits in MVP rather than P1. Validate in first 10 customer calls.
6. GST on gym memberships moved to 5% without ITC from 22 September 2025 per several tax sites; confirm with a CA before building invoice templates.
