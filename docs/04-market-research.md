# 04 Market research: RepVault

All sources accessed 2026-11-24. Third-party pricing figures conflict often; where they do, the range is shown. Anything unsourced is marked (estimate).

## Market size (India)

| Metric | Value | Source |
|---|---|---|
| Commercial fitness facility market, 2024 | About ₹16,200 crore | [Deloitte/HFA India Fitness Market Report 2025](https://www.deloitte.com/in/en/about/press-room/indias-fitness-market-to-double-by-2030-per-a-deloitte-and-hfa-report.html) |
| Number of fitness centres, 2024 | 46,500+ | Same |
| Members, 2024 | 12.3 million | Same |
| Growth forecast | About 15% CAGR to 2030; about ₹37,700 crore by 2030 | [Tribune India](https://www.tribuneindia.com/news/cagr/indias-fitness-industry-to-more-than-double-by-2030-reaching-rs-37700-cr-with-15-cagr-report) |
| Penetration | Under 1% of Indians hold a gym or studio membership | [HFA](https://www.healthandfitness.org/?p=4222) |
| Alternative 2025 estimate | USD 2,232 million | [Ken Research](https://www.kenresearch.com/industry-reports/india-fitness-market.md) |

### TAM / SAM / SOM (estimate)

| Layer | Calculation | Value |
|---|---|---|
| TAM (software spend) | 46,500 centres × ₹2,000/month × 12 | About ₹112 crore per year (estimate) |
| SAM | Independent gyms and studios with 100+ members, about 60% of centres (estimate) = 27,900 × ₹1,900 × 12 | About ₹64 crore per year (estimate) |
| SOM (3 years) | 1,500 gyms (about 5% of SAM) × ₹1,900 × 12 | About ₹3.4 crore ARR (estimate) |

Reasoning: the HFA count covers commercial facilities only; many small gyms and studios are unregistered, so actual centre count is likely higher (estimate).

## Retention benchmarks (why churn alerts sell)

| Finding | Source |
|---|---|
| 45% of new clients cancel within 90 days (Wodify, pre-pandemic CrossFit data) | [BarBend](https://barbend.com/wodify-blog-series-reveals-45-of-members-quit-after-90-days) |
| Nearly 1 in 5 new members gone by day 90 (Gymdesk benchmark, 4,594 gyms, mostly martial arts) | [Gymdesk](https://gymdesk.com/blog/gym-retention-rate-benchmarks) |
| Retention climbs between first and fourth visit, holds above 90% after the fifth (Xplor Mariana Tek, via Gymdesk) | [Gymdesk "5th-class cliff"](https://gymdesk.com/blog/5th-class-cliff-gym-member-retention) |
| Average annual member retention 66.4% (HFA benchmark) | [Glofox](https://www.glofox.com/blog/increase-gym-member-retention) |

Product implication: the "first five visits" rule is our first churn rule. A new member with fewer than 4 check-ins in 30 days is flagged.

## Competitors

### India

| Competitor | Positioning | Public price | Source |
|---|---|---|---|
| FitnessForce | Established Indian club software, mid-to-large gyms | About ₹1,500/month on Techjockey; $99/month flat on Capterra | [Capterra India](https://www.capterra.in/software/128172/fitnessforce), [Capterra](https://www.capterra.com/p/128172/FitnessForce/) |
| Wellyx | Global/India gym and studio suite | $79–$149/month (TrustRadius) or $99–$299/month (Software Advice); official page says contact sales | [TrustRadius](https://www.trustradius.com/products/wellyx-gym/pricing), [Software Advice](https://www.softwareadvice.com/club-management/wellyx-profile/) |
| Traqade (Gympik) | Indian gym management | ₹12,000/year Standard, ₹18,000/year Advanced | [Techjockey](https://techjockey.com/blog/gymmaster-vs-gympik-vs-apptofit/amp) |
| AppToFit | Low-cost Indian gym app | ₹5,999/year Gold; ₹11,999/year Premium | Same |
| MyGymDesk | Low-cost Indian tool | From ₹809–829/month (annual billing) | [Capterra India](https://www.capterra.in/software/1095613/MyGymDesk) |
| Fitnexa | Indian gym SaaS | ₹999/month Starter, excl. 18% GST | [Capterra India](https://www.capterra.in/software/1323534/Fitnexa) |
| Gymate | Indian gym software | From ₹1,999 | [Techjockey](https://www.techjockey.com/detail/gymate-gym-software) |
| GymSmart | Indian gym software | From ₹9,999 | [Capterra India directory](https://www.capterra.in/directory/33276/gym-management/software) |
| Gymnetic, Fitday | Indian gym apps | No public pricing found | Searches on 2026-11-24 returned no price |

General band: Indian gym software ranges about ₹1,000 to ₹25,000+ per month by size and features, per a vendor guide ([EasyGymSoftware](https://easygymsoftware.com/blog/gym-software-pricing-in-india)).

### Global

| Competitor | Positioning | Public price | Source |
|---|---|---|---|
| Gymdesk | Independent gyms, martial arts | $75–$200/month by member count | [G2](https://www.g2.com/products/martial-arts-on-rails/pricing) |
| ABC Glofox | Boutique studios, branded app | Not published; about $80–$190/month in a competitor table, $110+ in others | [Gymdesk comparison](https://gymdesk.com/blog/best-gym-management-software), [Wodify](https://www.wodify.com/blog/glofox-pricing) |
| Mindbody | Studios, marketplace | Not published; demo required | [Mindbody](https://www.mindbodyonline.com/business/education/blog/2026-studio-software-comparison-mindbody-vs-glofox) |
| Zenoti | Enterprise wellness, chains | From $400 (contact vendor) | [Capterra India](https://www.capterra.in/software/131057/zenoti) |
| TeamUp | Boutique studios | About $99/month | [Zenoti guide](https://www.zenoti.com/thecheckin/best-fitness-gym-software-2026) |

### Positioning map

| | Low price (under ₹1,500) | Mid (₹1,500–₹5,000) | High (₹5,000+ / global) |
|---|---|---|---|
| Record-keeping only | AppToFit, MyGymDesk, Fitnexa | Traqade | |
| Growth outcomes (leads, churn, WhatsApp) | **RepVault Starter** | **RepVault Growth/Pro** | Glofox, Mindbody, Zenoti, Wellyx |

**Differentiation:** Cheap Indian tools record members; global tools grow members but cost ₹7,000–₹35,000 per month and are not WhatsApp/UPI-native. RepVault sells growth outcomes at Indian prices: trial QR lead capture, attendance-based churn rescue, and WhatsApp renewals with UPI.

## Trends 2024–2026

| Trend | Implication | Source |
|---|---|---|
| Fitness market to double by 2030 | Many new gyms opening each year need software from day one | [Deloitte/HFA](https://www.deloitte.com/in/en/about/press-room/indias-fitness-market-to-double-by-2030-per-a-deloitte-and-hfa-report.html) |
| Gym GST reported cut to 5% (no ITC) from 22 Sep 2025 | Lower membership prices, more price-sensitive members joining; gyms need correct invoices | [TaxAJ](https://www.taxaj.com/learn/gst-sports-fitness-coaching-services/), [Outlook Business](https://www.outlookbusiness.com/amp/story/explainers/how-gst-20-brings-fitness-boom-to-price-sensitive-indians) |
| WhatsApp moved to per-message pricing from 1 Jul 2025 | Utility reminders are cheap; marketing is about 7.5x costlier; design flows around utility templates | [Meta](https://developers.facebook.com/docs/whatsapp/pricing) |
| UPI dominance for payments | Payment links beat card on file; e-mandate for auto-renew later | (estimate, common practice) |
| Boutique formats (yoga, functional, dance, MMA) growing | Need class booking and batch management | (estimate) |

## Regulation

| Area | Rule | What RepVault does | Source |
|---|---|---|---|
| Data protection | DPDP Act 2023; DPDP Rules notified 13–14 Nov 2025; consent manager rules after 12 months; main obligations (notice, consent, security, breach reporting, children) after 18 months, about May 2027 | Consent capture with notice at trial QR and member signup; purpose tags; opt-out link; deletion on request; breach log | [PIB](https://static.pib.gov.in/WriteReadData/specificdocs/documents/2025/nov/doc20251117695301.pdf), [Storyboard18](https://www.storyboard18.com/amp/digital/breaking-govt-notifies-final-dpdp-rules-sets-staggered-rollout-with-key-obligations-for-data-fiduciaries-84201.htm), [Mondaq/AZB](https://webiis10.mondaq.com/india/data-protection/1706878/indias-digital-personal-data-protection-act-phased-rollout-and-key-compliance-milestones) |
| Children's data | DPDP requires verifiable parental consent for under-18s | Guardian consent flow for kids' martial-arts/dance batches | Same |
| Penalties | Up to ₹250 crore per breach category under the Act | Compliance by default is a sales point | [BDO India](https://www.bdo.in/en-gb/news/2025/digital-personal-data-protection-rules-2025-%E2%80%94-check-provisions,-implementation-plan,-penalties) |
| GST on memberships | 5% without ITC from 22 Sep 2025 per several tax sites; some pages still say 18% | Configurable GST per plan; CA sign-off | [TaxAJ](https://www.taxaj.com/learn/gst-sports-fitness-coaching-services/) |
| GST on our SaaS fee | 18% on software services (estimate, standard SaaS treatment) | Price lists exclude GST | (estimate) |
| WhatsApp | Opt-in required; marketing vs utility template categories; per-message billing; 24-hour free service window | Utility for reminders; marketing only to opted-in members | [Meta](https://developers.facebook.com/docs/whatsapp/pricing), [MyOperator](https://support.myoperator.com/portal/en/kb/articles/whatsapp-has-shifted-to-per-message-pricing-effective-july-1-2025-based-on-message-categories-and-your-recipient-s-country-in-india-there-are-three-paid-categories) |

## Owner pain points (from articles and vendor content)

1. Renewals run through a mix of WhatsApp, cash and UPI; manual follow-up is late or inconsistent ([Innoviti](https://innoviti.com/blogs/how-gyms-and-fitness-studios-can-reduce-payment-failures-and-revenue-leakage/)).
2. Register/Excel/WhatsApp works until the gym gets busy, then follow-ups break (vendor content, same search set; treat as indicative).
3. Losses are front-loaded in the first 60–90 days ([Gymdesk](https://gymdesk.com/blog/gym-retention-rate-benchmarks)).
4. Global tools require demos and hide pricing, which Indian owners distrust ([Mindbody](https://www.mindbodyonline.com/business/education/blog/2026-studio-software-comparison-mindbody-vs-glofox)).

Caveat: no independent academic study of Indian independent gyms was found. Validate pain ranking in the first 30 owner interviews.

## Sources

All accessed 2026-11-24. Links listed inline above.
