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
 * Resolves the effective rate for a bank based on persona, tenure (months or odd days), and custom rate override
 */
export function getEffectiveRate(
  bank: BankData,
  persona: UserPersona,
  tenureMonths?: number,
  tenureDays?: number
): number {
  // If user entered a custom rate and enabled custom rate mode, respect that custom rate directly
  if (persona.useCustomRate && persona.customRate !== undefined && persona.customRate > 0) {
    return Number(persona.customRate.toFixed(2));
  }

  const effectiveDays = tenureDays ?? (persona.tenureUnit === 'days' ? persona.tenureDays : undefined);
  let rate = bank.baseRate ?? 0;

  // Use RD tenure rates if user selected RD and bank defines distinct RD rates
  const ratesMatrix = (persona.depositType === 'RD' && bank.rdRatesByTenure && Object.keys(bank.rdRatesByTenure).length > 0)
    ? bank.rdRatesByTenure
    : bank.ratesByTenure;

  // 1. Check if an odd-day special high-yield scheme matches (e.g. 222D, 399D, 400D, 444D, 555D, 1001D)
  if (effectiveDays && bank.specialSchemes && bank.specialSchemes.length > 0) {
    // Exact or nearest special scheme within 10 days
    const matchedScheme = bank.specialSchemes.find(
      (s) => Math.abs(s.days - effectiveDays) <= 10
    );
    if (matchedScheme) {
      rate = matchedScheme.rate;
    } else {
      // Approximate day count to months
      const approxMonths = Math.round(effectiveDays / 30.41);
      if (ratesMatrix && ratesMatrix[approxMonths] !== undefined) {
        rate = ratesMatrix[approxMonths];
      }
    }
  } else {
    const targetTenure = tenureMonths ?? persona.tenureMonths;
    if (ratesMatrix && ratesMatrix[targetTenure] !== undefined) {
      rate = ratesMatrix[targetTenure];
    }
  }

  // Age bonuses
  if (persona.age >= 80) {
    rate += (bank.superSeniorBonus ?? bank.seniorBonus ?? 0);
  } else if (persona.age >= 60) {
    rate += (bank.seniorBonus ?? 0);
  }

  // Women depositor bonus
  if (persona.gender === 'female' && bank.womenBonus) {
    rate += (bank.womenBonus ?? 0);
  }

  if (isNaN(rate)) {
    rate = bank.baseRate ?? 0;
  }

  return Number((rate || 0).toFixed(2));
}

/**
 * Calculates Fixed Deposit Yield with quarterly compounding (RBI Banking Standard)
 * Supports both standard months and odd-day tenures (e.g. 222D, 444D, 555D, 1001D)
 * Formula: A = P * (1 + r/400)^(4 * t) where t = days/365 or months/12
 */
export function calculateFDYield(
  principal: number,
  annualRate: number,
  tenureMonths: number,
  age: number,
  form15HSubmitted: boolean = false,
  panLinked: boolean = true,
  tenureDays?: number
): CalculationResult {
  const r = annualRate;
  const isDaysMode = tenureDays !== undefined && tenureDays > 0;
  const t = isDaysMode ? tenureDays / 365 : tenureMonths / 12;
  const quartersCount = Math.max(1, isDaysMode ? Math.round(tenureDays / 91.25) : Math.round(tenureMonths / 3));

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

  // Initial timeline point at start
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

    const elapsedLabel = isDaysMode ? `Day ${Math.min(tenureDays, Math.round(q * 91.25))}` : `M${q * 3}`;
    timelineData.push({
      period: elapsedLabel,
      month: isDaysMode ? Math.round((q * 91.25) / 30.41) : q * 3,
      deposit: 0,
      cumulativeDeposit: principal,
      balance: currentBalance,
      interestEarned: cumInterest,
    });
  }

  // Exact maturity value using RBI fractional quarterly compounding: A = P * (1 + r/400)^(4 * t)
  const exactMaturityAmount = Math.round(principal * Math.pow(1 + r / 400, 4 * t));
  const maturityAmount = exactMaturityAmount > 0 ? exactMaturityAmount : currentBalance;
  const totalInterest = Math.max(0, maturityAmount - principal);

  if (quarters.length > 0) {
    quarters[quarters.length - 1].closingBalance = maturityAmount;
    quarters[quarters.length - 1].cumulativeInterest = totalInterest;
  }
  if (timelineData.length > 0) {
    timelineData[timelineData.length - 1].balance = maturityAmount;
    timelineData[timelineData.length - 1].interestEarned = totalInterest;
    if (isDaysMode) {
      timelineData[timelineData.length - 1].period = `Day ${tenureDays}`;
    }
  }

  const effectiveAnnualYield = Number(((totalInterest / (principal * t)) * 100).toFixed(2));
  const estimatedTdsYear3 = fy3Interest > exemptionThreshold ? Math.round(fy3Interest * tdsRate) : 0;
  const netMaturityWithTds = form15HSubmitted ? maturityAmount : Math.max(principal, maturityAmount - totalTds);

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
  panLinked: boolean = true,
  tenureDays?: number
): CalculationResult {
  const M = monthlyInstallment;
  const isDaysMode = tenureDays !== undefined && tenureDays > 0;
  const n = isDaysMode ? Math.max(1, Math.round(tenureDays / 30.41)) : tenureMonths;
  const r = annualRate;
  const quartersCount = Math.max(1, Math.round(n / 3));

  let maturityAmount = 0;
  for (let k = 1; k <= n; k++) {
    const remainingMonths = n - k + 1;
    const factor = Math.pow(1 + r / 400, remainingMonths / 3);
    maturityAmount += M * factor;
  }
  maturityAmount = Math.round(maturityAmount);

  const totalInvested = M * n;
  const totalInterest = Math.max(0, maturityAmount - totalInvested);

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

  for (let q = 1; q <= quartersCount; q++) {
    const opening = runningBalance;
    const installmentsThisQuarter = Math.min(3, Math.max(0, n - (q - 1) * 3));
    const depositThisQuarter = installmentsThisQuarter * M;

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

  if (quarters.length > 0) {
    quarters[quarters.length - 1].closingBalance = maturityAmount;
    quarters[quarters.length - 1].cumulativeInterest = totalInterest;
  }
  if (timelineData.length > 0) {
    timelineData[timelineData.length - 1].balance = maturityAmount;
    timelineData[timelineData.length - 1].interestEarned = totalInterest;
  }

  const t = n / 12;
  const effectiveAnnualYield = Number(((totalInterest / (totalInvested * (t / 2))) * 100).toFixed(2));
  const estimatedTdsYear3 = fy3Interest > exemptionThreshold ? Math.round(fy3Interest * tdsRate) : 0;
  const netMaturityWithTds = form15HSubmitted ? maturityAmount : Math.max(totalInvested, maturityAmount - totalTds);

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
  panLinked: boolean = true,
  tenureDays?: number
): CalculationResult {
  if (depositType === 'RD') {
    return calculateRDYield(amount, annualRate, tenureMonths, age, form15HSubmitted, panLinked, tenureDays);
  }
  return calculateFDYield(amount, annualRate, tenureMonths, age, form15HSubmitted, panLinked, tenureDays);
}
