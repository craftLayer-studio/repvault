# 01 Product plan: RepVault

## Vision

Every independent gym and studio in India knows, every morning, who is about to quit, who owes money, and which walk-in to call, and fixes all three from WhatsApp in 10 minutes.

## Problem in one line

Gyms lose money in three places: walk-ins who never convert, renewals that lapse because nobody followed up, and members who quietly stop coming in their first 90 days. Vendor data suggests 45% of new members cancel within 90 days ([BarBend on Wodify data](https://barbend.com/wodify-blog-series-reveals-45-of-members-quit-after-90-days), accessed 2026-11-24).

## ICP

| Segment | Members | Why they buy | Priority |
|---|---|---|---|
| Independent mid-size gym (Tier 1–2) | 200–800 | Renewal leakage, front desk chaos, wants to look professional | 1 |
| Small neighbourhood gym (Tier 2–3) | 80–250 | Cheap reminders, dues tracking, replace register | 2 |
| Yoga / Zumba / dance studio | 50–250 | Class attendance, batch timings, renewals | 2 |
| Martial-arts academy (kids heavy) | 50–300 | Parent communication, fee reminders, belt progress | 3 |
| Small chains (2–5 branches) | 800–3,000 | Multi-branch view, trainer commissions | 3 (upsell) |

## Personas

| Persona | Role | Goals | Pain |
|---|---|---|---|
| Vikram, 34 | Owner-trainer, 350-member gym in Indore | More renewals, fewer arguments over dues | Spends 1–2 hours a day chasing payments on WhatsApp (estimate) |
| Pooja, 26 | Front desk | Fast check-in, clear dues list | Paper register, no idea who is expired |
| Arjun, 29 | Personal trainer | Book PT clients, track commission | Disputes over sessions done and commission owed |
| Neha, 31 | Member | Easy renewal, see progress | Forgets renewal date, gets awkward reminders at the desk |
| Rahul, 22 | Walk-in | Try before paying | Gym asks too many questions, high-pressure sales |

## User journeys

### Walk-in to member (acquisition)

1. Walk-in scans "Free 1-day trial" QR at entrance.
2. Enters name, phone, goal; ticks consent box (DPDP notice shown).
3. Gets trial pass on WhatsApp; front desk sees lead on dashboard.
4. Day 1 after trial: automated WhatsApp with plan offer and UPI link.
5. Day 3: front desk gets "call this lead" task. Day 7: last offer.
6. Lead pays; becomes member; check-in QR access starts.

### Daily check-in (activation)

1. Member scans entrance QR with phone camera (opens PWA, recognises device) or shows personal QR to the front-desk tablet.
2. System logs check-in, shows status: active, expiring in N days, or dues pending.
3. Expired or dues pending triggers a gentle on-screen and WhatsApp prompt with payment link.

### Renewal (revenue)

1. T-7, T-3, T-0 days: WhatsApp utility template with plan options and UPI link.
2. Member pays; GST invoice auto-sent; end date extended.
3. T+3 unpaid: front desk task. T+10: win-back offer (owner-approved discount).

### Churn rescue (retention)

1. Rule flags member: no check-in in 7 days, or weekly visits down 50% vs their own 4-week baseline, or first-30-day member under 4 visits.
2. Owner sees "At-risk" list each morning; one tap sends a personal WhatsApp from a template ("Missed you this week...").
3. Trainer assigned to call top 10 at-risk members. Outcome logged.

## Features by phase

### MVP (weeks 1–8, sellable)

| ID | Feature | P | Metric moved | Core module |
|---|---|---|---|---|
| R1 | Gym setup wizard: plans, batches, staff, import members from Excel | P0 | Activation | Onboarding wizard |
| R2 | Entrance QR check-in + front-desk tablet mode + live attendance | P0 | Activation, retention | QR engine, staff app |
| R3 | Walk-in trial QR with consent capture, lead pipeline | P0 | Acquisition | QR engine, CRM |
| R4 | Membership plans, part-payments, dues, freeze, GST invoice | P0 | Revenue | Payments |
| R5 | WhatsApp renewal and dues reminders with UPI/Razorpay link | P0 | Revenue, retention | WhatsApp messaging, payments |
| R6 | Rule-based churn alerts and daily at-risk list | P0 | Retention | Analytics, CRM |
| R7 | Owner dashboard: collections, expiring, at-risk, leads, attendance heatmap | P0 | Retention (of gym as our customer) | Analytics |
| R8 | DPDP consent, notice, opt-out, data export/delete | P0 | Risk reduction | CRM |

### Phase 2 (months 3–5)

| ID | Feature | P | Metric moved |
|---|---|---|---|
| R9 | PT session packs, booking, session sign-off by member, trainer commission report | P1 | ARPU (gym upsells PT), our tier upgrade |
| R10 | Class/batch booking with capacity (yoga, Zumba, HIIT) | P1 | Retention, activation for studios |
| R11 | Diet and workout plans: templates, assign, send on WhatsApp/PWA | P1 | Retention |
| R12 | Google review funnel after 10th check-in | P1 | Acquisition |
| R13 | Referral: member shares link, both get extra days | P1 | Referral |
| R14 | WhatsApp campaign builder (festive offers, reactivation) with credits | P1 | Revenue (our credits) |

### Phase 3 (months 6–12)

| ID | Feature | P | Metric moved |
|---|---|---|---|
| R15 | Challenges, streaks, leaderboards (monthly check-in challenge, transformation challenge) | P2 | Retention |
| R16 | Turnstile/door relay integration triggered by QR | P2 | ARPU (hardware add-on) |
| R17 | Multi-branch, cross-branch access, chain dashboard | P2 | ARPU |
| R18 | ML churn score using attendance, payments and engagement | P2 | Retention |
| R19 | Body measurement and progress photos (with consent) | P2 | Retention |
| R20 | Supplement/merch counter POS | P2 | ARPU |

## Data model (key entities)

| Entity | Key fields | Notes |
|---|---|---|
| Gym (tenant) | id, name, GSTIN, branches, timezone, WhatsApp number | From core tenancy |
| Branch | id, gym_id, address, QR codes | |
| Staff | id, role (owner, manager, desk, trainer), commission rules | |
| Member | id, phone, name, DOB, guardian_id (if minor), consent records, goals | Phone is core CRM key |
| Lead | id, phone, source (trial QR, referral, Instagram), stage, trial pass | Converts to Member |
| Plan | id, name, duration_days, price, GST rate, class limits | |
| Membership | id, member_id, plan_id, start, end, status, freeze periods | |
| Payment | id, membership_id, amount, mode (UPI, cash, card), invoice_no | From core payments |
| CheckIn | id, member_id, branch_id, timestamp, method (self QR, desk QR) | High volume |
| RiskFlag | id, member_id, rule, created_at, action_taken, outcome | |
| PTPack / PTSession | trainer_id, member_id, sessions_total, sessions_used, sign-off | P1 |
| Message | id, template, category (utility/marketing), cost, status | From core messaging |
| Consent | subject_id, purpose, channel, timestamp, withdrawn_at | DPDP |

## Integrations

| Integration | Purpose | Phase |
|---|---|---|
| WhatsApp Business Platform (via BSP or Cloud API) | Reminders, offers, plans | MVP |
| Razorpay (UPI, cards, payment links, subscriptions/e-mandate later) | Collections | MVP |
| Google Business Profile review link | Reviews | P1 |
| Excel/CSV import | Migration from registers | MVP |
| Access-control relays/turnstiles (local vendors) | Door unlock on QR | P2 |
| Tally/Zoho Books export | Accounting | P2 |

## Success metrics

| Layer | Metric | Target (first 6 months, estimate) |
|---|---|---|
| Acquisition (ours) | Paying gyms | 10 by day 60 after MVP; 60 by month 6 |
| Activation | % of gym's active members with ≥1 QR check-in in first 30 days | ≥60% |
| Gym outcome | On-time renewal rate (paid by T+3) | +15 points vs gym's baseline |
| Gym outcome | Walk-in to paid conversion | ≥20% of trial leads |
| Retention (ours) | Monthly logo churn | <3% |
| Revenue | Blended ARPU | ≥₹1,900/month |
| Referral | % of new gyms from owner referrals | ≥20% by month 6 |

## Build plan (6–8 weeks, 2 engineers + 1 founder)

| Week | Deliverable |
|---|---|
| 1 | Tenant setup on core, plans, members import, owner dashboard skeleton |
| 2 | QR check-in (self and desk modes), attendance log |
| 3 | Payments, dues, GST invoices, part-payments |
| 4 | WhatsApp templates (approved), renewal/dues automations |
| 5 | Trial QR lead capture, lead pipeline, follow-up automation |
| 6 | Churn rules, at-risk list, daily owner summary on WhatsApp |
| 7 | DPDP consent/opt-out, pilot with 3 gyms |
| 8 | Fixes from pilot, pricing page, start paid conversions |
