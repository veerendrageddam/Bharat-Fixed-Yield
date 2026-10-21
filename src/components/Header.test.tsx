import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Header } from './Header';

describe('Header Component UI & Accessibility', () => {
  const defaultProps = {
    activeTab: 'command-center',
    setActiveTab: vi.fn(),
    isDarkMode: false,
    toggleDarkMode: vi.fn(),
    onOpenSignIn: vi.fn(),
  };

  it('renders the brand lockup and skip link', () => {
    render(<Header {...defaultProps} />);
    expect(screen.getByText('Bharat Fixed Yield')).toBeInTheDocument();
    expect(screen.getByText(/RBI\/DICGC Indexed Bank Rates/i)).toBeInTheDocument();
    expect(screen.getByText('Skip to main content')).toBeInTheDocument();
  });

  it('renders main navigation links and indicates the active tab', () => {
    render(<Header {...defaultProps} />);
    const activeNavButton = screen.getByRole('button', { name: /^Yield Command Center \(FD & RD\)$/i });
    expect(activeNavButton).toBeInTheDocument();
    expect(activeNavButton).toHaveAttribute('aria-current', 'page');
  });

  it('calls setActiveTab when a navigation link is clicked', () => {
    const setActiveTab = vi.fn();
    render(<Header {...defaultProps} setActiveTab={setActiveTab} />);
    const dicgcTab = screen.getByRole('button', { name: /DICGC Safety Index/i });
    fireEvent.click(dicgcTab);
    expect(setActiveTab).toHaveBeenCalledWith('dicgc-index');
  });

  it('toggles dark mode when dark mode button is clicked', () => {
    const toggleDarkMode = vi.fn();
    render(<Header {...defaultProps} toggleDarkMode={toggleDarkMode} />);
    const toggleBtn = screen.getByLabelText(/Switch to Dark Mode/i);
    fireEvent.click(toggleBtn);
    expect(toggleDarkMode).toHaveBeenCalledTimes(1);
  });

  it('opens sign in modal when Sign In CTA is clicked', () => {
    const onOpenSignIn = vi.fn();
    render(<Header {...defaultProps} onOpenSignIn={onOpenSignIn} />);
    const signInBtn = screen.getByRole('button', { name: /^Sign In$/i });
    fireEvent.click(signInBtn);
    expect(onOpenSignIn).toHaveBeenCalledTimes(1);
  });

  it('toggles mobile menu on mobile menu button click', () => {
    render(<Header {...defaultProps} />);
    const menuBtn = screen.getByLabelText(/Open mobile menu/i);
    fireEvent.click(menuBtn);
    expect(screen.getByLabelText(/Close mobile menu/i)).toBeInTheDocument();
  });
});
