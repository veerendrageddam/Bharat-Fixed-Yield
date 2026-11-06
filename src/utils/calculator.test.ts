import { describe, it, expect } from 'vitest';
import {
  calculateFDYield,
  calculateRDYield,
  calculateYield,
  getEffectiveRate,
  isTenureSupported,
  formatINR,
  formatLakhs,
} from './calculator';
import { BankData, UserPersona } from '../types/bank';

describe('Calculator Core Engineering & Math Engine', () => {
  describe('formatINR & formatLakhs', () => {
    it('formats Indian currency numbers with proper comma grouping', () => {
      expect(formatINR(500000)).toBe('5,00,000');
      expect(formatINR(10000000)).toBe('1,00,00,000');
      expect(formatINR(1000)).toBe('1,000');
      expect(formatINR(0)).toBe('0');
      expect(formatINR(NaN)).toBe('0');
    });

    it('formats lakhs and crores with descriptive suffix', () => {
      expect(formatLakhs(500000)).toBe('5.00 Lakhs');
      expect(formatLakhs(10000000)).toBe('1.00 Crores');
      expect(formatLakhs(50000)).toBe('50,000');
    });
  });

  describe('Fixed Deposit (FD) Compounding', () => {
    it('calculates RBI quarterly compounding accurately for standard tenures', () => {
      // Principal = 1,00,000, Rate = 8.00% p.a., Tenure = 12 months (1 year = 4 quarters), Age = 45
      // A = 100000 * (1 + 0.08 / 4)^4 = 100000 * (1.02)^4 = 108243.216 -> 108243
      const result = calculateFDYield(100000, 8.0, 12, 45);
      expect(result.totalInvested).toBe(100000);
      expect(result.maturityAmount).toBe(108243);
      expect(result.totalInterest).toBe(8243);
      expect(result.quarters.length).toBe(4);
    });

    it('calculates RBI odd-day compounding accurately for special schemes', () => {
      // Principal = 1,00,000, Rate = 7.25%, Tenure = 444 days
      const result = calculateFDYield(100000, 7.25, 14, 45, false, true, 444);
      expect(result.totalInvested).toBe(100000);
      expect(result.maturityAmount).toBeGreaterThan(108000);
      expect(result.totalInterest).toBe(result.maturityAmount - 100000);
    });

    it('handles TDS withholding when interest exceeds 40,000 threshold for general citizens', () => {
      // Principal = 10,00,000, Rate = 8.0%, Tenure = 12M -> interest ~82,432 (exceeds 40k threshold)
      const result = calculateFDYield(1000000, 8.0, 12, 45, false, true);
      expect(result.totalTdsDeducted).toBeGreaterThan(0);
      expect(result.netMaturityWithTds).toBe(result.maturityAmount - result.totalTdsDeducted);
    });

    it('zeros out TDS when Form 15G/15H is submitted', () => {
      const resultWith15H = calculateFDYield(1000000, 8.0, 12, 65, true, true);
      expect(resultWith15H.totalTdsDeducted).toBe(0);
      expect(resultWith15H.netMaturityWithTds).toBe(resultWith15H.maturityAmount);
    });
  });

  describe('Recurring Deposit (RD) Compounding', () => {
    it('calculates RBI installment compounding for RD accurately', () => {
      // Monthly installment = 10,00, Rate = 7.5%, Tenure = 12 months, Age = 45
      // Total deposited = 1,20,000
      const result = calculateRDYield(10000, 7.5, 12, 45);
      expect(result.totalInvested).toBe(120000);
      expect(result.maturityAmount).toBeGreaterThan(120000);
      expect(result.totalInterest).toBe(result.maturityAmount - 120000);
      expect(result.quarters.length).toBe(4);
    });
  });

  describe('Polymorphic calculateYield Gateway', () => {
    it('delegates to FD calculation when depositType is FD', () => {
      const fd = calculateYield(100000, 7.5, 12, 45, false, 'FD');
      expect(fd.totalInvested).toBe(100000);
      expect(fd.depositType).toBe('FD');
    });

    it('delegates to RD calculation when depositType is RD', () => {
      const rd = calculateYield(10000, 7.5, 12, 45, false, 'RD');
      expect(rd.totalInvested).toBe(120000);
      expect(rd.depositType).toBe('RD');
    });
  });

  describe('getEffectiveRate Persona Resolution', () => {
    const mockBank: BankData = {
      id: 'test-bank',
      rank: 1,
      name: 'Test Bank',
      subTitle: 'Test Subtitle',
      category: 'sfb',
      categoryTag: 'Small Finance Bank',
      badge: 'Test Badge',
      ratingAgency: 'CRISIL',
      rating: 'AAA',
      logoUrl: '',
      baseRate: 7.0,
      seniorBonus: 0.5,
      superSeniorBonus: 0.75,
      womenBonus: 0.1,
      minDeposit: 1000,
      tenureYears: 3,
      tenureMonths: 36,
      dicgcCovered: true,
      notes: 'Test notes',
      exitPenalty: '1%',
      lockInDays: 7,
      ratesByTenure: {
        12: 7.0,
        24: 7.3,
        36: 7.5,
        60: 7.2,
      },
      specialSchemes: [
        { days: 444, name: 'Special 444D', rate: 8.1 },
      ],
    };

    const basePersona: UserPersona = {
      depositType: 'FD',
      principal: 100000,
      tenureMonths: 36,
      compounding: 'quarterly',
      age: 35,
      gender: 'male',
      state: 'Maharashtra',
      residency: 'resident',
      panLinked: true,
      form15HSubmitted: false,
    };

    it('resolves standard general rate for 36 months', () => {
      const rate = getEffectiveRate(mockBank, basePersona, 36);
      expect(rate).toBe(7.5);
    });

    it('resolves senior citizen rate when age >= 60', () => {
      const rate = getEffectiveRate(mockBank, { ...basePersona, age: 65 }, 36);
      expect(rate).toBe(8.0); // 7.5 + 0.5
    });

    it('resolves super senior citizen rate when age >= 80', () => {
      const rate = getEffectiveRate(mockBank, { ...basePersona, age: 82 }, 36);
      expect(rate).toBe(8.25); // 7.5 + 0.75
    });

    it('adds women boost when gender is female', () => {
      const rate = getEffectiveRate(mockBank, { ...basePersona, gender: 'female' }, 36);
      expect(rate).toBe(7.6); // 7.5 + 0.1
    });

    it('resolves odd-day special scheme rate when tenureDays is provided', () => {
      const rate = getEffectiveRate(mockBank, basePersona, 14, 444);
      expect(rate).toBe(8.1);

      const seniorRate = getEffectiveRate(mockBank, { ...basePersona, age: 65 }, 14, 444);
      expect(seniorRate).toBe(8.6); // 8.1 + 0.5
    });

    it('respects useCustomRate and customRate when enabled', () => {
      const rate = getEffectiveRate(
        mockBank,
        { ...basePersona, useCustomRate: true, customRate: 8.45 },
        36
      );
      expect(rate).toBe(8.45);
    });

    it('does not resolve special odd-day schemes when depositType is RD', () => {
      const rdPersona: UserPersona = {
        ...basePersona,
        depositType: 'RD',
        tenureUnit: 'days',
        tenureDays: 444,
      };
      // In RD mode, odd-day scheme (8.1%) should NOT be resolved; should resolve monthly matrix (e.g. 7.5%)
      const rate = getEffectiveRate(mockBank, rdPersona, 36, 444);
      expect(rate).toBe(7.5);
    });
  });

  describe('isTenureSupported Validation', () => {
    const mockPordBank: BankData = {
      id: 'post-office-pord',
      rank: 23,
      name: 'Post Office 5-Year Recurring Deposit (PORD)',
      subTitle: 'India Post',
      category: 'post_office',
      badge: 'Sovereign 5Y RD',
      categoryTag: 'India Post',
      ratingAgency: 'Sovereign',
      rating: 'Sovereign',
      logoUrl: '',
      baseRate: 6.7,
      seniorBonus: 0,
      superSeniorBonus: 0,
      minDeposit: 100,
      tenureYears: 5,
      tenureMonths: 60,
      dicgcCovered: true,
      notes: '',
      exitPenalty: '',
      lockInDays: 1095,
      fdSupported: false,
      rdSupported: true,
      ratesByTenure: {
        60: 6.7,
      },
      rdRatesByTenure: {
        60: 6.7,
      },
    };

    const regularBank: BankData = {
      id: 'regular-bank',
      rank: 1,
      name: 'Regular Bank',
      subTitle: '',
      category: 'private',
      badge: '',
      categoryTag: '',
      ratingAgency: 'CRISIL',
      rating: 'AAA',
      logoUrl: '',
      baseRate: 7.0,
      seniorBonus: 0.5,
      superSeniorBonus: 0.75,
      minDeposit: 1000,
      tenureYears: 3,
      tenureMonths: 36,
      dicgcCovered: true,
      notes: '',
      exitPenalty: '',
      lockInDays: 7,
      fdSupported: true,
      rdSupported: true,
      ratesByTenure: {
        12: 7.0,
        24: 7.2,
        36: 7.5,
        60: 7.1,
      },
      specialSchemes: [
        { days: 444, name: 'Special 444D', rate: 7.8 },
      ],
    };

    it('enforces 60M exclusivity for Post Office PORD', () => {
      const rdPersona: UserPersona = {
        depositType: 'RD',
        principal: 5000,
        monthlyInstallment: 5000,
        tenureMonths: 12,
        compounding: 'quarterly',
        age: 40,
        gender: 'male',
        state: 'ALL',
        residency: 'resident',
        panLinked: true,
        form15HSubmitted: false,
      };

      // 12M, 24M, 36M are NOT supported for Post Office PORD
      expect(isTenureSupported(mockPordBank, rdPersona, 12)).toBe(false);
      expect(isTenureSupported(mockPordBank, rdPersona, 24)).toBe(false);
      expect(isTenureSupported(mockPordBank, rdPersona, 36)).toBe(false);

      // 60M IS supported
      expect(isTenureSupported(mockPordBank, rdPersona, 60)).toBe(true);

      // PORD does not support FD
      expect(isTenureSupported(mockPordBank, { ...rdPersona, depositType: 'FD' }, 60)).toBe(false);
    });

    it('disallows odd-day schemes for Recurring Deposits', () => {
      const rdPersona: UserPersona = {
        depositType: 'RD',
        principal: 5000,
        monthlyInstallment: 5000,
        tenureMonths: 15,
        tenureUnit: 'days',
        tenureDays: 444,
        compounding: 'quarterly',
        age: 40,
        gender: 'male',
        state: 'ALL',
        residency: 'resident',
        panLinked: true,
        form15HSubmitted: false,
      };

      // Odd-day tenures are not supported in RD mode
      expect(isTenureSupported(regularBank, rdPersona, 15, 444)).toBe(false);

      // Odd-day tenures ARE supported in FD mode when matching scheme exists
      expect(isTenureSupported(regularBank, { ...rdPersona, depositType: 'FD' }, 15, 444)).toBe(true);
    });
  });
});
