import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { YieldCommandCenter } from './YieldCommandCenter';
import { INITIAL_BANKS } from '../data/bankData';
import { UserPersona } from '../types/bank';

describe('YieldCommandCenter Component UI, Accessibility & Search Interactions', () => {
  const mockPersona: UserPersona = {
    depositType: 'FD',
    principal: 500000,
    monthlyInstallment: 10000,
    tenureMonths: 36,
    compounding: 'quarterly',
    age: 62,
    gender: 'male',
    state: 'Maharashtra',
    residency: 'resident',
    panLinked: true,
    form15HSubmitted: false,
  };

  const defaultProps = {
    persona: mockPersona,
    setPersona: vi.fn(),
    banks: INITIAL_BANKS,
    onInspectBank: vi.fn(),
    onInvest: vi.fn(),
    comparedBankIds: [],
    onToggleCompare: vi.fn(),
    onNavigateTab: vi.fn(),
  };

  it('renders deposit configuration inputs and verified rate badge', () => {
    render(<YieldCommandCenter {...defaultProps} />);
    expect(screen.getByText(/Principal Deposit Sum/i)).toBeInTheDocument();
    expect(screen.getByText(/Tenure Horizon & Special Bank Schemes/i)).toBeInTheDocument();
    expect(screen.getByText(/Verified:/i)).toBeInTheDocument();
  });

  it('switches labels dynamically when depositType is RD', () => {
    const rdPersona: UserPersona = { ...mockPersona, depositType: 'RD' };
    render(<YieldCommandCenter {...defaultProps} persona={rdPersona} />);
    expect(screen.getByText(/Monthly Installment Amount/i)).toBeInTheDocument();
  });

  it('filters banks and displays the Amalgamation Guidance Banner when searching for erstwhile APGVB', () => {
    render(<YieldCommandCenter {...defaultProps} />);
    const searchInput = screen.getByLabelText(/Search banks or erstwhile merged entities/i);
    fireEvent.change(searchInput, { target: { value: 'APGVB' } });

    // Expect the Amalgamation Guidance Banner to appear
    expect(screen.getByText(/Amalgamated \/ Restructured/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Andhra Pradesh Grameena Vikas Bank/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Telangana Grameena Bank/i).length).toBeGreaterThan(0);
  });

  it('renders a friendly Empty State with Reset CTA when search has no matching banks', () => {
    render(<YieldCommandCenter {...defaultProps} />);
    const searchInput = screen.getByLabelText(/Search banks or erstwhile merged entities/i);
    fireEvent.change(searchInput, { target: { value: 'NonExistentBankXYZ999' } });

    expect(screen.getByText(/No Banks Match Your Criteria/i)).toBeInTheDocument();
    const resetBtn = screen.getByRole('button', { name: /Reset All Filters & Search/i });
    expect(resetBtn).toBeInTheDocument();

    // Clicking reset should clear search input
    fireEvent.click(resetBtn);
    expect(searchInput).toHaveValue('');
  });

  it('renders all filtered institutions directly with category count badges and full transparency', () => {
    // Render with all-india persona to ensure full dataset
    const panIndiaPersona: UserPersona = { ...mockPersona, state: 'All India (Pan-India)' };
    render(<YieldCommandCenter {...defaultProps} persona={panIndiaPersona} />);

    // Check header counter shows full count directly without batch slicing
    expect(screen.getByText(/Showing \d+ Banks/i)).toBeInTheDocument();

    // Verify representative mock banks are rendered in the DOM
    expect(screen.getByText('Unity Small Finance Bank')).toBeInTheDocument();
    expect(screen.getByText(/State Bank of India \(SBI/i)).toBeInTheDocument();
    expect(screen.getByText('HDFC Bank')).toBeInTheDocument();

    // Verify footer summary is present with 100% verified status
    expect(screen.getByText(/institutions matching criteria/i)).toBeInTheDocument();
    expect(screen.getByText(/100% RBI & DICGC verified/i)).toBeInTheDocument();

    // Switch to Small Finance Banks category
    const sfbCategoryBtn = screen.getByRole('button', { name: /Small Finance Banks/i });
    fireEvent.click(sfbCategoryBtn);

    // After filtering by category, counter shows subset of total
    expect(screen.getByText(/Showing \d+ of \d+ Banks/i)).toBeInTheDocument();

    // Unity SFB should remain visible, SBI should not match SFB category
    expect(screen.getByText('Unity Small Finance Bank')).toBeInTheDocument();
    expect(screen.queryByText('State Bank of India (Amrit Vrishti)')).not.toBeInTheDocument();
  });
});

