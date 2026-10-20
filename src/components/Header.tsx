import React from 'react';
import { Sun, Moon, ShieldCheck, Menu, X, User } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  onOpenSignIn: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isDarkMode,
  toggleDarkMode,
  onOpenSignIn,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems = [
    { id: 'command-center', label: 'Yield Command Center (FD & RD)' },
    { id: 'dicgc-index', label: 'DICGC Safety Index' },
    { id: 'tax-guide', label: 'Tax & TDS Guide (15G/15H)' },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 bg-[#006c4a] text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-xl focus:outline-hidden focus:ring-2 focus:ring-white"
      >
        Skip to main content
      </a>

      <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#161b22]/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 transition-colors shadow-xs">
        <div className="h-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex items-center justify-between gap-4">
          {/* Brand Lockup */}
          <button
            onClick={() => handleNavClick('command-center')}
            className="flex items-center gap-3 text-left rounded-xl p-1 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 group"
            aria-label="Bharat Fixed Yield - Return to Yield Command Center"
          >
            <img
              alt="Bharat Fixed Yield Logo"
              className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
              src="https://lh3.googleusercontent.com/aida/AEtjO1WBAhIy1NZ4VvoiyE4brhlyXhFDBXuSSQOo59-fpOgU9WCH1iTm9iXiC28WlZFu1NODODbGY5FJsSkuuM8h1rjp7UU03nURffzu7_xlmS6-DOuvwAeetxe__zZCKlPVmSyI0n1FgizL4IlFgOhjLa8pPpJtFoe_PN8bhhltNQlSBMGBHB2hKlOPgzxSgnm47L93BcjyPga1JwfZjDrikgZrz2BgkjLuJByKz063bTv91vzbwPvlR6g2ffUo"
            />
            <div className="flex flex-col justify-center">
              <span className="font-bold text-lg sm:text-xl text-slate-900 dark:text-white leading-tight">
                Bharat Fixed Yield
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                RBI/DICGC Indexed Bank Rates
              </span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center gap-1.5" aria-label="Main Navigation">
            {navItems.map((item) => {
              const isActive =
                activeTab === item.id ||
                (item.id === 'command-center' && (activeTab === 'comparisons' || activeTab === 'calculator'));
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-150 whitespace-nowrap focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                    isActive
                      ? 'bg-slate-200/70 dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Header Right Macro Chips & Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* RBI Repo Rate Chip */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800/80 rounded-full border border-slate-200/60 dark:border-slate-700">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">RBI Repo Rate:</span>
              <span className="text-xs text-[#006c4a] dark:text-[#10b981] font-bold tabular-nums">6.50%</span>
            </div>

            {/* DICGC ₹5L Insured Capsule */}
            <div className="hidden sm:flex items-center gap-1 px-3 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-[#00714e] dark:text-[#a7f3d0] rounded-full border border-emerald-200 dark:border-emerald-800/60">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00714e] dark:text-[#10b981]" />
              <span className="text-xs font-bold tracking-tight">DICGC ₹5L Insured</span>
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* Sign In CTA */}
            <button
              onClick={onOpenSignIn}
              className="hidden lg:inline-flex items-center justify-center px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              Sign In
            </button>

            {/* User Icon Avatar */}
            <button
              onClick={onOpenSignIn}
              aria-label="User Account Profile"
              className="w-8 h-8 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center hover:opacity-90 transition-opacity focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <User className="w-4 h-4" />
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
              aria-label={mobileMenuOpen ? 'Close mobile menu' : 'Open mobile menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-white dark:bg-[#161b22] border-b border-slate-200 dark:border-slate-800 px-4 py-4 flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {item.label}
              </button>
            );
          })}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>RBI Repo: 6.50%</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">DICGC ₹5 Lakh Insured</span>
          </div>
        </div>
      )}
    </header>
  </>
  );
};
