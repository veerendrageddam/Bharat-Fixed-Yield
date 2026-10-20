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

  it('renders progressive lazy loading with initial batch of 10 and supports Load More & Batch switching', () => {
    // Render with all-india persona to ensure full dataset
    const panIndiaPersona: UserPersona = { ...mockPersona, state: 'All India (Pan-India)' };
    render(<YieldCommandCenter {...defaultProps} persona={panIndiaPersona} />);

    // Check header counter
    expect(screen.getByText(/Showing 10 of/i)).toBeInTheDocument();

    // Check progress and Load More button
    const loadMoreBtn = screen.getByRole('button', { name: /Load More/i });
    expect(loadMoreBtn).toBeInTheDocument();

    // Click Load More (+10) -> should increase visible count to 20
    fireEvent.click(loadMoreBtn);
    expect(screen.getByText(/Showing 20 of/i)).toBeInTheDocument();

    // Switch batch size to 5
    const batch5Btn = screen.getByRole('button', { name: /Show 5 records per batch/i });
    fireEvent.click(batch5Btn);
    expect(screen.getByText(/Showing 5 of/i)).toBeInTheDocument();

    // Click Show All
    const showAllBtn = screen.getByRole('button', { name: /Show All/i });
    fireEvent.click(showAllBtn);
    expect(screen.getByText(/All \d+ institutions loaded/i)).toBeInTheDocument();
  });
});

