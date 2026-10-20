export type DepositType = 'FD' | 'RD';
export type CompoundingFrequency = 'quarterly' | 'monthly' | 'maturity';
export type BankCategory = 'sfb' | 'private' | 'psu' | 'taxsaver' | 'all';
export type CreditRating = 'AAA' | 'AA+' | 'AA' | 'A+' | 'A' | 'Sovereign';

export interface BankData {
  id: string;
  rank: number;
  name: string;
  subTitle: string;
  category: 'sfb' | 'private' | 'psu';
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
  dicgcCovered: boolean;
  notes: string;
  exitPenalty: string;
  lockInDays: number;
  // Multi-tenure rate matrix: tenure in months -> annual interest rate %
  ratesByTenure?: Record<number, number>;
  // Geographic jurisdiction
  operatingStates?: string[];
  isPanIndia?: boolean;
  // Official banking portal deep-link for safe redirection
  portalUrl?: string;
  portalName?: string;
  rdSupported?: boolean;
}

export interface UserPersona {
  depositType: DepositType;
  principal: number; // For FD: Lump sum; For RD: Monthly installment (or total principal)
  monthlyInstallment?: number; // Explicit monthly installment for RD
  tenureMonths: number;
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
