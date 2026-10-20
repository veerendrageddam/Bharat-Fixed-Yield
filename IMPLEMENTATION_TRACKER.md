# Bharat Fixed Yield (BFY) — Implementation & Task Tracker

> **Core Engineering Principle**: Build the simplest production-quality solution that satisfies current requirements, making deliberate decisions about maintainability, security, performance, scalability, UX, and future change.

Last Updated: **2026-10-20**  
Status: **Production Ready (Phase 1–5 Complete)**

---

## 📊 High-Level Status Dashboard

| Milestone | Target Scope | Status | Progress | Est. Completion |
|---|---|:---:|:---:|---|
| **Phase 1: Math & Domain Engine** | RBI RD Formula, Quarterly Compounding, TDS 194A/80TTB | `COMPLETED` | 100% | Completed |
| **Phase 2: Compliance & Security** | Purge Aadhaar/PAN from BookingModal, Safe Bank Redirects | `COMPLETED` | 100% | Completed |
| **Phase 3: Unified Command Center** | Single-Screen UX, Reactive Sliders, Donut & Area Charts | `COMPLETED` | 100% | Completed |
| **Phase 4: Personalization Engine** | Multi-Tenure Rate Tables, State/Jurisdiction, Women Bonus | `COMPLETED` | 100% | Completed |
| **Phase 5: Build & Production Quality** | Clean Types, Vite Build Verification, Dependency Sanitization | `COMPLETED` | 100% | Completed |
| **Phase 6: Custom % & Odd-Day Schemes** | Custom Rate Targets, 222D–1001D Schemes, RBI Odd-Day Math | `COMPLETED` | 100% | Completed |
| **Phase 7: GitOps Automated Rate Pipeline** | Weekly GHA Cron, Live Bank Scraper, Decoupled `rates.json` | `COMPLETED` | 100% | Completed |

---

## 🛠️ Detailed Task Breakdown & Tracking

### Phase 1: Core Mathematical Engine & Domain Logic
*Target Files*: [`src/utils/calculator.ts`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/src/utils/calculator.ts), [`src/types/bank.ts`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/src/types/bank.ts)

- [x] **1.1 Recurring Deposit (RD) Compounding Formula** `[COMPLETED]`
  - Implemented RBI-compliant installment compounding:
    $$A = \sum_{k=1}^{n} M \left(1 + \frac{r}{400}\right)^{4 \times \frac{n - k + 1}{12}}$$
  - Supported monthly deposit amounts ($M$) vs. cumulative investment ($M \times n$).
  - Separated `calculateFDYield()` and `calculateRDYield()`, unified under polymorphic `calculateYield()`.
- [x] **1.2 Dynamic Input & Label Switching** `[COMPLETED]`
  - Updated `UserPersona` to clearly distinguish `depositType: 'FD'` vs `'RD'`.
  - When in RD mode, dynamic labels switch from *"Principal Deposit Sum"* to *"Monthly Installment"*.
  - Calculation summaries display both *"Total Amount Deposited"* and *"Net Maturity Payout"*.
- [x] **1.3 Statutory TDS & Exemption Logic (Sec 194A / 80TTB)** `[COMPLETED]`
  - General Citizens (<60): ₹40,000 annual interest threshold.
  - Senior Citizens (60+): ₹50,000 threshold under Section 80TTB.
  - Form 15G/15H toggle zeroing out withholding tax calculations (10% standard PAN, 20% non-PAN).

---

### Phase 2: Compliance & Security Hardening
*Target Files*: [`src/components/BookingModal.tsx`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/src/components/BookingModal.tsx)

- [x] **2.1 Eradicate Aadhaar & PAN Card Data Collection** `[COMPLETED]`
  - Removed fake paperless KYC fields requesting 12-digit Aadhaar & PAN strings.
  - Ensured zero PII or biometric/identity tokens are stored or handled in memory/state (DPDP Act 2023 compliance).
- [x] **2.2 Official Bank Deep-Link Redirection Portal** `[COMPLETED]`
  - Replaced mock payment flow with verified bank routing:
    - Button: *"Proceed to Official [Bank Name] Portal"* (e.g., SBI YONO, HDFC NetBanking, Unity SFB Digital FD).
    - Opens official secure portal in new tab with `target="_blank" rel="noopener noreferrer"`.
    - Added one-click copyable rate checklist and deposit token.
    - Added compliant Assisted Bank Callback option with explicit DPDP digital consent.
- [x] **2.3 DICGC Insurance & Statutory Disclaimers** `[COMPLETED]`
  - Added explicit statutory badges: *"Covered up to ₹5,00,000 per depositor by DICGC (RBI Subsidiary)"*.
  - Displayed bank registration and scheduled commercial bank classification tags.

---

### Phase 3: Unified "Yield Command Center" & Rich Visualizations
*Target Files*: [`src/components/YieldCommandCenter.tsx`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/src/components/YieldCommandCenter.tsx), [`src/App.tsx`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/src/App.tsx), [`src/components/Header.tsx`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/src/components/Header.tsx)

- [x] **3.1 Single-Tab UX Unification** `[COMPLETED]`
  - Eliminated the jarring two-screen split between "Calculator" and "Live Comparisons".
  - Created a cohesive single-page **Yield Command Center**:
    - **Header/Top**: Interactive dual-mode (FD/RD) sliders, presets, and persona toggles.
    - **Middle**: Real-time Visual Analytics (Donut, Compounding Area curve, Rate Spread bar).
    - **Bottom**: Reactive Bank Leaderboard.
- [x] **3.2 Interactive Wealth Visualizations** `[COMPLETED]`
  - **Donut / Radial Chart**: Principal Deposited vs. Wealth Created (Interest Gain) with percentage breakdown.
  - **Compounding Trajectory Area Chart**: Dynamic quarterly growth curve tracking balance over tenure.
  - **Bank Rate Spread Bar**: Visual representation comparing rates across SFB, Private, PSU, and Repo benchmark.
- [x] **3.3 Zero-Latency Reactive Filtering** `[COMPLETED]`
  - Sliders and chips reactively recalculate yields and resort the bank leaderboard without page reloads.

---

### Phase 4: Dynamic Personalization & Multi-Tenure Rate Matrix
*Target Files*: [`src/data/bankData.ts`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/src/data/bankData.ts), [`src/types/bank.ts`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/src/types/bank.ts)

- [x] **4.1 Multi-Tenure Rate Matrix Schema** `[COMPLETED]`
  - Expanded bank records to include comprehensive tenure matrix:
    - 1 Year (12 Months)
    - 2 Years (24 Months)
    - 3 Years (36 Months)
    - 5 Years (60 Months - Tax Saver 80C)
    - Special High-Yield Tenures (e.g., 400 Days, 444 Days, 1001 Days)
- [x] **4.2 All 28 States & 8 Union Territories + Regional Rural Banks (RRBs)** `[COMPLETED]`
  - Added centralized [`src/data/jurisdictions.ts`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/src/data/jurisdictions.ts) containing all 28 States, 8 Union Territories, and Pan-India option with categorized `<optgroup>` rendering.
  - Added dedicated `'rrb'` bank category with state government sponsorship badges (e.g. *Andhra Pragathi Grameena Bank / APGB*, *APGVB*, *Telangana Grameena Bank / TGB*, *Kerala Gramin Bank*, *Karnataka Gramin Bank*, *Maharashtra Gramin Bank*, *Baroda Gujarat Gramin Bank*, *Aryavart Bank UP*, *J&K Grameen Bank*).
  - Ensured 100% DICGC ₹5,00,000 statutory deposit insurance coverage clarity for all regional and cooperative institutions.
- [x] **4.3 Gender-Specific Special Rates** `[COMPLETED]`
  - Wired up `persona.gender === 'female'` to activate:
    - Mahila Samman Savings Certificate (MSSC) benchmark.
    - Women depositor special rate boosts (+0.10% to +0.25% in participating banks).
- [x] **4.4 Age Tiers** `[COMPLETED]`
  - General (<60): Standard card rate.
  - Senior (60–79): Standard + 0.50% statutory premium.
  - Super Senior (80+): Additional +0.75% to +0.80% premium in eligible lenders.

---

### Phase 5: Build Integrity & Production Quality Gates
*Target Files*: [`package.json`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/package.json), [`vite.config.ts`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/vite.config.ts)

- [x] **5.1 Production Dependency Sanitization** `[COMPLETED]`
  - Installed stable production Vite 6 & standard React plugin, eliminating rolldown experimental native binding crashes.
  - Removed 79 unused packages (express, dotenv, @types/express) from frontend `package.json`.
  - Added Recharts for accessible, lightweight SVG charts.
- [x] **5.2 TypeScript Verification** `[COMPLETED]`
  - `npm run lint` (`tsc --noEmit`) passes with 0 errors.
  - `npm run build` generates production bundle cleanly in ~2s.
- [x] **5.3 Mobile & Accessibility (a11y) Verification** `[COMPLETED]`
  - Touch target sizing (minimum 44x44px for sliders, controls, and chips).
  - High-contrast text labels for senior citizen usability.
  - End-to-end verified via browser subagent.

---

### Phase 6: Custom Percentage Yield Modeling & Special Bank Schemes (Odd Days)
*Target Files*: [`src/components/YieldCommandCenter.tsx`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/src/components/YieldCommandCenter.tsx), [`src/utils/calculator.ts`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/src/utils/calculator.ts), [`src/data/bankData.ts`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/src/data/bankData.ts), [`src/types/bank.ts`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/src/types/bank.ts)

- [x] **6.1 Custom Percentage Interest Rate Calculator** `[COMPLETED]`
  - Allows users to enter any custom percentage rate (e.g. `8.25%`, `8.50%`) with `+0.10%` / `-0.10%` steppers, direct numeric input, slider (4.00%–12.00%), and quick target pills (`7.00%` through `9.50%`).
  - Active custom percentage dynamically recalculates all maturity projections, wealth split donut charts, compounding trajectory curves, and rate spread benchmark charts.
  - Live feedback informs user how many banks in their state meet or exceed their target rate.
  - Bank leaderboard cards display real-time comparison badges (e.g. `+0.40% vs target` or `-0.50% vs target`).
- [x] **6.2 Special Bank Schemes with Odd-Day Tenures (222D, 399D, 444D, 555D, 777D, 1001D)** `[COMPLETED]`
  - Standardized odd-day quarterly compounding per RBI Master Directions:
    $$A = P\left(1 + \frac{r}{400}\right)^{4 \times \frac{D}{365}}$$
  - Populated actual special promotional schemes in `bankData.ts`:
    - **SBI Amrit Vrishti** (444 Days @ 7.25%, Seniors 7.75%)
    - **SBI Amrit Kalash** (400 Days @ 7.10%)
    - **Bank of Baroda Tiranga Plus** (399 Days @ 7.25%)
    - **Punjab National Bank Uttam** (400 Days @ 7.25%)
    - **Andhra Pragathi Grameena Bank Pragathi 444** (444 Days @ 7.65%)
    - **Equitas SFB** (444 Days @ 8.15%, 888 Days @ 8.05%)
    - **Utkarsh SFB** (777 Days @ 8.15%, 1500 Days @ 8.25%)
    - **Suryoday SFB** (732 Days @ 8.25%)
    - **Unity SFB** (1001 Days @ 8.40%, 501 Days @ 8.25%)
  - Interactive "Special Schemes (Odd Days)" selector tab with quick chips and a custom day numeric input (`[ 444 ] Days`).
  - Matched special scheme badges displayed on bank cards when odd-day tenures are selected.

---

### Phase 7: GitOps Automated Rate Ingestion Pipeline via GitHub Actions
*Target Files*: [`.github/workflows/update-rates.yml`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/.github/workflows/update-rates.yml), [`scripts/sync-rates.ts`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/scripts/sync-rates.ts), [`src/data/rates.json`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/src/data/rates.json), [`src/data/bankData.ts`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/src/data/bankData.ts)

- [x] **7.1 Decoupled Rates Storage Schema (`src/data/rates.json`)** `[COMPLETED]`
  - Extracted volatile rate cards into a versioned, timestamped JSON document with source tracking and verified audit timestamps.
  - Implemented dynamic hydration in `bankData.ts` overlaying scraped rates onto static bank metadata with immutable defaults.
  - Corrected Telangana Grameena Bank (TGB) live rate matrix from official circulars (1Y: 6.45%, 2Y: 6.45%, 3Y: 6.50%, 5Y: 7.00%, 444D: 7.40%, 1000D: 7.50%).
- [x] **7.2 Rate Synchronization Engine (`scripts/sync-rates.ts`)** `[COMPLETED]`
  - Built an extensible TypeScript scraper using Cheerio and native `fetch` with realistic browser headers and timeouts.
  - Implemented financial sanity bounds validation (`3.00% <= rate <= 11.50%`) preventing corrupted rates on upstream DOM layout changes.
  - Automated diff detection ensuring clean, idempotent writes and avoiding false-positive commits.
  - Emits formatted GitHub Actions Step Summaries (`$GITHUB_STEP_SUMMARY`) for auditability.
- [x] **7.3 Scheduled GitHub Actions Workflow (`.github/workflows/update-rates.yml`)** `[COMPLETED]`
  - Configured weekly cron schedule (`0 2 * * 1` = Mondays at 02:00 UTC / 07:30 AM IST).
  - Added manual `workflow_dispatch` trigger for immediate one-click execution upon RBI Monetary Policy announcements.
  - Configured least-privilege permissions (`contents: write`) with automatic bot commit (`[skip ci]`) when rates change.
- [x] **7.4 Live Verification Trust Badge in UI** `[COMPLETED]`
  - Added an interactive live rate verification banner in `YieldCommandCenter.tsx` showcasing active automated tracking and the exact verification date.

---

## 📝 Execution Log & Updates

| Date & Time | Step | Action Taken | Result / Notes |
|---|---|---|---|
| **2026-10-20** | Init | Created detailed Implementation Tracker | Architecture plan aligned with full-stack standards |
| **2026-10-20** | Phase 1 | Implemented RBI RD & FD compounding formulas and TDS in `calculator.ts` | Closed mathematical precision with quarterly compounding |
| **2026-10-20** | Phase 2 | Hardened `BookingModal.tsx` for DPDP Act 2023 compliance | Purged Aadhaar/PAN; replaced with verified official bank deep-links |
| **2026-10-20** | Phase 3 | Built `YieldCommandCenter.tsx` with Recharts and single-screen UX | Single tab combining FD/RD calculators + charts + live leaderboard |
| **2026-10-20** | Phase 4 | Expanded `bankData.ts` and `bank.ts` with multi-tenure rates, states & women bonus | Dynamic personalized rate resolution across tenures and categories |
| **2026-10-20** | Phase 5 | Upgraded to stable Vite 6, purged express, verified `lint` and `build` | 0 lint errors, clean Vite production build in ~2s, verified via browser |
| **2026-10-20** | Phase 6 | Implemented Custom Rate Target Modeling & Special Odd-Day Schemes (222D–1001D) | RBI fractional quarterly compounding, custom % slider/steppers, browser verified |
| **2026-10-20** | Phase 7 | Built GitOps Automated Rate Pipeline with GHA Cron & Live Scraper | Live TGB rate verified, decoupled `rates.json`, weekly GHA cron, zero backend |


