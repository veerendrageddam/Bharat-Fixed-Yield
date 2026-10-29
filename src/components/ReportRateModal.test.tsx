import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ReportRateModal, getStoredCommunityReports } from './ReportRateModal';
import { INITIAL_BANKS } from '../data/bankData';

describe('ReportRateModal Component', () => {
  const mockOnClose = vi.fn();
  const testBank = INITIAL_BANKS[0]; // SBI

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders modal dialog with accessible labels when open', () => {
    render(<ReportRateModal bank={testBank} isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Report Rate Revision')).toBeInTheDocument();
    expect(screen.getByLabelText(/Banking Institution/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Reported Rate/i)).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(<ReportRateModal bank={testBank} isOpen={false} onClose={mockOnClose} />);
    expect(container.firstChild).toBeNull();
  });

  it('closes on Escape key press (WCAG 2.1.2)', () => {
    render(<ReportRateModal bank={testBank} isOpen={true} onClose={mockOnClose} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('validates rate range and rejects rate outside 3.00% - 11.50%', () => {
    const { container } = render(<ReportRateModal bank={testBank} isOpen={true} onClose={mockOnClose} />);

    const rateInput = screen.getByLabelText(/Reported Rate/i);
    const form = container.querySelector('form')!;

    // Input invalid high rate 15.0%
    fireEvent.change(rateInput, { target: { value: '15.0' } });
    fireEvent.submit(form);

    expect(screen.getByText(/Reported interest rate must be a valid number between 3.00% and 11.50%/i)).toBeInTheDocument();
  });

  it('successfully submits valid rate revision and stores in localStorage without PII', () => {
    const { container } = render(<ReportRateModal bank={testBank} isOpen={true} onClose={mockOnClose} />);

    const rateInput = screen.getByLabelText(/Reported Rate/i);
    const sourceInput = screen.getByLabelText(/Official Circular URL/i);
    const form = container.querySelector('form')!;

    fireEvent.change(rateInput, { target: { value: '7.45' } });
    fireEvent.change(sourceInput, { target: { value: 'https://sbi.co.in/rates' } });
    fireEvent.submit(form);

    // Verify confirmation view appears
    expect(screen.getByText('Rate Revision Submitted for Audit')).toBeInTheDocument();
    expect(screen.getByText('7.45% p.a.')).toBeInTheDocument();

    // Verify localStorage persistence
    const reports = getStoredCommunityReports();
    expect(reports.length).toBe(1);
    expect(reports[0].bankId).toBe(testBank.id);
    expect(reports[0].reportedRate).toBe(7.45);
    expect(reports[0].status).toBe('pending_audit');
  });
});
