import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface FooterProps {
  onNavClick: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavClick }) => {
  return (
    <footer className="w-full bg-[#f2f4f6] dark:bg-[#11161d] py-10 border-t border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex flex-col gap-8">
        {/* Top Header & Links */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-4">
          <div className="flex items-center gap-3">
            <img
              alt="Bharat Fixed Yield Logo"
              className="h-8 w-auto object-contain"
              src="https://lh3.googleusercontent.com/aida/AEtjO1WBAhIy1NZ4VvoiyE4brhlyXhFDBXuSSQOo59-fpOgU9WCH1iTm9iXiC28WlZFu1NODODbGY5FJsSkuuM8h1rjp7UU03nURffzu7_xlmS6-DOuvwAeetxe__zZCKlPVmSyI0n1FgizL4IlFgOhjLa8pPpJtFoe_PN8bhhltNQlSBMGBHB2hKlOPgzxSgnm47L93BcjyPga1JwfZjDrikgZrz2BgkjLuJByKz063bTv91vzbwPvlR6g2ffUo"
            />
            <span className="font-bold text-lg text-slate-900 dark:text-white">Bharat Fixed Yield</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <button
              onClick={() => onNavClick('calculator')}
              className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              FD/RD Calculators
            </button>
            <button
              onClick={() => onNavClick('comparisons')}
              className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Scheduled Banks
            </button>
            <button
              onClick={() => onNavClick('tax-guide')}
              className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Form 15G / 15H Provisions
            </button>
            <button
              onClick={() => onNavClick('dicgc-index')}
              className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              DICGC Coverage Scheme
            </button>
          </div>
        </div>

        {/* DICGC Notice Box */}
        <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#006c4a] dark:text-[#10b981]" />
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              DICGC Statutory Deposit Insurance Notice
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Under the Deposit Insurance and Credit Guarantee Corporation (DICGC) Act, cumulative principal and accrued interest
            deposits across savings, fixed (FD), and recurring (RD) accounts are insured up to a ceiling of{' '}
            <strong className="text-slate-900 dark:text-slate-200">₹5,00,000 (Rupees Five Lakh)</strong> per depositor,
            per scheduled commercial or small finance bank in the same capacity and right.
          </p>
        </div>

        {/* Copyright and Regulatory Statement */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 text-slate-500 dark:text-slate-400 text-xs">
          <p className="max-w-3xl leading-relaxed">
            Yield analytics and compounding schedules comply with Reserve Bank of India (RBI) Master Directions on Interest
            Rates on Deposits. Figures displayed are for calculation and statutory illustrative purposes.
          </p>
          <p className="shrink-0">© 2025 Bharat Fixed Yield Platform. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
