# Bharat Fixed Yield (BFY) — Production Readiness & Architecture Blueprint

> **Governing Principle**: Build the simplest production-quality solution that satisfies the current requirements, while making deliberate decisions about maintainability, security, performance, scalability, UX, and future change.

---

## 1. Executive Summary & Current Architecture Audit

Bharat Fixed Yield is designed to be an **RBI/DICGC-indexed yield comparison platform and calculator** for Indian fixed-income depositors (Fixed Deposits & Recurring Deposits).

### Current State (Prototype / Demo)
- **Frontend**: Vite + React 19 + Tailwind CSS v4 SPA.
- **Data Layer**: Hardcoded in-memory array (`src/data/bankData.ts`) with only 8 banks locked to 36-month tenures.
- **Backend / APIs**: No backend currently running (Express packages in `package.json` are unused; no endpoints exist).
- **Navigation Model**: Fractured UX where "Rate Finder & Calculator" and "Live Bank Comparisons" are separate tabs requiring cross-screen toggling.
- **Visuals**: Static CSS progress bars; no real interactive data visualization charts.

---

## 2. Issues & Technical Gaps to Fix Before Going Live

### A. Core Mathematical & Domain Calculation Flaws
1. **Broken Recurring Deposit (RD) Calculation**:
   - **Current Flaw**: In `src/utils/calculator.ts` and `src/components/CalculatorScreen.tsx`, selecting `depositType: 'RD'` still runs `calculateYield()`, which calculates single-lump-sum FD quarterly compound interest ($A = P(1 + r/400)^{4t}$).
   - **Indian Banking / RBI Standard**: An RD is a sequence of monthly installments $M$ over $n$ months, where each installment compounds quarterly until maturity:
     $$A = \sum_{k=1}^{n} M \left(1 + \frac{r}{400}\right)^{4 \times \frac{n - k + 1}{12}}$$
   - **UI Disconnect**: Total invested in an RD is $M \times n$. The UI must prompt for "Monthly Installment" rather than "Principal Deposit Sum" when in RD mode.
2. **Quarterly Compounding Standards**:
   - FD cumulative deposits compound every calendar quarter (March 31, June 30, September 30, December 31) under RBI Master Direction on Interest Rates.
   - Non-cumulative option (monthly/quarterly interest payout to savings accounts) must be calculated accurately at discounted monthly yields.
3. **Tax & TDS Logic (Section 194A, 80TTA, 80TTB, Form 15G/15H)**:
   - General Citizens: ₹40,000 threshold for TDS under Section 194A.
   - Senior Citizens: ₹50,000 threshold under Section 194A and Section 80TTB deduction.
   - Non-PAN deduction rate (20%) vs. linked PAN rate (10%).

---

### B. User Experience & Tab Unification
* **Main Motto Requirement**: *"User should get RD and FD calculators in one tab and Top RD and FD options available to them based on realtime data... in graphical representation."*
* **Fix Required**:
  - Replace the separate "Calculator" and "Comparisons" tabs with a single **Unified Yield Command Center**.
  - **Top Section**: Instant dual-mode (FD / RD) calculator controls (Principal/Monthly Installment slider, Tenure selector, Age, Gender, State).
  - **Middle Section**: **Rich Interactive Visualizations**:
    - **Principal vs. Wealth Gain**: Donut / Radial chart showing user investment vs. interest earnings.
    - **Maturity Growth Timeline**: Interactive line/area chart tracking cumulative balance over quarters/months.
    - **Top Bank Yield Comparison**: Horizontal bar chart comparing maturity yields across RBI-trusted institutions.
  - **Bottom Section**: Real-time **Leaderboard of Matching Banks** that reactively updates as inputs change, without page reloads.

---

### C. Personalization Engine: Age, Gender, and Location
1. **Age Tiers**:
   - General Depositors (<60 years): Standard Card Rate.
   - Senior Citizens (60–79 years): +0.50% statutory rate bonus.
   - Super Senior Citizens (80+ years): +0.75% to +0.80% in select banks (e.g., SBI, PNB, Indian Bank).
2. **Gender-Specific Offerings**:
   - Currently, `persona.gender` exists in state but has zero effect on calculations.
   - Needs inclusion of women-specific rate boosts (0.10% – 0.25% premium offered by specific banks) and central initiatives like **Mahila Samman Savings Certificate (MSSC)**.
3. **Location & State-Specific Bank Availability**:
   - Currently, `persona.state` does not filter banks.
   - Scheduled Urban Co-operative Banks (e.g., Saraswat Bank, SVC Bank, Cosmos Bank) and Regional Rural Banks (RRBs) are jurisdiction-specific.
   - The engine must filter rates by `bank.operatingStates.includes(user.state) || bank.isPanIndia`.

---

### D. Critical Compliance & Security Hazards
1. **Mock Aadhaar & PAN Collection in `BookingModal.tsx`**:
   - Collecting or handling Aadhaar numbers without a UIDAI license, Aadhaar Data Vault, and DPDP Act (Digital Personal Data Protection Act 2023) compliance carries penalties up to ₹250 Crores and criminal liability.
   - **Production Resolution**: As a yield comparator/aggregator, the app must **never store raw Aadhaar/PAN**.
   - **Permissible Models**:
     - **Verified Bank Redirection / Deep Linking**: Direct the user to the official netbanking/mobile banking portal of the selected bank.
     - **Branch Contact / Lead Generation**: Collect only verified Name, Mobile Number, and City with explicit digital consent.
     - **Licensed FinTech SDK**: Integrate authorized digital FD partners (e.g., Setu, Tartan, Finzly) that manage e-KYC compliance natively.

---

### E. Data Pipeline: Static Data to Real-Time Rates
* **Current Flaw**: 8 static banks hardcoded in a single file with one tenure (36 months).
* **Production Resolution**:
  - Structured schema storing multiple tenure buckets per bank:
    - 7 to 14 days, 15 to 45 days, 46 to 90 days, 91 to 179 days, 180 to 364 days.
    - 1 Year, Special Tenures (e.g., 400 days, 444 days, 555 days, 777 days).
    - 2 Years, 3 Years, 5 Years (Tax Saver 80C).
  - Background crawler / verification worker running daily to track rate card revisions from RBI Scheduled Banks.

---

## 3. Recommended Production Tech Stack & Architectural Analysis

Designed around the **Core Engineering Principle**: *Build the simplest production-quality solution that satisfies current requirements, making deliberate decisions about maintainability, security, performance, scalability, UX, and future change.*

### Architectural Data Realities
1. **Tiny Data Footprint**: ~60–100 banks × ~10 tenure brackets × 3 customer tiers = **~2,000 to 5,000 total rate rows** (~1–2 MB of JSON data).
2. **Extreme Read Dominance**: >99.9% read-to-write ratio. Bank interest rates change only a few times a month (typically following RBI Monetary Policy Committee announcements).
3. **SEO is the Core Growth Vector**: Deposit aggregators depend on organic Google search intent (*"best 1 year FD rates 2026"*, *"SBI senior citizen RD calculator"*). Pure client-side SPAs (Vite) fail to rank compared to pre-rendered SSG/ISR pages.

### Lean Production Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                          CLIENT BROWSER                                │
│       Next.js 15 App (React 19) + Tailwind CSS v4 + Recharts           │
│       - Real-time client-side compounding & tax calculations           │
│       - Reactive sliders & interactive charts without network hops     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS (Fast Edge Hits < 10ms)
┌───────────────────────────────────▼────────────────────────────────────┐
│                  CLOUDFLARE EDGE / VERCEL PLATFORM                     │
│  - Edge Caching (stale-while-revalidate for public rate endpoints)     │
│  - SSG / ISR for Bank SEO Pages (/fd-rates/sbi, /rd-rates/hdfc)        │
│  - Instant cache invalidation via Webhooks on rate revision            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Cache Miss / Nightly Revalidation
                                    ▼
                       ┌─────────────────────────┐
                       │   SUPABASE / NEON       │
                       │ (Serverless PostgreSQL) │
                       │ - Relational integrity  │
                       │ - Auto-pauses on idle   │
                       └────────────▲────────────┘
                                    │ Daily Cron / Rate Upsert
                       ┌────────────┴─────────────┐
                       │ RATE INGESTION WORKER    │
                       │ (GitHub Actions / Cron)  │
                       │ - Crawl Bank Rate Cards  │
                       │ - RBI Scheduled Registry │
                       └──────────────────────────┘
```

### Component Analysis & Deliberate Rationale

| Layer | Selected Technology | Why Chosen & Deliberate Trade-offs | What Was Rejected & Why |
|---|---|---|---|
| **Framework** | **Next.js 15 (App Router)** | **Chosen**: SSG/ISR generates high-ranking static pages for each bank and tenure combination. React 19 hydration allows instant client-side math execution for sliders without API roundtrips.<br>**Trade-off**: Requires Node/Edge build step rather than raw static HTML export. | **Rejected (Pure Vite SPA)**: Client-only rendering yields poor search crawlability for financial comparison keywords, hampering organic discovery. |
| **Styling** | **Tailwind CSS v4** | **Chosen**: Zero-runtime CSS engine with immediate compilation, modern CSS variables, and seamless dark mode. Already established in codebase. | **Rejected (CSS-in-JS like styled-components)**: Causes runtime overhead and hydration mismatches in server components. |
| **Visualizations** | **Recharts** | **Chosen**: Declarative, lightweight SVG rendering, mobile-responsive, accessible tooltips. Perfect for donut and compounding area charts. | **Rejected (Heavy Canvas/D3.js)**: Excessive boilerplate for standard financial curves; larger bundle size. |
| **Database** | **Supabase or Neon (PostgreSQL)** | **Chosen**: Relational model is ideal for structured tenure brackets (`tenure_days BETWEEN x AND y`), multi-state availability filtering, and bank types. Serverless pricing auto-pauses when idle. | **Rejected (DynamoDB / MongoDB)**: Complex range queries across states, ages, and tenures require multiple GSI indexes and composite keys in NoSQL, making queries fragile and expensive. |
| **Cache Layer** | **HTTP Edge CDN & Next.js ISR (No Redis)** | **Chosen**: Entire dataset is ~1–2 MB. Caching at the Edge CDN layer (Cloudflare/Vercel) provides <10ms latency globally with **zero infrastructure overhead and $0 cost**. | **Rejected (Upstash / Redis)**: **Premature optimization**. Introducing an external Redis cache adds a network hop, separate connection management, and an extra vendor bill for static data. |
| **Ingestion Pipeline**| **GitHub Actions Cron Worker** | **Chosen**: 2,000 free minutes/month on private repos. Daily 30-second headless crawler script writes rate diffs to Postgres. Zero persistent servers required. | **Rejected (24/7 EC2 / Celery Worker)**: Waste of budget paying for an idle server that only works for 60 seconds each night. |
| **Hosting & DNS**| **Vercel / Cloudflare Pages + Cloudflare DNS** | **Chosen**: Free SSL, automatic global CDN distribution, DDoS mitigation, continuous Git deployment. | **Rejected (Self-managed VPS/Nginx)**: High manual maintenance (SSL renewals, OS patches, security hardening) for zero added benefit. |

---

## 4. AWS Evaluation: Free Tier vs. Long-Term Cost Reality

Evaluating whether AWS is suitable for Bharat Fixed Yield as an early-stage product:

### The AWS "12-Month Free Tier" Trap
Many developers assume AWS is "free" or cheap, but standard setups incur hidden recurring costs:
1. **The Month-13 Cliff**:
   - AWS Free Tier for EC2 (`t2.micro`/`t3.micro`) and RDS PostgreSQL (`db.t3.micro`) **expires completely after 12 months**.
   - After month 12, a single idle RDS instance costs **~$18 to $25/month** ($216–$300/year).
2. **Hidden Networking & Infra Taxes**:
   - **Public IPv4 Addresses**: AWS charges **$3.65/month** per public IP (introduced Feb 2024).
   - **VPC NAT Gateways**: Placing RDS in a private subnet requires an AWS NAT Gateway, which costs **~$32.40/month minimum** before traffic charges.
   - **Application Load Balancer (ALB)**: Costs **~$16.20/month** just to run custom SSL certificates for containerized services.
3. **Operational Overhead**: Managing IAM roles, security groups, VPC subnets, and database maintenance windows creates unnecessary operational toil for an early-stage product.

### When AWS Makes Sense (The Pragmatic AWS Path)
If AWS is required in the future (for enterprise compliance, startup credits, or ecosystem synergy), the only cost-effective architecture is **Serverless AWS**:
- **Frontend**: AWS CloudFront + S3 (1 TB/month egress is **free forever**).
- **Compute**: AWS Lambda + HTTP API Gateway (1,000,000 requests/month **free forever**).
- **Database**: External Serverless Postgres (Supabase/Neon) OR **AWS Lightsail Database** ($15/month fixed, predictable, zero VPC/NAT charges).

### Cost Comparison Table: Recommended Stack vs. AWS

| Architecture Component | Recommended Lean Stack (Next.js + Supabase) | AWS Standard Setup (EC2 + RDS + ALB) | AWS Serverless Setup (CloudFront + S3 + Lambda) |
|---|---|---|---|
| **Frontend Hosting** | **$0 / mo** (Vercel / Cloudflare) | $3.65+ / mo (IPv4 + EC2) | **$0 / mo** (S3 + CloudFront free tier) |
| **API / Compute** | **$0 / mo** (Next.js Edge / Serverless) | Included in EC2 | **$0 / mo** (Lambda 1M free req/mo) |
| **Database (Year 1)** | **$0 / mo** (Supabase/Neon free tier) | $0 / mo (RDS db.t3.micro) | $0 / mo (Supabase/Neon external) |
| **Database (Year 2+)**| **$0 / mo** (within free tier quotas) | **$18 – $25 / mo** (RDS billing begins) | $0 / mo (within free tier quotas) |
| **Networking & NAT** | **$0 / mo** (Cloudflare Edge) | **$32 – $48 / mo** (NAT Gateway + ALB) | **$0 / mo** (CloudFront edge) |
| **Estimated Year 1 Cost**| **₹0 / month** | **$35 – $50 / mo** (~₹3,000 – ₹4,200/mo) | **$0 / month** |
| **Estimated Year 2+ Cost**| **₹0 – $20 / month** (scales with MAU) | **$65 – $90 / mo** (~₹5,500 – ₹7,500/mo) | **$0 – $15 / month** |

*Conclusion*: Starting with the **Modern Serverless Stack (Vercel + Supabase + Cloudflare)** saves over **₹40,000 – ₹80,000 annually** while delivering better global latency and zero DevOps overhead.

---

## 5. Cost-Effective Hosting & Budget Model (Recommended Stack)

| Service | Tier / Plan | Monthly Cost | Yearly Cost |
|---|---|---|---|
| **Cloudflare** | Free (DNS, Global Edge Caching, SSL, WAF) | $0 | $0 |
| **Vercel / Cloudflare Pages** | Hobby / Standard Free Tier | $0 | $0 |
| **Supabase / Neon** | Free Tier (500 MB Postgres, 50k MAU) | $0 | $0 |
| **GitHub Actions** | Free Tier (2,000 build minutes/month) | $0 | $0 |
| **Domain Name (`.in` / `.com`)** | Standard Registrar | ~₹80 / mo | ~₹999 / year |
| **Total Production Cost** | | **~₹80 / month** | **~₹999 / year** |

*Note: This architecture scales automatically to 100,000+ monthly active users (MAU) before requiring transition to paid tiers (which remain under $25–$50/month).*

---

## 6. Phased Production Implementation Roadmap & Tracking

Detailed tracking and task breakdown is documented in [IMPLEMENTATION_TRACKER.md](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/IMPLEMENTATION_TRACKER.md).

```mermaid
gantt
    title BFY Production Delivery Roadmap
    dateFormat  YYYY-MM-DD
    section Phase 1: Core Engine & Unified UI
    Mathematical Engine (FD & RD compounding) :p1_1, 2026-10-20, 2d
    Unified Single-Tab UI & Interactive Sliders :p1_2, after p1_1, 3d
    Data Visualizations (Donut & Area charts)  :p1_3, after p1_2, 2d
    Removal of Aadhaar/PAN & Safe Bank Portal :p1_4, after p1_3, 1d
    section Phase 2: Dynamic Data & Storage
    Database Schema (Supabase/Neon Postgres)  :p2_1, after p1_4, 3d
    Bank Ingestion & Rate Pipeline            :p2_2, after p2_1, 4d
    State & Gender Filtering Engine           :p2_3, after p2_2, 2d
    section Phase 3: Launch & SEO
    SEO Optimization (SSG / OpenGraph / Sitemaps):p3_1, after p2_3, 3d
    Cloudflare DNS, SSL & Live Deployment     :p3_2, after p3_1, 2d
```

### Active Progress Checklist (See [IMPLEMENTATION_TRACKER.md](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/IMPLEMENTATION_TRACKER.md))
- [x] **Phase 1: Math & Domain Accuracy** `[COMPLETED]`
  - [x] Implemented RBI-compliant RD formula in `calculator.ts` with quarterly compounding of monthly installments.
  - [x] Added dynamic label switching between *"Principal Deposit Sum"* (FD) and *"Monthly Installment"* (RD).
  - [x] Verified Section 194A (₹40k) and Section 80TTB (₹50k senior) TDS thresholds.
- [x] **Phase 2: Compliance & Security Hardening** `[COMPLETED]`
  - [x] Purged mock Aadhaar & PAN collection from `BookingModal.tsx` (DPDP Act 2023 compliance).
  - [x] Replaced with verified official bank redirection deep links (SBI YONO, HDFC NetBanking, APGB, TGB, etc.).
- [x] **Phase 3: Unified "Yield Command Center"** `[COMPLETED]`
  - [x] Merged `CalculatorScreen.tsx` and `LeaderboardScreen.tsx` into a single-screen reactive view.
  - [x] Rendered dynamic Donut Chart (Principal vs Wealth Gain) and Compounding Growth Area Chart.
- [x] **Phase 4: Dynamic Personalization & Multi-Tenure Rates** `[COMPLETED]`
  - [x] Expanded bank data schema with 1Y, 2Y, 3Y, 5Y Tax-Saver rate matrices.
  - [x] Activated State jurisdiction filtering and Women depositor bonuses.
- [x] **Phase 5: Build Integrity & Production Quality** `[COMPLETED]`
  - [x] Sanitized dependencies, verified clean build in ~2s, and tested responsive mobile accessibility.
- [x] **Phase 6: Custom % & Odd-Day Schemes** `[COMPLETED]`
  - [x] Custom percentage target modeling with RBI fractional quarterly compounding.
- [x] **Phase 7: GitOps Automated Rate Pipeline** `[COMPLETED]`
  - [x] Scheduled GitHub Actions weekly cron, live bank scraping, decoupled `rates.json`.
- [x] **Phase 8: Bank Consolidation & Zero-Hardcode Ingestion Architecture** `[COMPLETED]`
  - [x] Purged all hardcoded rates from TypeScript files; `src/data/rates.json` is the sole source of truth populated via `scripts/sync-rates.ts`.
  - [x] Modeled APGVB bifurcation into Telangana Grameena Bank (TGB, `https://tgb.bank.in/`) and Andhra Pradesh Grameena Bank (APGB, `https://apgb.bank.in/`).
  - [x] Built live scrapers for both APGB and TGB deposit cards.
  - [x] Added smart amalgamation search in `YieldCommandCenter.tsx` with merger guidance banner.

