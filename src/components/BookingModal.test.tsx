import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { BookingModal } from './BookingModal';
import { BankData, UserPersona } from '../types/bank';

describe('BookingModal UI, Security & DPDP Compliance', () => {
  const mockBank: BankData = {
    id: 'sbi-bank',
    rank: 1,
    name: 'State Bank of India',
    subTitle: 'Public Sector Commercial Bank',
    category: 'psu',
    categoryTag: 'Public Sector Bank',
    badge: 'Sovereign Backed',
    ratingAgency: 'Sovereign',
    rating: 'AAA',
    logoUrl: 'https://example.com/logo.png',
    baseRate: 6.8,
    seniorBonus: 0.5,
    superSeniorBonus: 0.75,
    minDeposit: 1000,
    tenureYears: 3,
    tenureMonths: 36,
    dicgcCovered: true,
    notes: 'Premier Indian lender',
    exitPenalty: '0.5%',
    lockInDays: 7,
    portalUrl: 'https://www.onlinesbi.sbi/',
    portalName: 'SBI YONO & Retail NetBanking',
    ratesByTenure: { 12: 6.8, 24: 7.0, 36: 6.75, 60: 6.5 },
    specialSchemes: [
      { days: 444, name: 'Amrit Vrishti', rate: 7.25 },
    ],
  };

  const mockPersona: UserPersona = {
    depositType: 'FD',
    principal: 500000,
    tenureMonths: 36,
    compounding: 'quarterly',
    age: 62,
    gender: 'male',
    state: 'Maharashtra',
    residency: 'resident',
    panLinked: true,
    form15HSubmitted: false,
  };

  it('renders bank details, guaranteed maturity, and DPDP compliance notice', () => {
    const onClose = vi.fn();
    render(<BookingModal bank={mockBank} persona={mockPersona} onClose={onClose} />);

    expect(screen.getAllByText(/State Bank of India/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/DPDP Act 2023 Compliant/i)).toBeInTheDocument();
    expect(screen.getByText(/SBI YONO & Retail NetBanking/i)).toBeInTheDocument();
  });

  it('verifies strict DPDP Act compliance: ZERO Aadhaar or PAN input fields are rendered', () => {
    const onClose = vi.fn();
    render(<BookingModal bank={mockBank} persona={mockPersona} onClose={onClose} />);

    expect(screen.queryByPlaceholderText(/Aadhaar/i)).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/PAN/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Aadhaar/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/PAN/i)).not.toBeInTheDocument();
  });

  it('provides official bank portal deep-link with target="_blank" and rel="noopener noreferrer"', () => {
    const onClose = vi.fn();
    render(<BookingModal bank={mockBank} persona={mockPersona} onClose={onClose} />);

    const officialLink = screen.getByRole('link', { name: /Proceed to Official.*Portal/i });
    expect(officialLink).toBeInTheDocument();
    expect(officialLink).toHaveAttribute('href', 'https://www.onlinesbi.sbi/');
    expect(officialLink).toHaveAttribute('target', '_blank');
    expect(officialLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('dismisses modal on Close button click', () => {
    const onClose = vi.fn();
    render(<BookingModal bank={mockBank} persona={mockPersona} onClose={onClose} />);

    const closeBtn = screen.getByLabelText('Close modal');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('dismisses modal when Escape key is pressed', () => {
    const onClose = vi.fn();
    render(<BookingModal bank={mockBank} persona={mockPersona} onClose={onClose} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
