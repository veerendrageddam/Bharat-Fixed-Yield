import { BankData, CalculationResult, QuarterData, UserPersona } from '../types/bank';

export function formatINR(val: number): string {
  return val.toLocaleString('en-IN');
}

export function formatLakhs(val: number): string {
  if (val >= 10000000) {
    return (val / 10000000).toFixed(2) + ' Crores';
  } else if (val >= 100000) {
    return (val / 100000).toFixed(2) + ' Lakhs';
  }
  return formatINR(val);
}

export function getEffectiveRate(bank: BankData, persona: UserPersona): number {
  let rate = bank.baseRate;
  if (persona.age >= 80) {
    rate += bank.superSeniorBonus;
  } else if (persona.age >= 60) {
    rate += bank.seniorBonus;
  }
  return Number(rate.toFixed(2));
}

export function calculateYield(
  principal: number,
  annualRate: number,
  tenureMonths: number,
  age: number,
  form15HSubmitted: boolean = false
): CalculationResult {
  const r = annualRate;
  const quartersCount = Math.max(1, Math.round(tenureMonths / 3));
  const t = tenureMonths / 12;

  // Indian Banking formula for quarterly compounding: A = P * (1 + r/400)^quartersCount
  const quarterlyFactor = 1 + r / 400;
  let currentBalance = principal;
  let cumInterest = 0;
  const quarters: QuarterData[] = [];

  const startYear = 2025;
  const monthNames = ['Jul', 'Oct', 'Jan', 'Apr'];

  let fy1Interest = 0;
  let fy2Interest = 0;
  let fy3Interest = 0;

  const exemptionThreshold = age >= 60 ? 50000 : 40000;

  for (let q = 1; q <= quartersCount; q++) {
    const opening = currentBalance;
    const interest = Math.round(opening * (r / 400));
    cumInterest += interest;
    currentBalance = opening + interest;

    // Track FY
    if (q <= 4) {
      fy1Interest += interest;
    } else if (q <= 8) {
      fy2Interest += interest;
    } else if (q <= 12) {
      fy3Interest += interest;
    }

    const monthIndex = (q - 1) % 4;
    const yearOffset = Math.floor((q - 1) / 4);
    const calYear = startYear + Math.floor((q + 1) / 4);
    const dateStr = `${monthNames[monthIndex]} ${calYear}`;

    let tdsStatus = `Exempt (<₹${Math.round(exemptionThreshold / 1000)}k)`;
    let tdsAmount = 0;
    let isFyEnd = q % 4 === 0;
    let fyLabel = isFyEnd ? `FY${Math.ceil(q / 4)} End` : undefined;

    if (q <= 4) {
      if (fy1Interest > exemptionThreshold) {
        tdsAmount = Math.round((fy1Interest - exemptionThreshold) * 0.1);
        tdsStatus = form15HSubmitted ? 'Form 15H (₹0 TDS)' : `10% TDS (₹${formatINR(tdsAmount)})`;
      } else {
        tdsStatus = `Exempt (<₹${Math.round(exemptionThreshold / 1000)}k)`;
      }
    } else if (q <= 8) {
      if (fy2Interest > exemptionThreshold) {
        tdsAmount = Math.round((fy2Interest - exemptionThreshold) * 0.1);
        tdsStatus = form15HSubmitted ? 'Form 15H (₹0 TDS)' : `10% TDS (₹${formatINR(tdsAmount)})`;
      } else {
        tdsStatus = `Exempt (<₹${Math.round(exemptionThreshold / 1000)}k)`;
      }
    } else if (q <= 12) {
      if (q === 9 || q === 10) {
        tdsStatus = 'FY3 Accumulating';
      } else if (q === 11) {
        tdsStatus = 'Limit Approached';
      } else if (q === 12) {
        if (fy3Interest > exemptionThreshold) {
          tdsAmount = Math.round(fy3Interest * 0.1);
          tdsStatus = form15HSubmitted ? 'Form 15H (₹0 TDS)' : `10% TDS (₹${formatINR(tdsAmount)})`;
        }
      }
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
  }

  // Exact maturity amount
  const maturityAmount = currentBalance;
  const totalInterest = maturityAmount - principal;

  // Annualized Simple Yield convention used in Indian banking: (Total Interest / (Principal * t)) * 100
  const effectiveAnnualYield = Number(((totalInterest / (principal * t)) * 100).toFixed(2));

  // Year 3 TDS deduction estimate (10% of Year 3 interest if > exemptionThreshold)
  const estimatedTdsYear3 = fy3Interest > exemptionThreshold ? Math.round(fy3Interest * 0.1) : 0;
  const netMaturityWithTds = form15HSubmitted ? maturityAmount : maturityAmount - estimatedTdsYear3;

  return {
    appliedRate: annualRate,
    effectiveAnnualYield,
    maturityAmount,
    totalInterest,
    annualInterestFY1: fy1Interest,
    annualInterestFY2: fy2Interest,
    annualInterestFY3: fy3Interest,
    estimatedTdsYear3,
    netMaturityWithTds,
    quarters,
  };
}
