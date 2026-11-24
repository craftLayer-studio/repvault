# RepVault

**Tagline:** Scan in, show up, renew on time. The QR-first member engine for Indian gyms and studios.

RepVault is vertical SaaS for independent gyms, yoga studios, CrossFit/functional boxes, and dance and martial-arts studios in India. A QR code at the entrance handles member check-in and walk-in trial sign-ups. Attendance data then drives the money features: WhatsApp renewal reminders with UPI links, churn alerts when a member stops showing up, PT session booking with trainer commissions, and gamified challenges that keep members coming back.

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
- Shared platform: [core/](../core/README.md)
