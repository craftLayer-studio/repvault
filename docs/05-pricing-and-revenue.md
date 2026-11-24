# 05 Pricing and revenue: RepVault

Exchange rate used: ₹88 = $1 (estimate). All prices exclude 18% GST on our software fee (estimate of standard SaaS GST treatment; confirm with CA).

## Price anchors

| Anchor | Price | Source (accessed 2026-11-24) |
|---|---|---|
| Low-cost Indian tools | ₹809–₹999 per month; AppToFit ₹5,999 per year | [Capterra India](https://www.capterra.in/directory/33276/gym-management/software), [Techjockey](https://techjockey.com/blog/gymmaster-vs-gympik-vs-apptofit/amp) |
| Mid Indian tools | Traqade ₹12,000–₹18,000 per year; FitnessForce about ₹1,500 per month | Same; [Capterra India](https://www.capterra.in/software/128172/fitnessforce) |
| Global independents | Gymdesk $75–$200 per month (₹6,600–₹17,600) | [G2](https://www.g2.com/products/martial-arts-on-rails/pricing) |
| Global premium | Wellyx $79–$299; Zenoti from $400 | [TrustRadius](https://www.trustradius.com/products/wellyx-gym/pricing), [Capterra India](https://www.capterra.in/software/131057/zenoti) |

We price **above** record-keeping tools (we sell revenue outcomes) and **far below** global growth tools.

## Tiers

| | Starter | Growth (recommended) | Pro | Chain |
|---|---|---|---|---|
| INR per month | ₹999 | ₹1,999 | ₹3,499 | from ₹2,499 per branch |
| INR per year (2 months free) | ₹9,999 | ₹19,999 | ₹34,999 | custom |
| USD per month | $11 | $23 | $40 | from $28 per branch |
| Active members | up to 150 | up to 500 | unlimited, 2 branches | 3+ branches |
| QR check-in, attendance | Yes | Yes | Yes | Yes |
| Plans, dues, GST invoices | Yes | Yes | Yes | Yes |
| WhatsApp renewal/dues reminders (utility) | 1,000 messages/month | 3,000/month | 8,000/month | pooled |
| Walk-in trial QR and lead follow-up | Basic (no automation) | Yes | Yes | Yes |
| Churn alerts and at-risk list | No | Yes | Yes | Yes |
| PT booking and commissions | No | Yes | Yes | Yes |
| Class booking with capacity | No | Yes | Yes | Yes |
| Diet/workout plans | No | Yes | Yes | Yes |
| Google review funnel, referrals | No | Yes | Yes | Yes |
| Challenges, leaderboards | No | No | Yes | Yes |
| Campaign builder | No | Credits only | Yes, with credits | Yes |
| Staff logins | 2 | 6 | 15 | unlimited |
| Support | WhatsApp chat | WhatsApp chat + monthly review call | Priority + quarterly growth review | Account manager |

**Why ₹1,999 is the hero price:** a 300-member gym at ₹1,200 average fee recovers the cost with two saved renewals per month (estimate). Starter exists to win small gyms from Excel and upsell when they cross 150 members.

## Add-ons

| Add-on | Price | Margin logic |
|---|---|---|
| WhatsApp marketing credits | ₹1.10 per message (packs of 1,000 = ₹1,100) | Meta India marketing rate about ₹0.86 per message plus GST ([Monty Mobile](https://montymobile.com/blogs/whatsapp-business-api-pricing-in-india-inr-rates-gst-and-the-2026-currency-migration-deadline), accessed 2026-11-24); AiSensy lists ₹1.09 ([AiSensy](https://aisensy.com/tutorials/whatsapp-business-api-fee)) |
| Extra utility messages | ₹200 per 1,000 | Meta utility rate about ₹0.115 per message |
| Done-for-you setup and data import | ₹2,999 one-time (waived on annual) | Covers about 3 hours of onboarding staff time (estimate) |
| QR standee and posters kit | ₹499 | Print cost about ₹200 (estimate) |
| Android tablet for front desk (resale) | ₹9,999 | Low margin; removes setup friction |
| Turnstile/door relay integration (P2) | ₹4,999 setup + ₹499 per month | Hardware partner revenue share (estimate) |
| Branded member PWA (gym logo, custom domain) | ₹999 per month | Pure software margin |

## Revenue streams

1. Subscriptions (target 80% of revenue).
2. WhatsApp marketing credits (target 10%).
3. Setup, hardware and kits (target 5%).
4. Payment partner revenue share from Razorpay referral programmes, if available (estimate; Razorpay standard pricing is 2% + GST per transaction, paid by the gym ([Razorpay](https://razorpay.com/blog/razorpay-payment-gateway-pricing-explained/))).
5. Later: supplement/merch brand partnerships to members (P2, opt-in only).

## Unit economics (estimate)

| Item | Value | Reasoning |
|---|---|---|
| Blended ARPU | ₹1,900 per month | Mix: 30% Starter, 55% Growth, 15% Pro, plus ₹150 average add-ons |
| COGS per gym | ₹330 per month | Hosting ₹80, included utility messages about 2,000 × ₹0.115 = ₹230, misc ₹20 |
| Support cost per gym | ₹150 per month | 1 support person handles about 200 gyms at ₹30,000 per month |
| Gross margin | About 75% | (1,900 − 330 − 150) / 1,900 |
| CAC (field + WhatsApp + demo) | ₹5,000 | 1 sales rep at ₹30,000 + ₹10,000 incentives closes about 8 gyms per month |
| Payback | About 3.5 months | 5,000 / (1,900 × 0.75) |
| Monthly logo churn target | 3% | Average lifetime about 33 months |
| LTV | About ₹47,000 | 1,900 × 0.75 × 33 |
| LTV:CAC | About 9:1 | Healthy if churn holds; drops to 4:1 at 6% churn |

## 12-month scenarios (estimate)

Assumes MVP live at month 2, paid conversions from month 3, 3% monthly churn.

| Scenario | New gyms per month (months 3–12) | Gyms at month 12 | MRR at month 12 | ARR run-rate |
|---|---|---|---|---|
| Conservative | 6 | about 55 | about ₹1.05 lakh | about ₹12.5 lakh |
| Base | 15 | about 135 | about ₹2.6 lakh | about ₹31 lakh |
| Aggressive (2 reps + referrals) | 30 | about 270 | about ₹5.1 lakh | about ₹62 lakh |

Annual-plan push: if 40% of gyms prepay yearly, month-12 cash collected in the base case rises by about ₹15 lakh (estimate), funding the second sales rep.

## Discount rules

- Annual prepay: 2 months free. No other standing discounts.
- Founding 20 gyms: Growth at ₹1,499 per month locked for 12 months in exchange for a testimonial video and 2 referrals.
- Never discount below ₹999 for Growth features; offer Starter instead.
