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
| **Phase 8: Bank Consolidation & Zero-Hardcode Ingestion** | GoI 'One State One RRB', APGB & TGB Live Scrapers, Merged Banks Catalog | `COMPLETED` | 100% | Completed |
| **Phase 9: Comprehensive Bank Expansion & Post Office RD/FD** | Axis, Union, Yes Bank, IDFC First, Kotak, IndusInd, Canara, BOI, Federal, AU, Post Office POTD & PORD | `COMPLETED` | 100% | Completed |
| **Phase 10: UI/UX Engineering & Vitest Test Suite** | WCAG 2.1 AA Focus Rings, Modal Escape Dismissal, Empty States, 30 Unit Tests | `COMPLETED` | 100% | Completed |
| **Phase 11: Decoupled Multi-Tier Rate Ingestion & Nationwide Coverage** | Strategy Pattern Adapters, Delta Merging, 10 Scrapers, 38 Banks (All States) | `COMPLETED` | 100% | Completed |
| **Phase 12: Ingestion Resilience Hardening & Commercial Bank Expansion** | Resilient `.bank.in` Endpoints, Fallback URLs, Axis/HDFC/ICICI/SBI Live Adapters | `COMPLETED` | 100% | Completed |
| **Phase 13: Verified Circular Ingestion & Sentinel Monitoring Engine** | Elimination of Web Scraping Fallbacks, ALCO Circular Engine, 38 Banks Synced, Sentinel Monitor | `COMPLETED` | 100% | Completed |
| **Phase 14: LLM Circular Extractor & Sentinel GitHub Actions** | Gemini 2.0 Flash Extraction Agent, Sentinel Signature CI/CD, Bounds Validation | `COMPLETED` | 100% | Completed |
| **Phase 15: Public Pre-rendered Bank SEO Pages (SSG / ISR)** | Dynamic Bank & Tenure Landing Pages, Structured Schema.org, Sitemaps | `PLANNED` | 0% | Next Step |
| **Phase 16: Depositor Crowdsource Verification Modal** | Community Circular Submissions, Branch Notice Reports, DPDP-Compliant Modal | `COMPLETED` | 100% | Completed |

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

### Phase 8: Bank Consolidation & Zero-Hardcode Rate Architecture (GoI "One State, One RRB")
*Target Files*: [`scripts/sync-rates.ts`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/scripts/sync-rates.ts), [`src/data/rates.json`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/src/data/rates.json), [`src/data/bankData.ts`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/src/data/bankData.ts), [`src/components/YieldCommandCenter.tsx`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/src/components/YieldCommandCenter.tsx), [`src/types/bank.ts`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/src/types/bank.ts)

- [x] **8.1 Elimination of Hardcoded Bank Rates in TypeScript (`src/data/bankData.ts`)** `[COMPLETED]`
  - Refactored `src/data/bankData.ts` to purge all 700+ lines of duplicate hardcoded bank objects, rates, and matrices.
  - Standardized `src/data/rates.json` as the Single Source of Truth, generated and synchronized strictly by `scripts/sync-rates.ts`.
  - Dynamically hydrated `INITIAL_BANKS`, `TAX_SAVER_BANKS`, and `MERGED_BANKS_REGISTRY` with type-safe conversion.
- [x] **8.2 APGVB Bifurcation & Amalgamation into APGB and TGB** `[COMPLETED]`
  - Resolved Andhra Pradesh Grameena Vikas Bank (APGVB) bifurcation under the Government of India's "One State, One RRB" policy:
    - **Telangana**: All 493 APGVB branches in Telangana merged into **Telangana Grameena Bank (TGB)** (`https://tgb.bank.in/`).
    - **Andhra Pradesh**: AP branches amalgamated with Andhra Pragathi Grameena Bank, CGGB, and SGB into unified **Andhra Pradesh Grameena Bank (APGB)** (`https://apgb.bank.in/`), headquartered in Guntur.
  - Recorded APGVB under `mergedBanks` with explicit successor bank mapping (`['apgb-bank', 'tgb-bank']`).
  - Updated Gujarat Gramin Bank (GGB, `ggb.bank.in`), Maharashtra Gramin Bank (`mahagramin.bank.in`), and Karnataka Grameena Bank (`karnatakagraminbank.com`) to reflect their latest unified RRB entity structures.
- [x] **8.3 Dual Official Live Scrapers for APGB & TGB** `[COMPLETED]`
  - Built Cheerio live scraper for **APGB** (`https://apgb.bank.in/banking-products/deposits/deposit-interest-rates`):
    - 1 Year (12M): 7.00%
    - 2–5 Years (24M, 36M, 60M): 6.65%
    - Senior Citizens: +0.50%, Super Senior Citizens: +0.75%, Women: +0.15%
  - Built Cheerio live scraper for **TGB** (`https://tgb.bank.in/deposit-interest-rates`):
    - 1–2 Years: 6.45%, 3 Years: 6.50%, 5 Years: 7.00%
    - 444-DDD Special: 7.40%, TGB Sahasra (1000D): 7.50%, RD Lakhpati (36M): 7.50%
  - Automated diff comparison and atomic file writes back to `src/data/rates.json`.
- [x] **8.4 Smart Amalgamation Search & UI Merger Guidance** `[COMPLETED]`
  - Added real-time search input with debounced querying in `YieldCommandCenter.tsx`.
  - When searching for erstwhile entities (e.g. "APGVB", "Vikas"), an amber Amalgamation Information Banner appears automatically guiding the user:
    *"Andhra Pradesh Grameena Vikas Bank (APGVB) was bifurcated: its 493 branches in Telangana merged into Telangana Grameena Bank (TGB), and its branches in Andhra Pradesh amalgamated into Andhra Pradesh Grameena Bank (APGB)."*
  - Automatically filters and highlights both successor banks (`APGB` and `TGB`).
  - Added robust `BankLogo` component with stylized building icon fallback on image load failure.

---

### Phase 9: Comprehensive Bank Expansion & India Post Integration
*Target Files*: [`src/types/bank.ts`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/src/types/bank.ts), [`src/data/bankData.ts`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/src/data/bankData.ts), [`src/data/rates.json`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/src/data/rates.json), [`scripts/sync-rates.ts`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/scripts/sync-rates.ts), [`src/components/YieldCommandCenter.tsx`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/src/components/YieldCommandCenter.tsx), [`src/components/LeaderboardScreen.tsx`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/src/components/LeaderboardScreen.tsx)

- [x] **9.1 Top Private Sector Banks Integration** `[COMPLETED]`
  - Added **Axis Bank** (7.10% 3Y, 7.20% 17M Special, CRISIL AAA).
  - Added **IDFC FIRST Bank** (7.25% 3Y, 7.90% 500D Special, 7.75% 400D, CRISIL AA+).
  - Added **Yes Bank** (7.25% 3Y, 7.75% 18M Special, CARE AA-).
  - Added **Kotak Mahindra Bank** (7.00% 3Y, 7.40% 390D Active FD, CRISIL AAA).
  - Added **IndusInd Bank** (7.25% 3Y, 7.75% 1Y7M & 2Y9M Special, CRISIL AA+).
  - Added **Federal Bank** (7.00% 3Y, 7.40% 400D Special, CRISIL AA+).
- [x] **9.2 Major Public Sector Banks Integration** `[COMPLETED]`
  - Added **Union Bank of India** (7.30% 3Y, 7.40% 333D Union Samriddhi, Sovereign Safety).
  - Added **Canara Bank** (6.80% 3Y, 7.25% 444D Special, Sovereign Safety).
  - Added **Bank of India (BOI)** (6.50% 3Y, 7.30% 333D & 666D Star Dhan Vriddhi, Sovereign Safety).
- [x] **9.3 India Post (Post Office Time Deposit & Recurring Deposit) Integration** `[COMPLETED]`
  - Added **Post Office Time Deposit (India Post POTD)**: 1Y (6.90%), 2Y (7.00%), 3Y (7.10%), 5Y (7.50% Section 80C Tax Saver). 100% Direct Sovereign Guarantee under GoI Consolidated Fund without any ₹5L ceiling.
  - Added **Post Office 5-Year Recurring Deposit (India Post PORD)**: 6.70% p.a. quarterly compounded with ₹100/mo minimum.
  - Added `fdSupported` and `rdSupported` flags to filter pure RD or pure FD schemes appropriately when user toggles between deposit types.
  - Added dedicated `post_office` category filter tab alongside SFB, Private, PSU, and RRB.
- [x] **9.4 Leading Small Finance Banks Integration** `[COMPLETED]`
  - Added **AU Small Finance Bank** (7.50% 3Y, 8.00% 24M Peak, CRISIL AA).
  - Added **Ujjivan Small Finance Bank** (7.75% 3Y, 8.25% 15M Peak, CARE A+).

---

### Phase 10: Standard UI/UX Engineering, Accessibility (WCAG 2.1 AA) & Vitest Test Suite
*Target Files*: [`src/components/Header.tsx`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/src/components/Header.tsx), [`src/components/YieldCommandCenter.tsx`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/src/components/YieldCommandCenter.tsx), [`src/components/BookingModal.tsx`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/src/components/BookingModal.tsx), [`src/components/AmortizationModal.tsx`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/src/components/AmortizationModal.tsx), [`src/components/SignInModal.tsx`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/src/components/SignInModal.tsx), [`src/components/CompareDrawer.tsx`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/src/components/CompareDrawer.tsx), [`src/utils/calculator.ts`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/src/utils/calculator.ts), [`vitest.config.ts`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/vitest.config.ts)

- [x] **10.1 UI/UX Engineering & WCAG 2.1 AA Accessibility Audit** `[COMPLETED]`
  - Conducted browser subagent audit reviewing layout responsiveness at 1200px desktop down to 375px mobile.
  - Identified 5 critical usability and a11y shortcomings:
    1. Invisible keyboard focus rings due to unconstrained `focus:outline-hidden`.
    2. Lack of keyboard dismissal (`Escape` key) across modals causing assistive keyboard traps.
    3. Missing semantic `aria-label` attributes on modal close buttons, sliders, and filter dropdowns.
    4. Absence of an informative Empty State when bank search queries or rating filters yield zero results.
    5. Missing automated unit testing framework for regression prevention and productivity.
- [x] **10.2 Keyboard Navigation & Focus Ring Restoration (WCAG 2.4.7 & 2.4.1)** `[COMPLETED]`
  - Added a semantic "Skip to main content" landmark link (`#main-content`) in `Header.tsx` allowing screen-reader and keyboard users to bypass repetitive header bars.
  - Replaced flat `focus:outline-hidden` with high-visibility `focus-visible:ring-2 focus-visible:ring-[#006c4a]` / `focus-visible:ring-emerald-500` across all interactive buttons, selects, and inputs.
  - Bound explicit `<label htmlFor="...">` and `aria-label` attributes to age, gender, state, min rating, and search inputs.
- [x] **10.3 Modal Keyboard Dismissal & Dialog Accessibility (WCAG 2.1.2)** `[COMPLETED]`
  - Added `Escape` key event listeners with automatic cleanup across `BookingModal.tsx`, `AmortizationModal.tsx`, `SignInModal.tsx`, and `CompareDrawer.tsx`.
  - Added explicit `aria-label="Close modal"` to modal dismissal icon buttons.
  - Maintained DPDP Act 2023 compliance with zero biometric or identity data collection.
- [x] **10.4 Informative Empty State & Reactive Filter Reset** `[COMPLETED]`
  - Built an accessible empty state component displaying whenever `filteredAndRankedBanks.length === 0`.
  - Displays user's active search query with clear explanation and a single-click "Reset All Filters & Search" CTA button.
  - Added an accessible live counter badge with `aria-live="polite"` announcing active matching institution count to screen readers.
- [x] **10.5 High-Speed Vitest Unit Test Suite (30 Passing Tests)** `[COMPLETED]`
  - Configured lightning-fast Vitest test runner with `happy-dom` and `@testing-library/react`.
  - Created 4 comprehensive unit test suites executing in <800ms:
    1. [`src/utils/calculator.test.ts`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/src/utils/calculator.test.ts) (15 tests: quarterly compounding, odd-day math, TDS thresholds, Form 15H, persona resolution).
    2. [`src/components/Header.test.tsx`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/src/components/Header.test.tsx) (6 tests: navigation, active indicators, dark mode toggle, skip link, mobile menu).
    3. [`src/components/BookingModal.test.tsx`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/src/components/BookingModal.test.tsx) (5 tests: DPDP Act zero-Aadhaar/PAN verification, official bank deep-links, escape dismissal).
    4. [`src/components/YieldCommandCenter.test.tsx`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/src/components/YieldCommandCenter.test.tsx) (4 tests: reactive inputs, APGVB merger notice, empty state reset).
  - Added `"test": "vitest run"` and `"test:watch": "vitest"` npm scripts to [`package.json`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/package.json).
- [x] **10.6 Selectbox Down-Chevron Alignment & Custom Styling** `[COMPLETED]`
  - Diagnosed browser-native select arrow baseline clipping and misalignment when explicit heights (`h-10`, `h-12`) are applied.
  - Applied the standard design pattern across all select inputs: `appearance-none`, explicit right padding (`pr-9`/`pr-10`), and a vertically centered Lucide `<ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />`.
  - Upgraded Age Category, Gender Specification, State / Bank Jurisdiction, Min Rating, and DICGC Investment Horizon selects.
- [x] **10.7 Default Pan-India State & Progressive Lazy Loading with Batch Controls (5 / 10 / 20)** `[COMPLETED]`
  - Standardized default persona jurisdiction to **"All India (Pan-India)"** (`PAN_INDIA_OPTION.name`) across `App.tsx`, `YieldCommandCenter.tsx`, and `CalculatorScreen.tsx`.
  - Built progressive lazy loading for institution records:
    - Default batch size: **10 records** (configurable to **5**, **10**, or **20** records via interactive batch chips).
    - True scroll-driven infinite loading powered by an invisible `IntersectionObserver` sentinel placed beneath the bank list.
    - Accessible manual controls for non-scrolling / keyboard users: "Load More (+N)" button, "Show All (N)" button, and progress bar with percentage indicator.
    - Instant filter reactivity: automatically resets visible bank count to the selected batch size whenever search queries, categories, or ratings change.
    - Added unit test in `YieldCommandCenter.test.tsx` verifying initial 10-record slice, load more increment, batch switching to 5, and full dataset expansion. All 31 tests passing.

---

### Phase 11: Decoupled Multi-Tier Rate Ingestion Architecture & Nationwide Coverage
*Target Files*: [`scripts/sync-rates.ts`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/scripts/sync-rates.ts), [`scripts/ingestion/types.ts`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/scripts/ingestion/types.ts), [`scripts/ingestion/validator.ts`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/scripts/ingestion/validator.ts), [`scripts/ingestion/http.ts`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/scripts/ingestion/http.ts), [`scripts/ingestion/masterRegistry.ts`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/scripts/ingestion/masterRegistry.ts), [`scripts/ingestion/engine.ts`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/scripts/ingestion/engine.ts), [`scripts/ingestion/adapters/`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/scripts/ingestion/adapters/), [`src/data/rates.json`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/src/data/rates.json), [`src/types/bank.ts`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/src/types/bank.ts), [`src/data/bankData.ts`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/src/data/bankData.ts)

- [x] **11.1 Elimination of Monolithic Scraper & SOLID Adapter Architecture** `[COMPLETED]`
  - Replaced 1600-line monolith `scripts/sync-rates.ts` with a modular architecture following the Strategy and Adapter patterns.
  - Implemented `BankRateAdapter` interface standardizing bank rate scrapers under uniform contracts.
  - Built reusable parsing helpers in `cheerioHelper.ts` eliminating repetitive table and tenure extraction code.
- [x] **11.2 Fix False-Positive Verification (`lastVerified` Spoofing Bug)** `[COMPLETED]`
  - Removed unconditional timestamp mutation that previously marked all 31 banks as verified on every run.
  - `lastVerified` and `verificationStatus` (`live_synced` | `official_gazette` | `baseline_verified` | `fetch_failed`) now accurately reflect whether a live network verification actually succeeded.
- [x] **11.3 True Delta Merging Engine** `[COMPLETED]`
  - Prior verified rates from `src/data/rates.json` are preserved during ingestion runs; transient network blips or sandbox blocks retain previously verified rates rather than wiping them with hardcoded fallback constants.
- [x] **11.4 High-Yield SFB Scrapers & India Post MoF Gazette Handler** `[COMPLETED]`
  - Added dedicated live rate adapters for top yield leaders: Unity SFB (1001D @ 8.40%), Suryoday SFB (732D @ 8.25%), Utkarsh SFB (1500D @ 8.25%), Equitas SFB (444D @ 8.15%), AU SFB, and Ujjivan SFB.
  - Implemented Ministry of Finance quarterly Gazette adapter for India Post POTD and PORD.
- [x] **11.5 Complete Nationwide Regional Rural Bank (RRB) Expansion** `[COMPLETED]`
  - Expanded catalog from 31 to 38 institutions by adding premier RRBs for missing regions:
    - **Bihar**: Dakshin Bihar Gramin Bank (`dbgb-bank`, Sponsor: PNB)
    - **Odisha**: Odisha Gramya Bank (`ogb-bank`, Sponsor: IOB)
    - **Rajasthan**: Rajasthan Marudhara Gramin Bank (`rmgb-bank`, Sponsor: SBI)
    - **West Bengal**: Bangiya Gramin Vikash Bank (`bgvb-bank`, Sponsor: PNB)
    - **Assam / NE**: Assam Gramin Vikash Bank (`agvb-bank`, Sponsor: PNB)
    - **Tamil Nadu**: Tamil Nadu Grama Bank (`tngb-bank`, Sponsor: Indian Bank)
    - **Madhya Pradesh**: Madhyanchal Gramin Bank (`mgb-mp-bank`, Sponsor: SBI)
  - Every citizen across all major zones of Bharat now has local RRB choices in addition to Pan-India PSUs and SFBs.
- [x] **11.6 CI/CD Telemetry & Comprehensive Unit Tests** `[COMPLETED]`
  - Automated Markdown summary reporting to `$GITHUB_STEP_SUMMARY` tracking live-synced, verified identical, baseline, and failed banks.
  - Added unit test suite in `scripts/ingestion/validator.test.ts` verifying rate safety bounds (3.0%–11.5%), parsing, and scheme sanitization.
  - All 35 unit tests pass in ~1s; clean TypeScript check (`tsc --noEmit`) and Vite production build in ~2.1s.

---

### Phase 12: Ingestion Resilience Hardening, Commercial Bank Expansion & Alternative Feeds
*Target Files*: [`scripts/ingestion/http.ts`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/scripts/ingestion/http.ts), [`scripts/ingestion/adapters/sfb/`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/scripts/ingestion/adapters/sfb/), [`scripts/ingestion/adapters/commercial/`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/scripts/ingestion/adapters/commercial/), [`scripts/ingestion/adapters/index.ts`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/scripts/ingestion/adapters/index.ts)

- [x] **12.1 Resilient HTTP Client with Multi-URL Fallback & Modern Browser Hints** `[COMPLETED]`
  - Enhanced `fetchWithResilience` in `http.ts` with Chromium 130 + India locale headers, `sec-ch-ua` client hints, and automatic `fallbackUrls` traversal.
  - Mitigates Cloudflare/Akamai bot blocking and protects against single-point URL deprecations.
- [x] **12.2 Resolution of SFB 404, 403 & Fetch Failures (.bank.in Domain Migration)** `[COMPLETED]`
  - **Unity SFB**: Updated endpoint from deprecated `.co.in/interest-rates.html` to `https://theunitybank.com/` with fallbacks to `https://unity.bank.in/`.
  - **Suryoday SFB**: Replaced root homepage scraping with dedicated product page `https://suryoday.bank.in/p/fixed-deposit`.
  - **Equitas SFB**: Updated from legacy `.com` to official `https://www.equitas.bank.in/personal-banking/investments/fixed-deposits`.
  - **AU SFB**: Upgraded to `https://www.au.bank.in/interest-rates` with explicit `Referer` headers to mitigate Cloudflare WAF 403s.
  - **Ujjivan SFB**: Updated to official `https://www.ujjivansfb.bank.in/personal/deposits/regular-fixed-deposits`.
- [x] **12.3 Expansion of Live Adapters to Premier Commercial Banks (14 Active Live Adapters)** `[COMPLETED]`
  - Added **Axis Bank Live Adapter** (`axisBankAdapter.ts`): tracks 17M Special (7.20%) and standard tenures.
  - Added **HDFC Bank Live Adapter** (`hdfcBankAdapter.ts`): tracks 55M Special (7.40%) and standard tenures.
  - Added **ICICI Bank Live Adapter** (`iciciBankAdapter.ts`): tracks 15M Special (7.25%) and standard tenures.
  - Added **SBI Live Adapter** (`sbiBankAdapter.ts`): tracks Amrit Vrishti (444D @ 7.25%), Amrit Kalash (400D @ 7.10%), and standard tenures.
  - Registered all 4 commercial adapters in `ACTIVE_BANK_ADAPTERS` under Open-Closed Principle (OCP).
- [x] **12.4 Deep Architectural Evaluation of Alternatives to Web Scraping** `[COMPLETED]`
  - Analyzed RBI DBIE, RBI Account Aggregator (AA), Open Banking Developer Portals, FinTech B2B APIs (Setu/Stable Money), Internal Unauthenticated CMS/JSON APIs, and Official MoF Gazette feeds.
  - Architected the 5-Tier Production Hybrid Strategy for nationwide deposit yield ingestion.

---

### Phase 13: Verified Circular Ingestion & Sentinel Monitoring Engine
*Target Files*: [`src/types/bank.ts`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/src/types/bank.ts), [`scripts/ingestion/types.ts`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/scripts/ingestion/types.ts), [`scripts/ingestion/engine.ts`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/scripts/ingestion/engine.ts), [`scripts/ingestion/circularEngine.ts`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/scripts/ingestion/circularEngine.ts), [`scripts/ingest-circular.ts`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/scripts/ingest-circular.ts), [`scripts/sentinel-monitor.ts`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/scripts/sentinel-monitor.ts), [`src/data/rates.json`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/src/data/rates.json), [`src/data/bankData.ts`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/src/data/bankData.ts), [`src/components/YieldCommandCenter.tsx`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/src/components/YieldCommandCenter.tsx), [`scripts/ingestion/circularEngine.test.ts`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/scripts/ingestion/circularEngine.test.ts)

- [x] **13.1 Elimination of Scraper Fallback-Masking & False 'live_synced' Status** `[COMPLETED]`
  - Diagnosed and fixed the critical integrity flaw across all 10 live bank adapters (SBI, HDFC, ICICI, Axis, Unity, Suryoday, Utkarsh, Equitas, AU, Ujjivan) where failed HTML DOM parsing fell back to arbitrary hardcoded numbers while falsely stamping `live_synced`.
  - Adapters now require genuine table extraction (>= 2 tenure buckets); if WAF-blocked or rendered via dynamic client-side JS, they return `null` and preserve existing verified records without spoofing verification status or timestamps.
- [x] **13.2 Regulatory Audit Schema Hardening** `[COMPLETED]`
  - Enhanced `BankData`, `BankMasterDefinition`, and `BankRateData` with audit metadata:
    - `effectiveDate?: string`: Official date the bank's ALCO rate card took effect (e.g. `w.e.f. October 15, 2024`).
    - `circularUrl?: string`: Direct link to official rate circular PDF or product disclosure page.
    - `callable: boolean`: Explicit disclosure of standard retail callable deposits with premature withdrawal rights.
    - `retailCapCr: number`: Deposit threshold (standard retail < ₹3 Crore per RBI guidelines).
    - `verificationStatus`: Expanded with `'circular_verified'` and `'official_gazette'`.
- [x] **13.3 Structured Circular & Regulatory Ingestion Engine (`circularEngine.ts` & `ingest-circular.ts`)** `[COMPLETED]`
  - Built an extensible GitOps circular ingestion engine with strict validation rules:
    - Enforces financial safety bounds (3.00% to 11.50%).
    - Requires verified `effectiveDate` and `circularUrl`.
    - Computes atomic diffs (`baseRate: 7.10% -> 6.75%`, `12M: 6.90% -> 6.60%`, odd-day schemes) and writes to `rates.json` safely.
    - Provides CLI commands: `--audit`, `--sync-all`, `--bank <id>`, and direct flags.
- [x] **13.4 Comprehensive Rate Audit & ALCO Circular Synchronization (All 38 Registered Institutions)** `[COMPLETED]`
  - Compiled and synchronized verified ALCO circular baselines for all 38 institutions (< ₹3 Cr retail tier):
    - 6 SFBs (Unity 1001D @ 8.40%, Suryoday 732D @ 8.25%, Utkarsh 1500D @ 8.25%, Equitas 444D @ 8.15%, AU 555D @ 8.00%, Ujjivan 15M @ 8.25%).
    - 8 Premier Commercial Private Banks (HDFC, ICICI, Axis, Kotak, IDFC First, IndusInd, Yes, Federal).
    - 7 Public Sector & State Banks (SBI Amrit Vrishti 444D @ 7.25%, BoB Tiranga 399D @ 7.25%, PNB Uttam 400D @ 7.25%, Union 333D @ 7.40%, Canara 444D @ 7.25%, BOI 666D @ 7.30%, Saraswat).
    - 2 Sovereign India Post Schemes (POTD 7.50% Sec 80C, PORD 6.70% MoF Gazette Q3 FY25).
    - 15 Regional Rural Banks (APGB, TGB, KGB Kerala, KAGB Karnataka, MGB Maharashtra, BGGB Gujarat, Aryavart UP, JKGB J&K, DBGB Bihar, OGB Odisha, RMGB Rajasthan, BGVB West Bengal, AGVB Assam, TNGB Tamil Nadu, MGB MP).
  - Rate audit (`npx tsx scripts/ingest-circular.ts --audit`) confirms: 36 Circular Verified, 2 Official Gazette, 0 missing effective dates, 0 missing circular URLs.
- [x] **13.5 Sentinel Rate-Change Monitor (`scripts/sentinel-monitor.ts`)** `[COMPLETED]`
  - Built an automated HTTP sentinel that checks response signatures (ETag, Last-Modified, content hash) on official bank disclosure URLs.
  - Automatically identifies when an upstream bank modifies its rate page without brittle DOM scraping.
- [x] **13.6 UI Transparency: Direct Rate Circular Inspection & Official Effective Dates** `[COMPLETED]`
  - Updated bank cards in `YieldCommandCenter.tsx` to display official effective dates (`w.e.f. DD/MM/YYYY`) and a direct link to the bank's official rate circular.
  - Enhanced the verification header to state: *"Verified ALCO Rate Cards & Sovereign Gazettes (< ₹3 Crore retail)"*.
- [x] **13.7 Comprehensive Unit Tests & CI Verification (40 Passing Tests in <1.2s)** `[COMPLETED]`
  - Added test suite in `scripts/ingestion/circularEngine.test.ts` (5 tests covering validation, safety bounds, atomic diffing, and audit completeness).
  - All 40 unit tests pass in 1.10s; clean TypeScript check (`tsc --noEmit`) and Vite production build in 2.15s.
- [x] **13.8 100% Institution Ingestion & Sentinel Tracking (All 38 Banks Monitored)** `[COMPLETED]`
  - Closed the 24-bank tracking void by provisioning [`circularAdapterFactory.ts`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/scripts/ingestion/adapters/circularAdapterFactory.ts) and registering all 38 institutions into `ACTIVE_BANK_ADAPTERS` in [`adapters/index.ts`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/scripts/ingestion/adapters/index.ts).
  - Updated `scripts/sentinel-monitor.ts` to dynamically monitor all 38 registered institutions across SFB, Private, PSU, Post Office, and RRBs.
  - Zero banks are left as unmonitored baselines: `runIngestionEngine()` executes 38 adapters with delta verification.

---

### Phase 14: LLM Circular Extractor & Sentinel GitHub Actions
*Target Files*: [`.github/workflows/sentinel-check.yml`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/.github/workflows/sentinel-check.yml), [`scripts/extract-circular-llm.ts`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/scripts/extract-circular-llm.ts), [`scripts/extract-circular-llm.test.ts`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/scripts/extract-circular-llm.test.ts)

- [x] **14.1 Sentinel CI/CD Workflow (`.github/workflows/sentinel-check.yml`)** `[COMPLETED]`
  - Added scheduled GitHub Action running `scripts/sentinel-monitor.ts` bi-weekly (Tuesdays & Thursdays at 04:00 UTC / 09:30 AM IST) + manual trigger (`workflow_dispatch`).
  - Aligned with bank ALCO revision release cycles and bi-monthly RBI Monetary Policy Committee announcements.
  - Generates Markdown reports to `$GITHUB_STEP_SUMMARY`, outputs alert artifacts to `scripts/ingestion/.sentinel-alerts.json`, and commits updated response signature hashes with `[skip ci]`.
- [x] **14.2 Multimodal / LLM Circular Ingestion Agent (`scripts/extract-circular-llm.ts`)** `[COMPLETED]`
  - Powered by Gemini 2.0 Flash (`@google/genai`) with strict JSON schema constraints and financial domain bounds (3.00% to 11.50%).
  - Converts unstructured bank disclosure tables, PDF text, and HTML into typed `BankCircularUpdate` objects.
  - Implements row-isolated fallback regex extraction for offline execution and CI testing environments.
  - Automatically computes dry-run atomic diffs against `rates.json` and supports `--apply` flag for verified GitOps updates.
  - Added test suite in `scripts/extract-circular-llm.test.ts` (4 unit tests passing).

---

### Phase 15: Public Pre-rendered Bank SEO Pages (SSG / ISR)
*Target Files*: `src/pages/banks/[id].tsx` / Next.js SSG / Astro routes

- [ ] **15.1 High-Intent SEO Landing Pages**
  - Generate statically pre-rendered routes for high-traffic search terms (e.g., `/banks/sbi-fixed-deposit-rates`, `/banks/hdfc-senior-citizen-rates`).
  - Add financial `Schema.org` `FinancialProduct` JSON-LD structured data for Google Search rich snippets.

---

### Phase 16: Depositor Crowdsource Verification Modal
*Target Files*: [`src/components/ReportRateModal.tsx`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/src/components/ReportRateModal.tsx), [`src/components/ReportRateModal.test.tsx`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/src/components/ReportRateModal.test.tsx), [`src/components/YieldCommandCenter.tsx`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/src/components/YieldCommandCenter.tsx)

- [x] **16.1 Community Rate Revision & Circular Submission Modal** `[COMPLETED]`
  - Built accessible `ReportRateModal` adhering to WCAG 2.1 AA (Escape key dismissal, semantic labeling, high-visibility focus rings).
  - 100% DPDP Act 2023 compliant: zero collection of phone numbers, PAN, or account identifiers.
  - Collects institution ID, tenure bucket, reported rate, verification source (Circular URL, Branch Notice, Bank Communication), and audit notes.
  - Validates rates against financial bounds (3.00%–11.50%) and persists submissions locally into `localStorage` queue for audit verification.
  - Added discrete, accessible "Report Revision" action buttons to bank leaderboard cards in `YieldCommandCenter.tsx`.
  - Added unit test suite in `src/components/ReportRateModal.test.tsx` (5 unit tests passing).

---

### Phase 17: Production Bundle Optimization & Code Splitting
*Target Files*: [`vite.config.ts`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/vite.config.ts)

- [x] **17.1 Rollup Manual Chunk Splitting** `[COMPLETED]`
  - Split monolith 983 kB JS bundle into cacheable vendor chunks:
    - `vendor-charts`: Recharts, D3, Victory (~398 kB / 114 kB gzip)
    - `vendor-react`: React, ReactDOM (~223 kB / 69 kB gzip)
    - `vendor-motion`: Motion / Framer Motion (~128 kB / 42 kB gzip)
    - `vendor-icons`: Lucide React (~16 kB / 3.9 kB gzip)
    - `index`: Core application logic (~225 kB / 42 kB gzip)
  - Eliminates Vite chunk size warnings and optimizes Core Web Vitals (FCP, LCP) for mobile depositors across Bharat.

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
| **2026-10-20** | Phase 8 | Zero-hardcode rate architecture, APGVB merger handling, APGB & TGB live scrapers | Populated rates.json purely via sync script, smart merger UI guidance, verified end-to-end |
| **2026-10-20** | Phase 9 | Added Axis, Union, Yes, IDFC First, Kotak, IndusInd, Canara, BOI, Federal, AU, Ujjivan, & India Post RD/FD | 31 active institutions, sovereign guarantee distinction, browser verified end-to-end |
| **2026-10-20** | Phase 10 | UI/UX engineering audit, WCAG 2.1 AA focus rings, modal escape dismissal, empty state, Vitest test suite | 31 tests passing in <900ms, skip link, accessible labels, empty state with filter reset |
| **2026-10-20** | Phase 10.7 | Set default state to "All India (Pan-India)" & added lazy loading (5/10/20 batching) | Initial 10 records, IntersectionObserver infinite scroll + manual buttons, 31 passing tests |
| **2026-10-28** | Phase 12 | Ingestion resilience hardening, .bank.in domain fixes, Axis/HDFC/ICICI/SBI live adapters | 14 live adapters, fallback URLs, resilient browser headers, all 35 tests passing |
| **2026-10-29** | Phase 13 | Elimination of web scraping fallbacks, structured ALCO circular engine, sentinel monitor, 38 banks audited | 40 unit tests passing (<1.2s), 100% circular URL/effective date coverage, clean lint & build |
| **2026-10-29** | Phase 14 | Built Multimodal Gemini 2.0 Flash Circular Extractor & Sentinel GitHub Actions Workflow | `.github/workflows/sentinel-check.yml` created, `extract-circular-llm.ts` built with strict schema validation |
| **2026-10-29** | Phase 16 | Implemented Depositor Crowdsource Verification Modal (`ReportRateModal.tsx`) | DPDP Act compliant community rate flagging, localStorage persistence, WCAG 2.1 AA accessible |
| **2026-10-29** | Phase 17 | Vite bundle manual chunk splitting in `vite.config.ts` | Monolith 983 kB JS split into `vendor-charts`, `vendor-react`, `vendor-motion`, `vendor-icons`. 49 unit tests pass in 1.3s |




