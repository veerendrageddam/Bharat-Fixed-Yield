import {
  BankData,
  CalculationResult,
  DepositType,
  QuarterData,
  TimelineDataPoint,
  UserPersona,
} from '../types/bank';

export function formatINR(val: number): string {
  if (isNaN(val)) return '0';
  return Math.round(val).toLocaleString('en-IN');
}

export function formatLakhs(val: number): string {
  if (isNaN(val)) return '0';
  if (val >= 10000000) {
    return (val / 10000000).toFixed(2) + ' Crores';
  } else if (val >= 100000) {
    return (val / 100000).toFixed(2) + ' Lakhs';
  }
  return formatINR(val);
}

/**
 * Resolves the effective rate for a bank based on the user's persona and tenure
 */
export function getEffectiveRate(
  bank: BankData,
  persona: UserPersona,
  tenureMonths?: number
): number {
  const targetTenure = tenureMonths ?? persona.tenureMonths;
  let rate = bank.baseRate;

  // Use tenure-specific rate if available in rate matrix
  if (bank.ratesByTenure && bank.ratesByTenure[targetTenure] !== undefined) {
    rate = bank.ratesByTenure[targetTenure];
  }

  // Age bonuses
  if (persona.age >= 80) {
    rate += bank.superSeniorBonus;
  } else if (persona.age >= 60) {
    rate += bank.seniorBonus;
  }

  // Women depositor bonus
  if (persona.gender === 'female' && bank.womenBonus) {
    rate += bank.womenBonus;
  }

  return Number(rate.toFixed(2));
}

/**
 * Calculates Fixed Deposit Yield with quarterly compounding (Indian Banking RBI Standard)
 * Formula: A = P * (1 + r/400)^(4 * t) where t = tenureMonths / 12
 */
export function calculateFDYield(
  principal: number,
  annualRate: number,
  tenureMonths: number,
  age: number,
  form15HSubmitted: boolean = false,
  panLinked: boolean = true
): CalculationResult {
  const r = annualRate;
  const quartersCount = Math.max(1, Math.round(tenureMonths / 3));
  const t = tenureMonths / 12;

  let currentBalance = principal;
  let cumInterest = 0;
  const quarters: QuarterData[] = [];
  const timelineData: TimelineDataPoint[] = [];

  const startYear = 2025;
  const monthNames = ['Jul', 'Oct', 'Jan', 'Apr'];

  let fy1Interest = 0;
  let fy2Interest = 0;
  let fy3Interest = 0;
  let totalTds = 0;

  // Sec 194A / 80TTB exemption threshold
  const exemptionThreshold = age >= 60 ? 50000 : 40000;
  const tdsRate = form15HSubmitted ? 0 : panLinked ? 0.10 : 0.20;

  // Initial timeline point at month 0
  timelineData.push({
    period: 'Start',
    month: 0,
    deposit: principal,
    cumulativeDeposit: principal,
    balance: principal,
    interestEarned: 0,
  });

  for (let q = 1; q <= quartersCount; q++) {
    const opening = currentBalance;
    const interest = Math.round(opening * (r / 400));
    cumInterest += interest;
    currentBalance = opening + interest;

    // Track FY interest
    if (q <= 4) {
      fy1Interest += interest;
    } else if (q <= 8) {
      fy2Interest += interest;
    } else if (q <= 12) {
      fy3Interest += interest;
    }

    const monthIndex = (q - 1) % 4;
    const calYear = startYear + Math.floor((q + 1) / 4);
    const dateStr = `${monthNames[monthIndex]} ${calYear}`;

    let tdsAmount = 0;
    const isFyEnd = q % 4 === 0;
    const fyLabel = isFyEnd ? `FY${Math.ceil(q / 4)} End` : undefined;

    // Evaluate TDS at FY End or as interest crosses threshold
    let tdsStatus = `Exempt (<₹${Math.round(exemptionThreshold / 1000)}k)`;
    const fyInterestSoFar = q <= 4 ? fy1Interest : q <= 8 ? fy2Interest : fy3Interest;

    if (fyInterestSoFar > exemptionThreshold && tdsRate > 0) {
      tdsAmount = Math.round((fyInterestSoFar - exemptionThreshold) * tdsRate);
      tdsStatus = `${tdsRate * 100}% TDS (₹${formatINR(tdsAmount)})`;
    } else if (form15HSubmitted) {
      tdsStatus = 'Form 15G/15H (₹0 TDS)';
    }

    if (isFyEnd && tdsAmount > 0) {
      totalTds += tdsAmount;
    }

    quarters.push({
      quarter: q,
      label: `Q${q}`,
      date: dateStr,
      openingBalance: opening,
      interestEarned: interest,
      cumulativeInterest: cumInterest,
      closingBalance: currentBalance,
      tdsAmount,
      tdsStatus,
      fyLabel,
      isFyEnd,
    });

    timelineData.push({
      period: `M${q * 3}`,
      month: q * 3,
      deposit: 0,
      cumulativeDeposit: principal,
      balance: currentBalance,
      interestEarned: cumInterest,
    });
  }

  const maturityAmount = currentBalance;
  const totalInterest = maturityAmount - principal;
  const effectiveAnnualYield = Number(((totalInterest / (principal * t)) * 100).toFixed(2));
  const estimatedTdsYear3 = fy3Interest > exemptionThreshold ? Math.round(fy3Interest * tdsRate) : 0;
  const netMaturityWithTds = form15HSubmitted ? maturityAmount : maturityAmount - totalTds;

  return {
    depositType: 'FD',
    appliedRate: annualRate,
    effectiveAnnualYield,
    totalInvested: principal,
    maturityAmount,
    totalInterest,
    annualInterestFY1: fy1Interest,
    annualInterestFY2: fy2Interest,
    annualInterestFY3: fy3Interest,
    estimatedTdsYear3,
    totalTdsDeducted: totalTds,
    netMaturityWithTds,
    quarters,
    timelineData,
  };
}

/**
 * Calculates Recurring Deposit (RD) Yield with quarterly compounding of monthly installments
 * RBI Standard Formula: A = Sum_{k=1}^n M * (1 + r/400)^( (n - k + 1) / 3 )
 */
export function calculateRDYield(
  monthlyInstallment: number,
  annualRate: number,
  tenureMonths: number,
  age: number,
  form15HSubmitted: boolean = false,
  panLinked: boolean = true
): CalculationResult {
  const M = monthlyInstallment;
  const n = tenureMonths;
  const r = annualRate;
  const quartersCount = Math.max(1, Math.round(n / 3));

  // Compute exact maturity value using RBI installment compounding formula
  let maturityAmount = 0;
  for (let k = 1; k <= n; k++) {
    const remainingMonths = n - k + 1;
    // Quarterly compounding: (1 + r/400)^(remainingMonths / 3)
    const factor = Math.pow(1 + r / 400, remainingMonths / 3);
    maturityAmount += M * factor;
  }
  maturityAmount = Math.round(maturityAmount);

  const totalInvested = M * n;
  const totalInterest = Math.max(0, maturityAmount - totalInvested);

  // Build quarter-by-quarter and timeline breakdown
  const quarters: QuarterData[] = [];
  const timelineData: TimelineDataPoint[] = [];

  let runningBalance = 0;
  let cumInterest = 0;
  let fy1Interest = 0;
  let fy2Interest = 0;
  let fy3Interest = 0;
  let totalTds = 0;

  const exemptionThreshold = age >= 60 ? 50000 : 40000;
  const tdsRate = form15HSubmitted ? 0 : panLinked ? 0.10 : 0.20;

  const startYear = 2025;
  const monthNames = ['Jul', 'Oct', 'Jan', 'Apr'];

  timelineData.push({
    period: 'Start',
    month: 0,
    deposit: 0,
    cumulativeDeposit: 0,
    balance: 0,
    interestEarned: 0,
  });

  // Calculate quarterly progression
  for (let q = 1; q <= quartersCount; q++) {
    const opening = runningBalance;
    const installmentsThisQuarter = Math.min(3, Math.max(0, n - (q - 1) * 3));
    const depositThisQuarter = installmentsThisQuarter * M;

    // Compounded quarterly balance approximation for intermediate schedule
    const monthsElapsed = Math.min(q * 3, n);
    let interimTarget = 0;
    for (let k = 1; k <= monthsElapsed; k++) {
      const remainingInThisSlice = monthsElapsed - k + 1;
      interimTarget += M * Math.pow(1 + r / 400, remainingInThisSlice / 3);
    }
    interimTarget = Math.round(interimTarget);

    const interest = Math.max(0, interimTarget - (opening + depositThisQuarter));
    cumInterest += interest;
    runningBalance = interimTarget;

    if (q <= 4) fy1Interest += interest;
    else if (q <= 8) fy2Interest += interest;
    else if (q <= 12) fy3Interest += interest;

    const monthIndex = (q - 1) % 4;
    const calYear = startYear + Math.floor((q + 1) / 4);
    const dateStr = `${monthNames[monthIndex]} ${calYear}`;

    let tdsAmount = 0;
    const isFyEnd = q % 4 === 0;
    const fyLabel = isFyEnd ? `FY${Math.ceil(q / 4)} End` : undefined;

    const fyInterestSoFar = q <= 4 ? fy1Interest : q <= 8 ? fy2Interest : fy3Interest;
    let tdsStatus = `Exempt (<₹${Math.round(exemptionThreshold / 1000)}k)`;

    if (fyInterestSoFar > exemptionThreshold && tdsRate > 0) {
      tdsAmount = Math.round((fyInterestSoFar - exemptionThreshold) * tdsRate);
      tdsStatus = `${tdsRate * 100}% TDS (₹${formatINR(tdsAmount)})`;
    } else if (form15HSubmitted) {
      tdsStatus = 'Form 15G/15H (₹0 TDS)';
    }

    if (isFyEnd && tdsAmount > 0) {
      totalTds += tdsAmount;
    }

    quarters.push({
      quarter: q,
      label: `Q${q}`,
      date: dateStr,
      openingBalance: opening,
      interestEarned: interest,
      cumulativeInterest: cumInterest,
      closingBalance: runningBalance,
      tdsAmount,
      tdsStatus,
      fyLabel,
      isFyEnd,
    });

    timelineData.push({
      period: `M${monthsElapsed}`,
      month: monthsElapsed,
      deposit: depositThisQuarter,
      cumulativeDeposit: monthsElapsed * M,
      balance: runningBalance,
      interestEarned: cumInterest,
    });
  }

  // Ensure exact final match with closed formula
  if (quarters.length > 0) {
    quarters[quarters.length - 1].closingBalance = maturityAmount;
    quarters[quarters.length - 1].cumulativeInterest = totalInterest;
  }
  if (timelineData.length > 0) {
    timelineData[timelineData.length - 1].balance = maturityAmount;
    timelineData[timelineData.length - 1].interestEarned = totalInterest;
  }

  const t = tenureMonths / 12;
  const effectiveAnnualYield = Number(((totalInterest / (totalInvested * (t / 2))) * 100).toFixed(2));
  const estimatedTdsYear3 = fy3Interest > exemptionThreshold ? Math.round(fy3Interest * tdsRate) : 0;
  const netMaturityWithTds = form15HSubmitted ? maturityAmount : maturityAmount - totalTds;

  return {
    depositType: 'RD',
    appliedRate: annualRate,
    effectiveAnnualYield,
    totalInvested,
    maturityAmount,
    totalInterest,
    annualInterestFY1: fy1Interest,
    annualInterestFY2: fy2Interest,
    annualInterestFY3: fy3Interest,
    estimatedTdsYear3,
    totalTdsDeducted: totalTds,
    netMaturityWithTds,
    quarters,
    timelineData,
  };
}

/**
 * Polymorphic Calculation Entrypoint
 */
export function calculateYield(
  amount: number,
  annualRate: number,
  tenureMonths: number,
  age: number,
  form15HSubmitted: boolean = false,
  depositType: DepositType = 'FD',
  panLinked: boolean = true
): CalculationResult {
  if (depositType === 'RD') {
    return calculateRDYield(amount, annualRate, tenureMonths, age, form15HSubmitted, panLinked);
  }
  return calculateFDYield(amount, annualRate, tenureMonths, age, form15HSubmitted, panLinked);
}
