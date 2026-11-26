# AGENTS.md: RepVault

Brief for AI agents working on RepVault docs, specs or code. Read this first.

## Context

- **Product:** RepVault, vertical SaaS for gyms, yoga studios, and fitness, dance and martial-arts studios.
- **Portfolio:** CraftLayer. Shared platform lives in [`core/`](https://github.com/craftLayer-studio/craftlayer-core/blob/main/README.md). Do not re-specify core modules here; reference them.
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

QR engine, public storefront (gym page with plans), booking engine (PT and classes), payments, customer CRM, WhatsApp messaging, loyalty and rewards (challenges, referrals), reviews and Google review funnel, staff app, analytics, onboarding wizard. See [core/](https://github.com/craftLayer-studio/craftlayer-core/blob/main/README.md).

## Open questions

1. **Name conflict (minor).** An iOS strength-training tracker called "RepVault" (Kidunot Technologies) exists on the App Store, priced $2.99/month or $19.99/year ([App Store](https://apps.apple.com/us/app/repvault/id6670381332), accessed 2026-11-24). It is a consumer workout logger, not B2B gym software, and not a major brand. Risk: search confusion and trademark objection in class 9/42. Alternatives if we rename: **GymPulse** and **ShowUp** (both need trademark and domain checks; estimate).
2. Should we offer a free plan (up to 50 members) to fight free Excel/WhatsApp habits, or keep a 14-day trial only?
3. Turnstile/door integration: which Indian access-control hardware vendors to support first?
4. Do we act as WhatsApp BSP via a partner (Gupshup, Wati, AiSensy) or use Meta Cloud API directly? Affects cost per message and onboarding time.
5. Class-heavy studios (yoga, Zumba) may need class booking with capacity limits in MVP rather than P1. Validate in first 10 customer calls.
6. GST on gym memberships moved to 5% without ITC from 22 September 2025 per several tax sites; confirm with a CA before building invoice templates.

## Code

Next.js 16 (App Router, webpack), React 19, TypeScript strict, Drizzle ORM on Postgres (PGlite locally and in tests), Astryx design system with the `gothic` theme.

### Structure

| Path | What lives there |
|---|---|
| `src/domain/` | Pure business rules: memberships and freeze, churn rules, reminder schedule, consent, trials, PT slots and commission, money (paise, GST), phone (E.164), IST time, UPI links, message templates. No React, Next or I/O. Unit tests next to each file. |
| `src/server/db/` | Drizzle schema, client (`getDb`: PGlite file DB or `DATABASE_URL`), demo seed. Migrations are in `drizzle/` (generated, committed). |
| `src/server/store/` | Use cases and data access, each scoped by `org_id`. `store.test.ts` runs them against in-memory PGlite. |
| `src/server/adapters/` | `messaging.ts` (simulated WhatsApp to the `outbox` table), `payments.ts` (UPI intent links). |
| `src/server/` | `http.ts` (input parsing, JSON errors), `session.ts` (signed httpOnly staff cookie, `requireStaff`), `rate-limit.ts`, `pages.ts`, `qr.ts`. |
| `src/app/api/` | Thin route handlers: `public/*` (QR pages, rate-limited, no login), `auth/*`, `staff/*`, `owner/*`, `demo/reset`. |
| `src/app/` | Pages: `/` landing, `/demo`, `/c/[token]` check-in, `/t/[token]` trial, `/m/[token]` member page, `/login`, `/desk`, `/owner`, `/owner/messages`, `/owner/settings`, `/owner/qr`, `/pt`. |
| `src/components/` | Client components built from Astryx templates (dashboard, login-card, centered-hero, contact-form, shell-top-nav). |

### Commands

`pnpm dev` (port 3142), `pnpm typecheck && pnpm lint && pnpm test && pnpm build` before every push, `pnpm exec astryx doctor --built .`, `pnpm db:generate` after schema changes, `pnpm db:seed [--reset]`.

### Rules

- Every business row has `org_id`; every query filters by it. Customers are unique per `(org_id, phone)` with phone in E.164.
- Money is integer paise; GST in basis points. Prices and totals are computed on the server from the plan, never taken from the client.
- Times are `timestamptz` (UTC); membership days are IST calendar days (`endAt` = IST midnight of the last valid day).
- Consent: two separate purposes (`service`, `marketing`), append-only `consent_records`, latest wins. Utility messages need `service`, marketing needs `marketing`. Messages without consent are logged as `skipped_no_consent`, never sent.
- Automated messages carry a `dedupe_key` so re-running reminders never double-sends.
- Staff actions call `requireStaff([...roles])` on the server and `assertSameOrigin`. Public QR endpoints are rate-limited; QR and member tokens are 128-bit random.
- UI: Astryx components and tokens only. No raw `div`/`span` layout, no hex or px, no Tailwind. Read props with `pnpm exec astryx component <Name>`.
- Commits: conventional subjects. Never add a `Co-Authored-By` trailer or a "Generated with" line.

<!-- ASTRYX:START -->
Astryx v0.7.17 · 174 components
CLI: run every command as `pnpm exec astryx <cmd>` (shown below as `astryx ...`).

SETUP (once, in app entry e.g. main.tsx) — without these, components render unstyled:
  import "@astryxdesign/core/reset.css";
  import "@astryxdesign/core/astryx.css";

WORKFLOW — start every page from a template, never from scratch:
1. `astryx build "<idea>"` — names the template to scaffold from and the parts it lacks.
2. `astryx template <name> <path>` — scaffold it; keep its frame, gap and padding; replace the content.
3. `astryx component <Name>` to read props before using one; `astryx template <Block>` prints a block example to read for a part it lacks. Astryx names differ from other libraries: buttons, badges, tokens and tabs take their text in `label` (Text, Heading and Link take children), booleans start with `is` or `has` (`isOpen`, `isDisabled`), and every input takes `value` and `onChange`.
Changing an existing page? Keep it: skip step 2 and add components inside its sections; read a block example when it helps.
Before you deliver a build, run `astryx doctor --built <dir>`; don't deliver it if it fails.

RULES:
- No <div> — components handle all layout and spacing.
- Read `astryx docs layout` before changing a template's frame.
- Dense data = rows (Table, List/Item), not Card-wrapped lists. Badge = counts only.
- Style with component props first, then tokens (var(--color-*|--spacing-*|--radius-*)). No raw hex/px. No StyleX/Tailwind compiler here — don't use xstyle/utility classes directly. Some templates use StyleX and need a compiler plugin; see `astryx docs styling-overview`.
- THEMES: palettes and custom colors go through the theme, never :root overrides; so does a denser or roomier app (`editor set <name> spacing tight`), never gap and padding changes page by page. A change to one kind of part (the sidebar, its selected item, the gaps in a form) is a theme change too, not props on one page: `editor how "<ask>"` names the `set … --on <part>` line. No app yet: `astryx experimental theme preview app <dir>` makes a starter app that shows the theme. To make or change a theme (colors, fonts, corners, spacing, a look from a picture), prefer the experimental theme editor over hand-written theme files: `astryx experimental theme editor new <name> --like neutral`, then `editor set <name> <thing> <value>` or `editor how "<what you want>"`; wire it with `astryx theme add <name>`; after each change look at it with `astryx experimental theme editor show <name> --png` (takes pictures of real components) and open the PNGs it writes; a theme change is not done until you have looked at the pictures. In code, extend an imported theme to customize it; `theme eject <slug>` only forks source. See `astryx docs theme`.
- SELF-CHECK: re-read the file; replace any raw <div>/<span>, imported .css/@apply, or hardcoded #hex/px with the component or a token.

`astryx help` lists every command. Key ones beyond the workflow:
  search "<query>"   find any component / hook / doc / template
  discover <words>   integrations you could add
  docs <topic>       getting-started, principles, tokens, theme … (`astryx docs` lists all)
  docs cli           commands and API reference
  docs authoring     build an integration package, and every field it holds
  upgrade --from <old version> --apply   run after a dependency bump
To remove this block, run `astryx init --remove-agents`, which removes it from the agent files at the project root and in the folder you run it in; from any other file it leaves, delete everything from ASTRYX:START to ASTRYX:END.
<!-- ASTRYX:END -->
