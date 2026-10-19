# Bharat Fixed Yield (BFY)

> **India's Sovereign & RBI-Indexed Fixed Income Intelligence Platform**  
> Compare Fixed Deposit (FD) and Recurring Deposit (RD) yields across Scheduled Commercial Banks, Public Sector Undertakings (PSUs), and Small Finance Banks (SFBs) with DICGC statutory insurance guarantees.

---

## Table of Contents
- [Overview](#overview)
- [Core Value Proposition](#core-value-proposition)
- [System Architecture](#system-architecture)
- [Financial Calculation Models](#financial-calculation-models)
  - [Fixed Deposit (Quarterly Compounding)](#fixed-deposit-quarterly-compounding)
  - [Recurring Deposit (Installment Compounding)](#recurring-deposit-installment-compounding)
  - [Taxation & TDS (Sections 194A & 80TTB)](#taxation--tds-sections-194a--80ttb)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Development Server](#development-server)
  - [Production Build](#production-build)
- [Production Readiness Checklist](#production-readiness-checklist)
- [Security & Regulatory Compliance](#security--regulatory-compliance)
- [Architecture & Standards Documentation](#architecture--standards-documentation)

---

## Overview

Retail depositors in India often struggle to identify peak fixed-income yields that balance returns with statutory safety. **Bharat Fixed Yield** provides:
1. **Unified Command Center**: Real-time dual FD/RD calculators paired with an instantaneous bank yield leaderboard on a single screen.
2. **Dynamic Personalization**: Rate optimization tailored by age (General, Senior, Super Senior), gender (women depositor schemes like MSSC), and regional operating state.
3. **Statutory Risk Indexing**: Clear DICGC ₹5,00,000 statutory deposit insurance tracking to protect principal and earned interest.
4. **Visual Analytics**: Interactive compounding growth trajectories, principal vs. interest breakdown, and bank yield spread comparisons.

---

## Core Value Proposition

- **Single-Tab Simplicity**: No screen-switching between calculating returns and discovering top bank rates.
- **DICGC Safety Guardrails**: Built-in asset allocation warnings when single-bank deposits exceed the ₹5,00,000 statutory insurance limit.
- **Accurate Indian Banking Conventions**: Strict adherence to quarterly compounding norms mandated by the Reserve Bank of India (RBI).

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Client Application                            │
│           React 19 + TypeScript + Tailwind CSS v4 + Recharts            │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTPS
┌────────────────────────────────────▼────────────────────────────────────┐
│                       Edge / CDN Gateway (Cloudflare)                   │
│          Global Edge Caching • SSL/TLS Termination • WAF Mitigation     │
└───────────────────┬─────────────────────────────────┬───────────────────┘
                    │                                 │
     Fast Cache Hit │ (<10ms)                         │ Dynamic / API
                    ▼                                 ▼
       ┌─────────────────────────┐       ┌────────────────────────┐
       │   Upstash Redis Cache   │       │   API / Server Layer   │
       │   - Bank Rate Matrices  │       │   - Rate Search API    │
       │   - Benchmark Rates     │       │   - Yield Engines      │
       └────────────▲────────────┘       └────────────▲───────────┘
                    │                                 │
                    └────────────────┬────────────────┘
                                     │
                        ┌────────────┴─────────────┐
                        │   Serverless Postgres    │
                        │    (Neon / Supabase)     │
                        │   - Historical Rates     │
                        │   - Institution Profiles │
                        └────────────▲─────────────┘
                                     │
                        ┌────────────┴─────────────┐
                        │  Rate Ingestion Worker   │
                        │   (Daily Scheduled Cron) │
                        │  - RBI Gazette Registry  │
                        │  - Scheduled Bank Portals│
                        └──────────────────────────┘
```

---

## Financial Calculation Models

### Fixed Deposit (Quarterly Compounding)
Cumulative Fixed Deposits in Indian banks compound every calendar quarter:
$$A = P \left(1 + \frac{r}{400}\right)^{4t}$$
Where:
- $A$ = Maturity amount
- $P$ = Principal deposit sum
- $r$ = Annual interest rate (percentage)
- $t$ = Tenure in years ($t = \text{months} / 12$)

### Recurring Deposit (Installment Compounding)
Recurring Deposits consist of $n$ monthly installments $M$. Each monthly installment earns interest for its remaining duration, compounded quarterly:
$$A = \sum_{k=1}^{n} M \left(1 + \frac{r}{400}\right)^{4 \times \frac{n - k + 1}{12}}$$
- Total Principal Invested = $M \times n$
- Total Interest Earned = $A - (M \times n)$

### Taxation & TDS (Sections 194A & 80TTB)
- **General Citizens (<60 years)**: TDS is applicable under Section 194A if total interest across branches of a bank exceeds **₹40,000** in a financial year.
- **Senior Citizens (≥60 years)**: TDS threshold is **₹50,000** per financial year, accompanied by tax exemption under Section 80TTB up to ₹50,000.
- **Form 15G / 15H**: If total taxable income is below basic exemption limits, submitting valid declarations exempts depositors from TDS deductions.

---

## Tech Stack

| Domain | Technology | Purpose |
|---|---|---|
| **Frontend Framework** | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) | Type-safe UI components and state management |
| **Bundler & Tooling** | [Vite 6+](https://vite.dev/) | Sub-second HMR and optimized production bundles |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Modern utility-first CSS with native design token support |
| **Icons** | [Lucide React](https://lucide.dev/) | Clean, accessible vector icons |
| **Animations** | [Motion (Framer Motion)](https://motion.dev/) | Hardware-accelerated UI transitions and modals |
| **Visualizations** | [Recharts](https://recharts.org/) / SVG Charts | Accessible, responsive compounding and return charts |

---

## Project Structure

```
Bharat-Fixed-Yield/
├── src/
│   ├── components/               # Modular UI Components
│   │   ├── Header.tsx            # Navigation, Repo Rate chip, Dark mode
│   │   ├── Footer.tsx            # Regulatory disclaimers & statutory links
│   │   ├── CalculatorScreen.tsx  # Dual FD/RD inputs, sliders, and breakdown
│   │   ├── LeaderboardScreen.tsx # Filtered bank yield cards & ranker
│   │   ├── TenureInspectionScreen.tsx # Quarterly compounding schedules
│   │   ├── CompareDrawer.tsx     # Multi-bank side-by-side comparison
│   │   ├── DicgcSafetyScreen.tsx # DICGC ₹5L statutory insurance guide
│   │   ├── TaxGuideScreen.tsx    # TDS, 15G/15H, and 80TTB documentation
│   │   └── BookingModal.tsx      # Bank redirection / lead dispatch
│   ├── data/
│   │   └── bankData.ts           # Benchmark bank profiles and card rates
│   ├── types/
│   │   └── bank.ts               # Type contracts (Persona, Rates, Quarters)
│   ├── utils/
│   │   └── calculator.ts         # Math engines (FD, RD, TDS, Yields)
│   ├── App.tsx                   # Master application viewport & state
│   ├── main.tsx                  # React DOM entry point
│   └── index.css                 # Global styling and Tailwind directives
├── public/                       # Static public assets
├── context.md                    # Detailed architectural review & roadmap
├── tsconfig.json                 # TypeScript compiler configuration
├── vite.config.ts                # Vite build and plugin setup
└── package.json                  # Dependencies and execution scripts
```

---

## Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher (or pnpm / yarn)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/veerendrageddam/Bharat-Fixed-Yield.git
   cd Bharat-Fixed-Yield
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Development Server
Start the local development server:
```bash
npm run dev
```
The application will be available at `http://localhost:3000`.

### Production Build
Type-check and generate production static assets:
```bash
# Type check without emitting files
npm run lint

# Compile optimized bundle into /dist
npm run build

# Preview production build locally
npm run preview
```

---

## Production Readiness Checklist

- [ ] **Dual Engine Parity**: Implement true recurring installment math for RD alongside FD lump-sum compounding.
- [ ] **Tab Unification**: Unify Calculator controls, Visual Analytics, and Bank Yield Leaderboard into a single responsive view.
- [ ] **Personalization Activation**: Factor gender premiums (MSSC, special schemes) and state bank operating territories into ranking logic.
- [ ] **Data Pipeline**: Replace in-memory array with PostgreSQL + Upstash Redis cache fed by a scheduled rate crawler.
- [ ] **DPDP Compliance**: Ensure no raw PII (Aadhaar/PAN) is stored or handled on client devices; use authorized bank deep links.
- [ ] **SEO & Metadata**: Add OpenGraph tags, JSON-LD financial schema, and dynamic sitemaps for top bank queries.

---

## Security & Regulatory Compliance

- **Digital Personal Data Protection Act (DPDP 2023)**: Do not store or process biometric/Aadhaar data on client-side state.
- **RBI Disclaimer**: Interest rates and tenure offerings are subject to frequent revisions by issuing banks. Disclaimers clearly state that calculations are illustrative and verify against final bank rate cards.
- **DICGC Coverage**: Statutory coverage up to ₹5,00,000 applies to principal and accrued interest per depositor across all branches of a single scheduled commercial or cooperative bank.

---

## Architecture & Standards Documentation

For complete technical specifications, mathematical proofs, cost breakdowns, and the full architectural roadmap, see **[context.md](context.md)**.