import { describe, it, expect } from 'vitest';
import {
  validateCircularUpdate,
  applyCircularUpdate,
  auditAllBankRates,
  loadCurrentRatesFile,
  BankCircularUpdate,
} from './circularEngine';

describe('Circular Ingestion & Regulatory Engine Tests', () => {
  it('rejects circular updates with unknown bankId', () => {
    const update: BankCircularUpdate = {
      bankId: 'invalid-fake-bank',
      effectiveDate: 'w.e.f. Oct 1, 2024',
      circularUrl: 'https://bank.com/rates.pdf',
      ratesByTenure: { '12': 7.00, '36': 7.25 },
    };
    const result = validateCircularUpdate(update);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Unknown or missing bankId'))).toBe(true);
  });

  it('rejects circular updates with missing effectiveDate or malformed URL', () => {
    const update: BankCircularUpdate = {
      bankId: 'sbi-bank',
      effectiveDate: '',
      circularUrl: 'not-a-valid-url',
      ratesByTenure: { '12': 7.00, '36': 7.25 },
    };
    const result = validateCircularUpdate(update);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('effectiveDate is required'))).toBe(true);
    expect(result.errors.some(e => e.includes('circularUrl must be a valid HTTP/HTTPS URL'))).toBe(true);
  });

  it('rejects interest rates exceeding financial safety bounds (3.0% - 11.5%)', () => {
    const update: BankCircularUpdate = {
      bankId: 'sbi-bank',
      effectiveDate: 'w.e.f. Oct 1, 2024',
      circularUrl: 'https://sbi.bank.in/rates.pdf',
      ratesByTenure: { '12': 2.50, '36': 15.00 }, // 2.50 < 3.0 and 15.00 > 11.5
    };
    const result = validateCircularUpdate(update);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });

  it('validates and applies a legitimate circular update with atomic diffing', () => {
    const current = loadCurrentRatesFile();
    const update: BankCircularUpdate = {
      bankId: 'sbi-bank',
      effectiveDate: 'w.e.f. November 1, 2024',
      circularUrl: 'https://sbi.bank.in/web/interest-rates/deposit-rates',
      baseRate: 6.85,
      ratesByTenure: { '12': 6.90, '24': 7.05, '36': 6.85, '60': 6.60 },
      specialTenure: '444 Days Amrit Vrishti (7.35%)',
      specialSchemes: [
        { name: 'SBI Amrit Vrishti', days: 444, rate: 7.35, badge: 'Special 444D (7.35%)' },
      ],
      seniorBonus: 0.50,
      superSeniorBonus: 0.75,
    };

    const { success, diff, ratesFile } = applyCircularUpdate(update, current);
    expect(success).toBe(true);
    expect(diff.bankId).toBe('sbi-bank');
    expect(diff.newStatus).toBe('circular_verified');
    expect(diff.effectiveDate).toBe('w.e.f. November 1, 2024');

    const updatedBank = ratesFile.banks['sbi-bank'];
    expect(updatedBank.baseRate).toBe(6.85);
    expect(updatedBank.ratesByTenure?.['12']).toBe(6.90);
    expect(updatedBank.ratesByTenure?.['36']).toBe(6.85);
    expect(updatedBank.specialSchemes?.[0].rate).toBe(7.35);
    expect(updatedBank.verificationStatus).toBe('circular_verified');
  });

  it('audits all 38 bank records ensuring zero missing circular URLs or effective dates', () => {
    const report = auditAllBankRates();
    expect(report.totalBanks).toBe(38);
    expect(report.missingEffectiveDateCount).toBe(0);
    expect(report.missingCircularUrlCount).toBe(0);
    expect(report.fetchFailedCount).toBe(0);

    // Verify all institutions have complete tenure coverage
    for (const b of report.banks) {
      if (b.category !== 'post_office' || b.id === 'post-office-potd') {
        expect(b.has60M).toBe(true); // Tax saver 5-year availability
      }
      expect(b.baseRate).toBeGreaterThanOrEqual(3.0);
      expect(b.baseRate).toBeLessThanOrEqual(11.5);
    }
  });
});

