# Bharat Fixed Yield (BFY) — Implementation & Task Tracker

> **Core Engineering Principle**: Build the simplest production-quality solution that satisfies current requirements, making deliberate decisions about maintainability, security, performance, scalability, UX, and future change.

Last Updated: **2026-10-20**  
Status: **Active Development**

---

## 📊 High-Level Status Dashboard

| Milestone | Target Scope | Status | Progress | Est. Completion |
|---|---|:---:|:---:|---|
| **Phase 1: Math & Domain Engine** | RBI RD Formula, Quarterly Compounding, TDS 194A/80TTB | `IN_PROGRESS` | 20% | Immediate (Today) |
| **Phase 2: Compliance & Security** | Purge Aadhaar/PAN from BookingModal, Safe Bank Redirects | `TODO` | 0% | Immediate (Today) |
| **Phase 3: Unified Command Center** | Single-Screen UX, Reactive Sliders, Donut & Area Charts | `TODO` | 0% | Immediate (Today) |
| **Phase 4: Personalization Engine** | Multi-Tenure Rate Tables, State/Jurisdiction, Women Bonus | `TODO` | 0% | Immediate (Today) |
| **Phase 5: Build & Production Quality** | Clean Types, Vite Build Verification, Performance Audit | `TODO` | 0% | Immediate (Today) |

---

## 🛠️ Detailed Task Breakdown & Tracking

### Phase 1: Core Mathematical Engine & Domain Logic
*Target Files*: [`src/utils/calculator.ts`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/src/utils/calculator.ts), [`src/types/bank.ts`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/src/types/bank.ts)

- [ ] **1.1 Recurring Deposit (RD) Compounding Formula** `[HIGH PRIORITY]`
  - Implement RBI-compliant installment compounding:
    $$A = \sum_{k=1}^{n} M \left(1 + \frac{r}{400}\right)^{4 \times \frac{n - k + 1}{12}}$$
  - Support monthly deposit amounts ($M$) vs. cumulative investment ($M \times n$).
  - Separate `calculateFDYield()` and `calculateRDYield()`, unified under polymorphic `calculateYield()`.
- [ ] **1.2 Dynamic Input & Label Switching**
  - Update `UserPersona` to clearly distinguish `depositType: 'FD'` vs `'RD'`.
  - When in RD mode, dynamic labels switch from *"Principal Deposit Sum"* to *"Monthly Installment"*.
  - Calculation summaries display both *"Total Amount Deposited"* and *"Net Maturity Payout"*.
- [ ] **1.3 Statutory TDS & Exemption Logic (Sec 194A / 80TTB)**
  - General Citizens (<60): ₹40,000 annual interest threshold.
  - Senior Citizens (60+): ₹50,000 threshold under Section 80TTB.
  - Form 15G/15H toggle zeroing out withholding tax calculations.

---

### Phase 2: Compliance & Security Hardening
*Target Files*: [`src/components/BookingModal.tsx`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/src/components/BookingModal.tsx)

- [ ] **2.1 Eradicate Aadhaar & PAN Card Data Collection** `[CRITICAL COMPLIANCE]`
  - Remove fake paperless KYC fields requesting 12-digit Aadhaar & PAN strings.
  - Ensure zero PII or biometric/identity tokens are stored or handled in memory/state (DPDP Act 2023 compliance).
- [ ] **2.2 Official Bank Deep-Link Redirection Portal**
  - Replace mock payment flow with verified bank routing:
    - Button: *"Proceed to Official [Bank Name] Portal"* (e.g., SBI YONO, HDFC NetBanking, Unity SFB Digital FD).
    - Open official secure portal in new tab with `rel="noopener noreferrer"`.
- [ ] **2.3 DICGC Insurance & Statutory Disclaimers**
  - Add explicit statutory badges: *"Covered up to ₹5,00,000 per depositor by DICGC (RBI Subsidiary)"*.
  - Show bank registration and scheduled commercial bank classification tags.

---

### Phase 3: Unified "Yield Command Center" & Rich Visualizations
*Target Files*: [`src/App.tsx`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/src/App.tsx), [`src/components/CalculatorScreen.tsx`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/src/components/CalculatorScreen.tsx), [`src/components/LeaderboardScreen.tsx`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/src/components/LeaderboardScreen.tsx)

- [ ] **3.1 Single-Tab UX Unification** `[USER EXPERIENCE]`
  - Eliminate the jarring two-screen split where "Calculator" and "Live Comparisons" require tab toggling.
  - Create a cohesive single-page **Yield Command Center**:
    - **Header/Top**: Interactive dual-mode (FD/RD) sliders and persona toggles.
    - **Middle**: Real-time Visual Analytics.
    - **Bottom**: Reactive Bank Leaderboard.
- [ ] **3.2 Interactive Wealth Visualizations**
  - **Donut / Radial Chart**: Principal Deposited vs. Wealth Created (Interest Gain).
  - **Compounding Trajectory Area Chart**: Dynamic quarterly growth curve tracking balance over tenure.
  - **Bank Rate Spread Bar**: Visual representation comparing rates across SFB, Private, and PSU institutions.
- [ ] **3.3 Zero-Latency Reactive Filtering**
  - Sliders and chips reactively recalculate yields and resort the bank leaderboard without page reloads.

---

### Phase 4: Dynamic Personalization & Multi-Tenure Rate Matrix
*Target Files*: [`src/data/bankData.ts`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/src/data/bankData.ts), [`src/types/bank.ts`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/src/types/bank.ts)

- [ ] **4.1 Multi-Tenure Rate Matrix Schema**
  - Expand bank records from static 36-month numbers to a comprehensive tenure matrix:
    - 1 Year (12 Months)
    - 2 Years (24 Months)
    - 3 Years (36 Months)
    - 5 Years (60 Months - Tax Saver 80C)
    - Special High-Yield Tenures (e.g., 400 Days, 444 Days, 777 Days)
- [ ] **4.2 State & Jurisdiction Filtering**
  - Filter scheduled cooperative banks and Regional Rural Banks (RRBs) by `operatingStates.includes(persona.state) || isPanIndia`.
- [ ] **4.3 Gender-Specific Special Rates**
  - Wire up `persona.gender === 'female'` to activate:
    - Mahila Samman Savings Certificate (MSSC) benchmark (7.50% statutory).
    - Women depositor special rate boosts (+0.10% to +0.25% in participating banks).
- [ ] **4.4 Age Tiers**
  - General (<60): Standard card rate.
  - Senior (60–79): Standard + 0.50% statutory premium.
  - Super Senior (80+): Additional +0.25% to +0.30% premium in eligible lenders.

---

### Phase 5: Build Integrity & Production Quality Gates
*Target Files*: [`package.json`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/package.json), [`vite.config.ts`](file:///Users/gveerendra/PersonalApps/Bharat-Fixed-Yield/vite.config.ts)

- [ ] **5.1 Production Dependency Sanitization**
  - Verify clean Vite build without rolldown/native engine conflicts.
  - Remove unused Express backend dependencies from frontend `package.json`.
- [ ] **5.2 TypeScript Verification**
  - Run type checks across all components to ensure zero build regressions.
- [ ] **5.3 Mobile & Accessibility (a11y) Verification**
  - Touch target sizing (minimum 44x44px for sliders and chips).
  - High-contrast text labels for senior citizen usability.

---

## 📝 Execution Log & Updates

| Date & Time | Step | Action Taken | Result / Notes |
|---|---|---|---|
| **2026-10-20** | Init | Created detailed Implementation Tracker | Architecture plan aligned with full-stack standards |
