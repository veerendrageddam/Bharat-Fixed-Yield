export type DepositType = 'FD' | 'RD';
export type CompoundingFrequency = 'quarterly' | 'monthly' | 'maturity';
export type BankCategory = 'sfb' | 'private' | 'psu' | 'rrb' | 'post_office' | 'taxsaver' | 'all';
export type CreditRating = 'AAA' | 'AA+' | 'AA' | 'A+' | 'A' | 'Sovereign';

export interface SpecialScheme {
  name: string;
  days: number;
  rate: number; // General citizen base rate %
  seniorBonus?: number;
  superSeniorBonus?: number;
  badge?: string;
  validTill?: string;
}

export interface BankData {
  id: string;
  rank: number;
  name: string;
  subTitle: string;
  category: 'sfb' | 'private' | 'psu' | 'rrb' | 'post_office';
  sponsorGovt?: string; // e.g. "Govt of AP & Canara Bank"
  badge: string;
  categoryTag: string;
  ratingAgency: 'CRISIL' | 'CARE' | 'ICRA' | 'Sovereign';
  rating: string;
  baseRate: number; // For general citizen for default tenure (e.g. 36M), e.g. 8.15
  seniorBonus: number; // e.g. 0.50
  superSeniorBonus: number; // e.g. 0.75
  womenBonus?: number; // e.g. 0.10 - 0.25%
  logoUrl: string;
  minDeposit: number;
  tenureYears: number;
  tenureMonths: number;
  specialTenure?: string;
  specialSchemes?: SpecialScheme[]; // Odd-day high-yield promotional schemes (e.g. 222D, 400D, 444D, 555D, 1001D)
  dicgcCovered: boolean;
  notes: string;
  exitPenalty: string;
  lockInDays: number;
  // Multi-tenure rate matrix: tenure in months -> annual interest rate %
  ratesByTenure?: Record<number, number>;
  rdRatesByTenure?: Record<number, number>;
  // Geographic jurisdiction
  operatingStates?: string[];
  isPanIndia?: boolean;
  // Official banking portal deep-link for safe redirection
  portalUrl?: string;
  portalName?: string;
  fdSupported?: boolean;
  rdSupported?: boolean;
  status?: 'active' | 'amalgamated';
  sourceUrl?: string;
  lastVerified?: string;
}

export interface MergedBankInfo {
  id: string;
  name: string;
  status: 'amalgamated';
  category: 'sfb' | 'private' | 'psu' | 'rrb' | 'post_office';
  effectiveDate: string;
  rationale: string;
  successorBankIds: string[];
  successorBankNames: string[];
  notice: string;
  formerOperatingStates: string[];
  sourceNotice?: string;
}

export interface UserPersona {
  depositType: DepositType;
  principal: number; // For FD: Lump sum; For RD: Monthly installment (or total principal)
  monthlyInstallment?: number; // Explicit monthly installment for RD
  tenureMonths: number;
  tenureDays?: number; // For odd-day schemes (222, 399, 400, 444, 555, 777, 1001)
  tenureUnit?: 'months' | 'days';
  customRate?: number; // Custom percentage entered by user
  useCustomRate?: boolean; // Whether custom percentage mode is active
  compounding: CompoundingFrequency;
  age: number;
  gender: 'female' | 'male' | 'other';
  state: string;
  residency: 'resident' | 'nri';
  panLinked: boolean;
  form15HSubmitted: boolean;
}

export interface QuarterData {
  quarter: number;
  label: string;
  date: string;
  openingBalance: number;
  interestEarned: number;
  cumulativeInterest: number;
  closingBalance: number;
  tdsAmount: number;
  tdsStatus: string;
  fyLabel?: string;
  isFyEnd?: boolean;
}

export interface TimelineDataPoint {
  period: string;
  month: number;
  deposit: number;
  cumulativeDeposit: number;
  balance: number;
  interestEarned: number;
}

export interface CalculationResult {
  depositType: DepositType;
  appliedRate: number;
  effectiveAnnualYield: number;
  totalInvested: number;
  maturityAmount: number;
  totalInterest: number;
  annualInterestFY1: number;
  annualInterestFY2: number;
  annualInterestFY3: number;
  estimatedTdsYear3: number;
  totalTdsDeducted: number;
  netMaturityWithTds: number;
  quarters: QuarterData[];
  timelineData: TimelineDataPoint[];
}
